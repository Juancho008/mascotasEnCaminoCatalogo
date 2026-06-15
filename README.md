# 🐾 Catálogo Mascotas en Camino

Catálogo de productos para mascotas **configurable**, hecho en **React + Node**, **sin base de datos**.
El inventario se arma automáticamente a partir de las carpetas de imágenes y los precios/datos se editan desde archivos JSON. Incluye **carrito temporal** (se borra al cerrar la pestaña) y botón de **comprar por WhatsApp** con el detalle del pedido.

---

## 🚀 Cómo arrancarlo

Requiere [Node.js](https://nodejs.org) 18 o superior.

### 1. Instalar dependencias (una sola vez)

```bash
npm run install:all
```

### 2. Desarrollo (con recarga automática)

```bash
npm run dev
```

- Frontend (Vite): http://localhost:5173 ← **abrí esta**
- Backend (API): http://localhost:4000

### 3. Producción (un solo servidor)

```bash
npm run build
npm start
```

Luego abrí http://localhost:4000 (sirve la web ya compilada + la API + las imágenes).

---

## 🗂️ Cómo agregar productos (inventario)

El inventario son **carpetas con imágenes** dentro de la carpeta `src/`.
**Cada carpeta es una categoría** y **cada imagen es un producto**.

```
src/
├── Collares/        ← categoría "Collares"
│   ├── Collar-1.jpeg   ← producto
│   ├── Collar-2.jpeg
│   └── ...
├── Camas/           ← nueva categoría (creala y listo)
│   ├── Cama-1.jpg
│   └── Cama-2.jpg
└── Juguetes/
    └── Pelota.png
```

- Para **agregar un producto**: copiá una imagen dentro de la carpeta de la categoría.
- Para **agregar una categoría**: creá una carpeta nueva con imágenes adentro.
- Formatos soportados: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`.

No hace falta tocar código: al recargar, los nuevos productos/categorías aparecen solos.

---

## ⚙️ Configuración (todo editable en JSON)

### `config/site.config.json` — datos generales del sitio

| Campo | Qué hace |
|-------|----------|
| `storeName` | Nombre de la tienda (título, header, footer). |
| `tagline` | Frase debajo del nombre. |
| `whatsappNumber` | **Número de WhatsApp** al que llega el pedido. Formato internacional sin `+` ni espacios (ej. Argentina: `5491133334444`). |
| `whatsappMessageHeader` | Texto que aparece arriba del pedido en WhatsApp. |
| `whatsappMessageFooter` | Texto que aparece abajo del pedido. |
| `currency` | Símbolo de moneda (ej. `$`). |
| `currencyPosition` | `before` (`$100`) o `after` (`100 $`). |
| `locale` | Formato de números (ej. `es-AR`). |
| `inventoryDir` | Carpeta donde están las imágenes del inventario (por defecto `src`). |
| `logo` | Ruta del logo. |
| `theme` | Colores del sitio (ver abajo). |
| `categories` | Datos por categoría: nombre visible, emoji, descripción, precio por defecto y orden. |

> ⚠️ **Importante:** cambiá `whatsappNumber` por tu número real. Por defecto está `5491100000000` (de ejemplo).

#### Ejemplo de categoría en `site.config.json`

```json
"categories": {
  "Collares": {
    "label": "Collares",
    "emoji": "🦴",
    "description": "Collares cómodos y resistentes",
    "defaultPrice": 4500,
    "order": 1
  }
}
```

`defaultPrice` se usa para los productos de esa categoría que no tengan precio propio en `products.json`.

#### Colores (`theme`)

```json
"theme": {
  "primary":    "#E23B3B",
  "secondary":  "#1F3A5F",
  "accent":     "#FF8FA3",
  "background": "#FFF7F1",
  "surface":    "#FFFFFF",
  "text":       "#243447",
  "muted":      "#7A8AA0"
}
```

### `config/products.json` — precios y datos por producto

La **clave** es `Categoría/NombreDelArchivo` (igual que en `src/`).

```json
{
  "Collares/Collar-1.jpeg": {
    "name": "Collar Aventura",
    "price": 4500,
    "description": "Collar resistente ideal para paseos largos.",
    "tags": ["nuevo"]
  }
}
```

| Campo | Opcional | Qué hace |
|-------|----------|----------|
| `name` | sí | Nombre del producto. Si falta, se usa el nombre del archivo. |
| `price` | sí | Precio. Si falta, usa el `defaultPrice` de la categoría. `0` muestra "Consultar". |
| `description` | sí | Descripción corta. |
| `tags` | sí | Etiquetas visuales: `nuevo`, `destacado`, `oferta`. |
| `available` | sí | `false` deshabilita el botón "Agregar". |

> No es obligatorio listar todos los productos: los que no aparezcan toman el nombre del archivo y el precio por defecto de la categoría.

---

## 🛒 Carrito temporal

El carrito se guarda en `sessionStorage`: persiste mientras la persona navega, pero **se borra al cerrar la pestaña**. No hay base de datos ni datos guardados en el servidor.

## 💬 Comprar por WhatsApp

Al tocar **"Pedir por WhatsApp"** se abre un chat con el `whatsappNumber` configurado y un mensaje pre-armado con cada producto, cantidad, subtotal y total.

---

## ☁️ Subirlo a Vercel (gratis, sin servidor)

En Vercel el sitio se publica como **estático**: al hacer el build se genera un
`catalog.json` y se copian las imágenes, así no hace falta un servidor corriendo.

### Opción A — Desde la web de Vercel (recomendada)

1. Subí el proyecto a un repo de GitHub/GitLab (asegurate de **commitear las carpetas `src/` e `images/`**, que son el inventario).
2. Entrá a [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo.
3. El `vercel.json` ya deja todo configurado (build estático con `@vercel/static-build`,
   salida en `client/dist`). **No toques** los campos de Build/Output del panel: los maneja el `vercel.json`.
4. Tocá **Deploy**. En ~1 minuto tenés la URL pública. 🎉

> ℹ️ El `vercel.json` fuerza un **build estático**. Esto evita que Vercel intente
> desplegar el proyecto como un servidor Node por la dependencia `express` (que solo
> se usa en local), error que se ve como `No entrypoint found`.

### Opción B — Desde la terminal (CLI)

```bash
npm i -g vercel
vercel          # primer deploy (preview)
vercel --prod   # deploy a producción
```

### Cómo actualizar precios o productos en Vercel

Como es estático, los cambios se aplican **al volver a desplegar**:

1. Editá `config/products.json` / `config/site.config.json`, o agregá imágenes en `src/`.
2. `git commit` + `git push` (o `vercel --prod`).
3. Vercel reconstruye solo y publica los cambios.

> 💡 Probar el build estático en tu compu antes de subir: `npm run vercel-build` y luego `npm --prefix client run preview`.

---

## 📁 Estructura del proyecto

```
.
├── config/                 ← configuración editable (JSON)
│   ├── site.config.json
│   └── products.json
├── src/                    ← inventario (carpetas de imágenes = categorías)
│   └── Collares/*.jpeg
├── images/Logo/            ← logo del sitio
├── server/                 ← backend Node/Express
│   ├── index.js
│   └── catalog.js          ← escanea carpetas + combina con los JSON
├── client/                 ← frontend React (Vite + Framer Motion)
│   └── src/
├── scripts/
│   └── build-static.mjs    ← genera el sitio estático para Vercel
├── vercel.json             ← config de despliegue en Vercel
└── package.json
```
