import express from "express"
import { randomUUID } from "crypto"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = Number(process.env.PORT) || 3000
const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"))

function nuevoLibro({ titulo, autor, genero, año, disponible }) {
  return {
    id: randomUUID(),
    titulo,
    autor,
    genero,
    año,
    disponible,
  }
}

let libros = [
  nuevoLibro({
    titulo: "Cien años de soledad",
    autor: "Gabriel García Márquez",
    genero: "realismo mágico",
    año: 1967,
    disponible: true,
  }),
  nuevoLibro({
    titulo: "1984",
    autor: "George Orwell",
    genero: "ficción",
    año: 1949,
    disponible: true,
  }),
  nuevoLibro({
    titulo: "El nombre del viento",
    autor: "Patrick Rothfuss",
    genero: "fantasía",
    año: 2007,
    disponible: false,
  }),
  nuevoLibro({
    titulo: "Sapiens",
    autor: "Yuval Noah Harari",
    genero: "no ficción",
    año: 2011,
    disponible: true,
  }),
]

const app = express()
app.use(express.json())

function htmlDocumentacion() {
  const endpoints = [
    ["GET", "/", "Documentación HTML de la API"],
    ["GET", "/info", "JSON: mensaje, curso, tecnologia, version"],
    ["GET", "/saludo", "Texto plano: saludo (?nombre= opcional)"],
    ["GET", "/api/status", "JSON: ok, status, puerto, timestamp"],
    ["GET", "/api/libros", "Lista de libros (?genero= & ?disponible=)"],
    ["GET", "/api/libros/:id", "Un libro por ID"],
    ["POST", "/api/libros", "Crear libro (JSON body)"],
    ["PUT", "/api/libros/:id", "Reemplazo completo"],
    ["PATCH", "/api/libros/:id", "Actualización parcial"],
    ["DELETE", "/api/libros/:id", "Eliminar por ID"],
  ]
  const filas = endpoints
    .map(
      ([metodo, ruta, desc]) =>
        `<tr><td><code>${metodo}</code></td><td><code>${ruta}</code></td><td>${desc}</td></tr>`
    )
    .join("")
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>API Biblioteca — Libros</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    h1 { color: #1a1a2e; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #ccc; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #16213e; color: #fff; }
    tr:nth-child(even) { background: #f8f9fa; }
    code { background: #eee; padding: 0.1rem 0.35rem; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Biblioteca — API REST (recurso: libros)</h1>
  <p>Propiedades de cada libro: <code>id</code>, <code>titulo</code>, <code>autor</code>, <code>genero</code>, <code>año</code>, <code>disponible</code>.</p>
  <table>
    <thead><tr><th>Método</th><th>Ruta</th><th>Descripción</th></tr></thead>
    <tbody>${filas}</tbody>
  </table>
</body>
</html>`
}

app.get("/", (req, res) => {
  res.type("html").send(htmlDocumentacion())
})

app.get("/info", (req, res) => {
  res.json({
    mensaje: "API REST de la biblioteca (gestión de libros)",
    curso: "Sistemas y Tecnologías Web",
    tecnologia: "Node.js + Express",
    version: pkg.version,
  })
})

app.get("/saludo", (req, res) => {
  const nombre = typeof req.query.nombre === "string" ? req.query.nombre.trim() : ""
  const quien = nombre || "visitante"
  res.type("text/plain; charset=utf-8").send(`¡Hola, ${quien}! Bienvenido a la API de la biblioteca.`)
})

app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    status: "operativo",
    puerto: PORT,
    timestamp: new Date().toISOString(),
  })
})

const CAMPOS_LIBRO = ["titulo", "autor", "genero", "año", "disponible"]

function faltantesCrear(body) {
  const faltan = []
  for (const campo of CAMPOS_LIBRO) {
    if (body[campo] === undefined || body[campo] === null) faltan.push(campo)
  }
  return faltan
}

function faltantesPut(body) {
  return faltantesCrear(body)
}

function normalizarLibroBody(body, { parcial }) {
  const out = {}
  if (!parcial || body.titulo !== undefined) out.titulo = body.titulo
  if (!parcial || body.autor !== undefined) out.autor = body.autor
  if (!parcial || body.genero !== undefined) out.genero = body.genero
  if (!parcial || body.año !== undefined) out.año = body.año
  if (!parcial || body.disponible !== undefined) out.disponible = body.disponible
  return out
}

function validarTiposLibro(datos, { parcial }) {
  const errores = []
  const check = (campo, ok, msg) => {
    if (!parcial && datos[campo] === undefined) return
    if (parcial && datos[campo] === undefined) return
    if (!ok) errores.push(msg)
  }
  check("titulo", typeof datos.titulo === "string" && datos.titulo.trim() !== "", "titulo debe ser un string no vacío")
  check("autor", typeof datos.autor === "string" && datos.autor.trim() !== "", "autor debe ser un string no vacío")
  check("genero", typeof datos.genero === "string" && datos.genero.trim() !== "", "genero debe ser un string no vacío")
  check("año", typeof datos.año === "number" && Number.isInteger(datos.año), "año debe ser un número entero")
  check(
    "disponible",
    typeof datos.disponible === "boolean",
    "disponible debe ser boolean (true o false)"
  )
  return errores
}

function sinTildes(s) {
  return String(s)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
}

app.get("/api/libros", (req, res) => {
  try {
    let lista = [...libros]
    const generoQ = req.query.genero
    if (generoQ !== undefined && String(generoQ).trim() !== "") {
      const g = sinTildes(generoQ.trim())
      lista = lista.filter((l) => sinTildes(l.genero) === g)
    }
    const dispQ = req.query.disponible
    if (dispQ !== undefined && String(dispQ).trim() !== "") {
      const val = String(dispQ).toLowerCase()
      const bool = val === "true" || val === "1" || val === "si" || val === "sí"
      const boolFalse = val === "false" || val === "0" || val === "no"
      if (boolFalse) lista = lista.filter((l) => l.disponible === false)
      else if (bool || val === "true") lista = lista.filter((l) => l.disponible === true)
    }
    res.json({ ok: true, data: lista })
  } catch {
    res.status(500).json({ ok: false, error: "Error interno del servidor" })
  }
})

app.get("/api/libros/:id", (req, res) => {
  const libro = libros.find((l) => l.id === req.params.id)
  if (!libro) {
    return res.status(404).json({ ok: false, error: "Libro no encontrado" })
  }
  res.json({ ok: true, data: libro })
})

app.post("/api/libros", (req, res) => {
  const faltan = faltantesCrear(req.body || {})
  if (faltan.length > 0) {
    return res.status(400).json({
      ok: false,
      error: `Faltan campos obligatorios: ${faltan.join(", ")}`,
    })
  }
  const datos = normalizarLibroBody(req.body, { parcial: false })
  const tipos = validarTiposLibro(datos, { parcial: false })
  if (tipos.length > 0) {
    return res.status(400).json({ ok: false, error: tipos.join("; ") })
  }
  const libro = nuevoLibro(datos)
  libros.push(libro)
  res.status(201).json({ ok: true, data: libro })
})

app.put("/api/libros/:id", (req, res) => {
  const idx = libros.findIndex((l) => l.id === req.params.id)
  if (idx === -1) {
    return res.status(404).json({ ok: false, error: "Libro no encontrado" })
  }
  const faltan = faltantesPut(req.body || {})
  if (faltan.length > 0) {
    return res.status(400).json({
      ok: false,
      error: `Para reemplazo completo faltan campos: ${faltan.join(", ")}`,
    })
  }
  const datos = normalizarLibroBody(req.body, { parcial: false })
  const tipos = validarTiposLibro(datos, { parcial: false })
  if (tipos.length > 0) {
    return res.status(400).json({ ok: false, error: tipos.join("; ") })
  }
  const actualizado = { id: libros[idx].id, ...datos }
  libros[idx] = actualizado
  res.json({ ok: true, data: actualizado })
})

app.patch("/api/libros/:id", (req, res) => {
  const idx = libros.findIndex((l) => l.id === req.params.id)
  if (idx === -1) {
    return res.status(404).json({ ok: false, error: "Libro no encontrado" })
  }
  const body = req.body || {}
  const claves = Object.keys(body).filter((k) => CAMPOS_LIBRO.includes(k))
  if (claves.length === 0) {
    return res.status(400).json({
      ok: false,
      error: "No se envió ningún campo válido para actualizar (titulo, autor, genero, año, disponible)",
    })
  }
  const merged = { ...libros[idx] }
  for (const k of claves) merged[k] = body[k]
  const parcialDatos = {}
  for (const k of claves) parcialDatos[k] = merged[k]
  const tipos = validarTiposLibro(parcialDatos, { parcial: true })
  if (tipos.length > 0) {
    return res.status(400).json({ ok: false, error: tipos.join("; ") })
  }
  libros[idx] = merged
  res.json({ ok: true, data: merged })
})

app.delete("/api/libros/:id", (req, res) => {
  const idx = libros.findIndex((l) => l.id === req.params.id)
  if (idx === -1) {
    return res.status(404).json({ ok: false, error: "Libro no encontrado" })
  }
  const [eliminado] = libros.splice(idx, 1)
  res.json({ ok: true, data: eliminado })
})

app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    ruta: req.originalUrl.split("?")[0],
    metodo: req.method,
    sugerencia: "Visita / para ver los endpoints disponibles",
  })
})

app.use((err, req, res, next) => {
  console.error(err)
  if (res.headersSent) return next(err)
  res.status(500).json({ ok: false, error: "Error interno del servidor" })
})

app.listen(PORT, () => {
  console.log(`API Biblioteca en http://localhost:${PORT}`)
})
