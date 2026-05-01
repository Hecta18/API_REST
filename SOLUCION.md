# Documentación de errores y correcciones — `servidor_malo.js`

Se revisó el archivo original según sintaxis, asincronía, cabeceras HTTP y códigos de estado. Las **ubicaciones** corresponden al archivo **antes** de aplicar correcciones.

---

### Error #1: Uso de `import` con el proyecto en modo CommonJS

**Ubicación:** Línea 1 (y `package.json`, campo `"type"`)

**Tipo de error:** Sintaxis (módulos ES)

**Qué estaba mal:** El archivo usa sintaxis ESM (`import`), pero `package.json` tenía `"type": "commonjs"`. Node trata los `.js` como CommonJS y lanza `SyntaxError: Cannot use import statement outside a module`, por lo que el archivo no se ejecuta.

**Cómo lo corregí:**

- **Antes (`package.json`):** `"type": "commonjs"`
- **Después:** `"type": "module"`

No fue necesario reescribir los `import` a `require()`.

**Por qué funciona ahora:** Con `"type": "module"`, Node interpreta los `.js` del paquete como módulos ES y acepta `import`/`export`.

---

### Error #2: Falta el paréntesis de cierre de `http.createServer(...)`

**Ubicación:** Línea 30 del archivo original

**Tipo de error:** Sintaxis

**Qué estaba mal:** Tras el cuerpo del callback `async (req, res) => { ... }` solo había `}`, que cierra el bloque de la función flecha, pero no el paréntesis de la llamada `createServer( ... )`. El parser espera `)` antes de `;` o fin de instrucción.

**Cómo lo corregí:**

- **Antes:** `res.end("Ruta no encontrada")\n}`
- **Después:** `res.end("Ruta no encontrada")\n})`

**Por qué funciona ahora:** `})` cierra primero el bloque `}` del callback y luego `)` la invocación `http.createServer(...)`, dejando la expresión completa asignable a `server`.

---

### Error #3: Falta el paréntesis de cierre de `server.listen(...)`

**Ubicación:** Líneas 32–34 del archivo original

**Tipo de error:** Sintaxis

**Qué estaba mal:** `server.listen(PORT, () => { ... }` cerraba el callback interno con `}` pero faltaba `)` para cerrar la llamada a `listen`.

**Cómo lo corregí:**

- **Antes:**

```javascript
server.listen(PORT, () => {
  console.log("Servidor corriendo en http://localhost:3000")
}
```

- **Después:**

```javascript
server.listen(PORT, () => {
  console.log("Servidor corriendo en http://localhost:3000")
})
```

**Por qué funciona ahora:** El `)` final cierra `server.listen(PORT, callback)` y el archivo queda sintácticamente válido.

---

### Error #4: `Content-Type` incorrecto en `/info` (`application-json`)

**Ubicación:** Línea 15 del archivo original

**Tipo de error:** HTTP

**Qué estaba mal:** `application-json` no es un tipo MIME registrado. El estándar para JSON es `application/json`. Además, el cuerpo era la cadena plana `"Ruta de información"`, no un documento JSON válido (un JSON sería por ejemplo `"Ruta de información"` entre comillas en el wire, o un objeto `{"mensaje":"..."}`).

**Cómo lo corregí:**

- **Antes:** `res.writeHead(200, { "Content-Type": "application-json" })` y `res.end("Ruta de información")`
- **Después:** `res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })` y `res.end(JSON.stringify({ mensaje: "Ruta de información" }))`

**Por qué funciona ahora:** El cliente recibe el MIME correcto y un cuerpo que es JSON parseable, coherente con la cabecera.

---

### Error #5: `fs.readFile` sin `await` (promesa no resuelta)

**Ubicación:** Línea 22 del archivo original

**Tipo de error:** Asincronía

**Qué estaba mal:** `fs.readFile` de `fs/promises` devuelve una `Promise`. Sin `await`, la variable `texto` es la promesa, no el contenido del archivo.

