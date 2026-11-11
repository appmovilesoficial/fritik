# Fritik — churros y puro antojo

Dulcería con pedidos por QR, mesas, cocina/preparación, caja y reportes.
Proyecto **totalmente independiente de Chilokos**: usa su propio proyecto de
Google Apps Script, su propio `PropertiesService` (base de datos) y su propio
sitio en GitHub Pages.

## Estructura

```
docs/                     Frontend estático (GitHub Pages)
  index.html
  styles.css              Tema Fritik: #dfb51d, #462611, fresa #e84a7a
  app.js                  SPA (cliente, vendedor, preparador, cajero, encargado, dueño)
  config.js               URL del backend /exec
  assets/logo.svg         Logo (marca de churros)
  assets/banner.svg       Banner de la carta (churros recién hechos)
  vendor/qrcode-generator.js

apps-script/fritik/       Backend (Google Apps Script)
  Db.gs                   Base de datos propia + carta (36 productos)
  Api.gs                  Endpoints REST
  Codigo.gs               Router y arranque del web app
  appsscript.json         Web app anónima
  .clasp.json             scriptId del proyecto Fritik
```

## Backend actual

- Proyecto Apps Script: **Fritik**
- scriptId: `1XHfP7fJ6IFBHCsdI5_GxwakJAluVTEiXIoQ_XC9zQ09Jsjc5OxXTLtvB`
- Deployment `/exec`:
  `https://script.google.com/macros/s/AKfycbwtryBHPVmaPMnTNJb3wUu4FWZPvHCTzDG2fqKEol5CxR9sALdfLJhfmPmtQpSv3Qc2/exec`
- Base de datos: `PropertiesService.getScriptProperties()` de ese proyecto,
  claves `FRITIK_DB_*` (no comparte nada con Chilokos).

## Accesos demo (contraseña `1234`)

| Usuario     | Perfil visible |
|-------------|----------------|
| `dueno`     | Dueño          |
| `encargado` | Encargada      |
| `mesero`    | Vendedor       |
| `cocina`    | Preparador     |
| `caja`      | Cajero         |

Los clientes no inician sesión: escanean el QR de su mesa o piden para llevar
desde la carta.

## Carta

La especialidad abre la carta: **Churros** (10 productos, marcados como
⭐ Especialidad en la vista "Todos"). Después: dulces típicos, gomitas,
chocolates, postres y bebidas (36 productos en total).

## Cambiar logo y banner

1. Guarda las imágenes definitivas en `docs/assets/` (por ejemplo
   `logo.png` y `banner.png`, o reemplaza los `.svg`).
2. Si cambias el nombre/extension, actualiza las referencias en
   `docs/app.js` (`brand-logo`, `login-logo` y `hero`) y el favicon en
   `docs/index.html`.
3. Sube el cambio y aumenta el `?v=` de `docs/index.html` para saltar la
   caché de GitHub Pages.

## Desplegar el backend

Desde `apps-script/fritik`:

```bash
clasp push -f
clasp create-version "descripcion"
clasp deploy -V <version> -d "descripcion"
```

Copia la nueva URL `/exec` en `docs/config.js` (`window.FRITIK_API`).

## Frontend publicado

Repositorio: `https://github.com/appmovilesoficial/fritik`

GitHub Pages (rama `main`, carpeta `/docs`):

`https://appmovilesoficial.github.io/fritik`

> Fritik y Chilokos comparten el origen `appmovilesoficial.github.io`, por eso
> las claves de `localStorage` son distintas: `fritik_token` y `fritik_rate_v1`.
