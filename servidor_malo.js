import http from "http"
import fs from "fs/promises"
import path from "path"

const PORT = 3000

const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" })
    res.end("Servidor activo")
    return
  }

  if (req.url === "/info") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
    res.end(JSON.stringify({ mensaje: "Ruta de información" }))
    return
  }

  if (req.url === "/api/student") {
    try {
      const filePath = path.join(process.cwd(), "datos.json")
      const texto = await fs.readFile(filePath, "utf-8")
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
      res.end(texto)
    } catch {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" })
      res.end(JSON.stringify({ error: "No se pudo leer datos.json" }))
    }
    return
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
  res.end("Ruta no encontrada")
})

server.listen(PORT, () => {
  console.log("Servidor corriendo en http://localhost:3000")
})