**Cómo lo corregí:**

- **Antes:** `const texto = fs.readFile(filePath, "utf-8")`
- **Después:** `const texto = await fs.readFile(filePath, "utf-8")`

**Por qué funciona ahora:** `await` suspende el handler hasta que la lectura termina y `texto` pasa a ser el string UTF-8 del archivo.

---

### Error #6: `JSON.stringify` sobre el valor equivocado (promesa o doble codificación)

**Ubicación:** Línea 24 del archivo original

**Tipo de error:** Lógica

**Qué estaba mal:** Con la promesa sin resolver, `JSON.stringify(texto)` serializa un objeto `Promise` de forma inútil para el cliente. Incluso con `await`, si el archivo ya es JSON en texto, volver a `JSON.stringify` al string completo envuelve el JSON en otra cadena JSON (doble codificación) y no coincide con el objeto esperado en `/api/student`.

**Cómo lo corregí:**

- **Antes:** `res.end(JSON.stringify(texto))`
- **Después:** `res.end(texto)` (tras `await fs.readFile`, `texto` es el JSON crudo de `datos.json`)

**Por qué funciona ahora:** Se envía el mismo JSON válido que está en disco, con `Content-Type: application/json`, sin transformarlo en una cadena escapada dentro de otra cadena.

---

### Error #7: Código de estado 200 para “ruta no encontrada”

**Ubicación:** Líneas 28–29 del archivo original

**Tipo de error:** HTTP (respuesta)

**Qué estaba mal:** Las rutas no definidas respondían `200 OK` con el mensaje “Ruta no encontrada”, lo que contradice el significado HTTP: el recurso no existe, debería ser error del cliente `404 Not Found`.

**Cómo lo corregí:**

- **Antes:** `res.writeHead(200, { "Content-Type": "text/plain" })`
- **Después:** `res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })`

**Por qué funciona ahora:** Los clientes y proxies pueden distinguir éxito de recurso inexistente; `charset=utf-8` aclara la codificación del cuerpo.

---

### Error #8: Fallo de lectura sin manejo (promesa rechazada)

**Ubicación:** Bloque `/api/student`, líneas 20–25 del archivo original

**Tipo de error:** Asincronía / Lógica

**Qué estaba mal:** Si `readFile` falla (archivo ausente, permisos, etc.), la promesa rechaza. En un `async` handler de `http.createServer` sin `try/catch`, eso puede generar un rechazo no manejado y una respuesta inconsistente o proceso inestable.

**Cómo lo corregí:** Se envolvió la lectura y el `writeHead`/`end` de éxito en `try { ... } catch { ... }` respondiendo `500` con un JSON de error.

**Por qué funciona ahora:** Los errores de E/S se traducen en una respuesta HTTP explícita y el flujo async no deja rechazos sin capturar en ese camino.

---

## Resumen

| # | Tema                         | Acción principal                                      |
|---|------------------------------|--------------------------------------------------------|
| 1 | ESM vs CommonJS              | `"type": "module"` en `package.json`                  |
| 2 | Sintaxis `createServer`      | Cerrar con `})`                                       |
| 3 | Sintaxis `listen`            | Cerrar callback con `})`                              |
| 4 | MIME y cuerpo `/info`        | `application/json` + `JSON.stringify({...})`         |
| 5 | Promesa `readFile`          | `await fs.readFile(...)`                              |
| 6 | Cuerpo `/api/student`       | `res.end(texto)` sin doble `stringify`                |
| 7 | Ruta desconocida            | `404` en lugar de `200`                               |
| 8 | Errores de lectura          | `try/catch` y `500` con JSON de error                 |

Tras las correcciones, puede verificarse con:

`node servidor_malo.js`

y probando `http://localhost:3000/`, `/info`, `/api/student` y una ruta inexistente.
