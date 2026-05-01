# API REST — Biblioteca

REST API built with Node.js and Express for managing a library book collection. Includes a second file, `servidor_malo.js`, which serves as a corrected reference exercise documenting common HTTP server errors and their fixes.

---

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Running the Server](#running-the-server)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
  - [General Endpoints](#general-endpoints)
  - [Book Endpoints](#book-endpoints)
- [Book Schema](#book-schema)
- [Query Parameters](#query-parameters)
- [Error Handling](#error-handling)
- [Exercise File: servidor_malo.js](#exercise-file-servidor_malojs)
- [License](#license)

---

## Requirements

- Node.js >= 18
- npm >= 9

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Hecta18/API_REST.git
cd API_REST
npm install
```

---

## Running the Server

```bash
npm start
```

The server starts on port `3000` by default. To use a different port, set the `PORT` environment variable before starting:

```bash
# Linux / macOS
PORT=3001 npm start

# Windows PowerShell
$env:PORT=3001; npm start
```

Once running, open `http://localhost:3000` in a browser to view the full endpoint documentation rendered as HTML.

---

## Project Structure

```
API_REST/
├── index.js            # Main application entry point (Express API)
├── servidor_malo.js    # Corrected exercise file (raw http module)
├── datos.json          # Student data served by servidor_malo.js
├── package.json
├── package-lock.json
├── SOLUCION.md         # Documented errors and corrections for servidor_malo.js
├── .gitignore
└── LICENSE
```

---

## API Reference

### General Endpoints

| Method | Route         | Description                                              |
|--------|---------------|----------------------------------------------------------|
| GET    | `/`           | HTML documentation listing all available endpoints       |
| GET    | `/info`       | Returns API metadata: message, course, technology, version |
| GET    | `/saludo`     | Plain text greeting. Accepts optional `?nombre=` query   |
| GET    | `/api/status` | Returns server status, active port, and current timestamp |

**Example — `/info` response:**

```json
{
  "mensaje": "API REST de la biblioteca (gestión de libros)",
  "curso": "Sistemas y Tecnologías Web",
  "tecnologia": "Node.js + Express",
  "version": "1.0.0"
}
```

**Example — `/saludo` response:**

```
GET /saludo?nombre=Ana
-> ¡Hola, Ana! Bienvenido a la API de la biblioteca.
```

---

### Book Endpoints

All book endpoints are under `/api/libros`. Responses wrap data in an envelope:

```json
{ "ok": true, "data": { ... } }
```

| Method | Route               | Description                        |
|--------|---------------------|------------------------------------|
| GET    | `/api/libros`       | List all books (filterable)        |
| GET    | `/api/libros/:id`   | Retrieve a single book by UUID     |
| POST   | `/api/libros`       | Create a new book                  |
| PUT    | `/api/libros/:id`   | Full replacement of a book         |
| PATCH  | `/api/libros/:id`   | Partial update of a book           |
| DELETE | `/api/libros/:id`   | Delete a book by UUID              |

---

## Book Schema

Each book has the following fields:

| Field       | Type    | Required | Description                        |
|-------------|---------|----------|------------------------------------|
| `id`        | string  | Auto     | UUID generated on creation         |
| `titulo`    | string  | Yes      | Book title (non-empty)             |
| `autor`     | string  | Yes      | Author name (non-empty)            |
| `genero`    | string  | Yes      | Genre (non-empty)                  |
| `año`       | integer | Yes      | Publication year                   |
| `disponible`| boolean | Yes      | Availability status                |

**Example request body for POST / PUT:**

```json
{
  "titulo": "Don Quijote de la Mancha",
  "autor": "Miguel de Cervantes",
  "genero": "novela",
  "año": 1605,
  "disponible": true
}
```

**Example PATCH body (partial update):**

```json
{
  "disponible": false
}
```

---

## Query Parameters

The `GET /api/libros` endpoint supports the following optional filters:

| Parameter    | Type    | Description                                              |
|--------------|---------|----------------------------------------------------------|
| `genero`     | string  | Filter by genre. Accent-insensitive and case-insensitive |
| `disponible` | boolean | Filter by availability. Accepts `true`, `false`, `1`, `0`, `si`, `no` |

**Examples:**

```
GET /api/libros?genero=fantasía
GET /api/libros?disponible=true
GET /api/libros?genero=ficción&disponible=false
```

---

## Error Handling

The API returns structured JSON errors for all failure cases:

| Status | Meaning                         |
|--------|---------------------------------|
| 400    | Missing or invalid request body |
| 404    | Book or route not found         |
| 500    | Internal server error           |

**Example 404 response:**

```json
{
  "ok": false,
  "error": "Libro no encontrado"
}
```

**Unknown route response:**

```json
{
  "error": "Ruta no encontrada",
  "ruta": "/api/unknown",
  "metodo": "GET",
  "sugerencia": "Visita / para ver los endpoints disponibles"
}
```

---

## Exercise File: servidor_malo.js

`servidor_malo.js` is a standalone HTTP server built with Node's native `http` module (no Express). It was originally written with deliberate errors as a debugging exercise for the course *Sistemas y Tecnologías Web*.

The corrected version serves three routes:

| Route          | Description                                    |
|----------------|------------------------------------------------|
| `/`            | Plain text: `Servidor activo`                  |
| `/info`        | JSON with an informational message             |
| `/api/student` | JSON with student data read from `datos.json`  |

All other routes return `404 Not Found`.

The full list of eight errors found and corrected — covering ESM/CommonJS conflicts, syntax errors, wrong MIME types, missing `await`, and incorrect HTTP status codes — is documented in [`SOLUCION.md`](./SOLUCION.md).

To run this file independently:

```bash
node servidor_malo.js
```

> Both `index.js` and `servidor_malo.js` default to port 3000. Do not run them simultaneously unless you change the port of one of them.

---

## License

This project is distributed under the GNU General Public License v3.0. See the [`LICENSE`](./LICENSE) file for full terms.
