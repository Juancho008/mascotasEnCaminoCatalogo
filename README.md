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

## ☁️ Cloudflare KV + Workers (API del catálogo)

Si querés que el catálogo **no esté “congelado” en un JSON estático** y se lea desde una API, podés usar **Cloudflare KV** con un **Worker**.

### Qué va en KV y qué no

| Dato | Dónde |
|------|--------|
| `catalog.json` (productos, precios, config del sitio) | **Cloudflare KV** |
| Imágenes (`src/`, `images/`) | Sigue en hosting estático (Vercel, Pages, etc.) |

KV guarda texto/JSON, no imágenes. Las fotos siguen sirviéndose como archivos estáticos.

### Arquitectura (con HMAC — recomendada en Vercel)

```
Navegador  ──GET /api/catalog──►  Vercel (función serverless)
                                       │ firma HMAC con secreto
                                       ▼
                                  Worker (Cloudflare)  ──►  KV["catalog"]
                                       ▲
                                       │ npm run kv:sync
```

El **secreto HMAC nunca va al navegador**. Vercel lo guarda como variable de servidor y firma cada pedido al Worker.

### Paso a paso

#### 1. Crear el namespace KV

1. Entrá a [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages** → **KV** → **Create a namespace**
3. Nombre sugerido: `mascotas-catalogo`
4. Copiá el **Namespace ID**

#### 2. Configurar `wrangler.toml`

En la raíz del proyecto, editá `wrangler.toml` y reemplazá los IDs:

```toml
[[kv_namespaces]]
binding = "KV_BINDING"
id = "TU_NAMESPACE_ID"
preview_id = "TU_NAMESPACE_ID"
```

#### 3. Instalar y loguearte en Cloudflare

```bash
npm install
npx wrangler login
```

#### 4. Subir el catálogo a KV

Esto genera `client/public/catalog.json` desde tus carpetas + JSON de config y lo sube a KV:

```bash
npm run kv:sync
```

#### 5. Configurar el secreto HMAC (mismo valor en Cloudflare y Vercel)

Generá un secreto largo (ej. 32+ caracteres aleatorios) y configurarlo en **ambos** lados:

```bash
# En Cloudflare (Worker)
npx wrangler secret put CATALOG_HMAC_SECRET

# Redeploy del Worker para aplicar el secret
npm run worker:deploy
```

En **Vercel** → Settings → Environment Variables (sin prefijo `VITE_`):

| Key | Value |
|-----|-------|
| `CATALOG_WORKER_URL` | `https://mascotas-catalogo-api.TU_SUBDOMINIO.workers.dev` |
| `CATALOG_HMAC_SECRET` | el mismo secreto que pusiste en Cloudflare |

> ⚠️ **No uses `VITE_`** para el secreto: cualquier variable `VITE_*` se embebe en el JavaScript del navegador y cualquiera podría leerla.

Si antes agregaste `VITE_CATALOG_API` apuntando al Worker, **eliminala** — ahora el frontend usa `/api/catalog` y el proxy de Vercel firma con HMAC.

#### 6. Redeploy en Vercel

Deployments → Redeploy. El sitio pedirá el catálogo a `/api/catalog` (mismo dominio), y Vercel hablará con Cloudflare usando el secreto.

#### 7. Probar el Worker en local (opcional)

```bash
npm run worker:dev
```

Sin firma HMAC, `/catalog.json` devuelve **401** si configuraste el secret. Eso es correcto: en producción solo Vercel puede pedir el catálogo.

### Desarrollo local con HMAC

Copiá `.env.example` a `.env` en la raíz con `CATALOG_WORKER_URL` y `CATALOG_HMAC_SECRET`. Express y Vite proxyean `/api/catalog` con la misma firma que en producción.

```bash
npm run dev
```

Si no configurás el `.env`, `/api/catalog` sirve el catálogo local (sin Cloudflare) para desarrollo simple.

### Endpoints del Worker

| Método | Ruta | Qué hace |
|--------|------|----------|
| `GET` | `/catalog.json` | Devuelve el catálogo desde KV (**requiere HMAC** si hay secret) |
| `GET` | `/api/catalog` | Igual que arriba |
| `GET` | `/api/health` | `{ ok: true, hasCatalog, hmacEnabled }` |
| `PUT` | `/api/catalog` | Actualiza KV (requiere token, ver abajo) |

### Actualizar precios/productos con KV

1. Editá `config/products.json`, `config/site.config.json` o agregá imágenes en `src/`
2. Volvé a subir:

```bash
npm run kv:sync
```

No hace falta redesplegar el Worker: solo actualizás la clave `catalog` en KV.

### (Opcional) Actualizar por API con token

Para un panel admin o script que haga `PUT` sin usar `wrangler`:

```bash
npx wrangler secret put ADMIN_TOKEN
```

Luego:

```bash
curl -X PUT "https://TU-WORKER.workers.dev/api/catalog" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d @client/public/catalog.json
```

---

## 🔐 Panel de administración (`/admin`)

Podés gestionar el catálogo desde el navegador sin usar la terminal.

### URL

```
https://TU-SITIO.vercel.app/admin
```

### Configuración requerida

**Cloudflare** (una vez):

```bash
npx wrangler secret put ADMIN_TOKEN
npm run worker:deploy
```

**Vercel** → Environment Variables:

| Key | Value |
|-----|-------|
| `ADMIN_PASSWORD` | contraseña que escribís en `/admin` |
| `ADMIN_TOKEN` | **el mismo valor** que en Cloudflare |

También necesitás `CATALOG_WORKER_URL` y `CATALOG_HMAC_SECRET` (ya configurados).

### Qué podés hacer

| Pestaña | Función |
|---------|---------|
| **Catálogos PDF** | Subir PDFs (máx. 10 MB) → se guardan en Cloudflare KV y aparecen en la tienda para descargar |
| **Editar catálogo (JSON)** | Cambiar productos, precios, WhatsApp → guarda directo en KV |

> **Nota:** Los PDFs se publican como documentos descargables. Para **importar productos automáticamente desde un PDF** haría falta un lector especial (no incluido). Para productos con fotos, seguí usando `config/products.json` + imágenes en `src/`, o editá el JSON en el panel.

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
├── api/
│   └── catalog.cjs         ← proxy Vercel con firma HMAC (secreto server-side)
├── lib/
│   └── hmac.mjs            ← firma HMAC compartida (Vercel + Express local)
├── scripts/
│   ├── build-static.mjs    ← genera el sitio estático para Vercel
│   └── sync-kv.mjs         ← sube catalog.json a Cloudflare KV
├── worker/
│   └── src/index.js        ← API del catálogo (Cloudflare Worker)
├── wrangler.toml           ← config del Worker + binding KV
├── vercel.json             ← config de despliegue en Vercel
└── package.json
```
