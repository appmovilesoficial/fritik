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
  assets/logo.png         Logo real (Fritik · puro · ANTOJO), fondo transparente
  assets/logo-wordmark.png  Recorte "Fritik" para la barra superior
  assets/favicon.png      Icono del sitio (monograma F sobre dorado)
  assets/banner.svg       Banner de la carta (provisional, churros)
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
- Cuenta dueña: **`cunaguaroshop@gmail.com`**
- scriptId: `1a8cngHLphbd6yvpOa2bDTNLZOTzW7ErQPmNvafgeIEc5tn8aGTw_NZpO`
- Deployment `/exec`:
  `https://script.google.com/macros/s/AKfycbxC4Gz497nJmv2Z828zNyt7oc2EK-vzDpbi1CZhRKCNjSxP39Kk9h3-fCKmKefijkuS/exec`
- Base de datos: `PropertiesService.getScriptProperties()` de ese proyecto,
  claves `FRITIK_DB_*` (no comparte nada con Chilokos).

> Este proyecto fue creado bajo `cunaguaroshop@gmail.com`. En clasp se usa la
> credencial nombrada: `clasp -u cunaguaroshop ...` (el token `default` sigue
> perteneciendo a la cuenta de Chilokos).

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

El perfil **encargado** puede operar todas las áreas: ventas y mesas,
preparación (cocina), cobros y caja, menú, llamados y resumen. Los accesos
rápidos de prueba ya no se muestran en la pantalla de login.

Los precios se muestran en dólares (**$**) y su equivalente en bolívares con
la **tasa oficial del dólar del BCV**, consultada desde
`ve.dolarapi.com/v1/dolares/oficial`.

Cuando un pedido de mesa queda **pagado**, desaparece de la vista del cliente:
el historial de la mesa (productos y montos vendidos) es privado del negocio.
El **encargado** y el **dueño** pueden **eliminar** un pedido desde la pestaña
Pedidos (botón 🗑️ Eliminar, con confirmación); si la mesa queda sin pedidos
abiertos, se libera automáticamente.

El **teléfono del cliente es obligatorio** al enviar un pedido (se guarda en el
navegador para la próxima vez). En los paneles de vendedor, preparador, cajero,
encargado y dueño aparece el botón **📲 WhatsApp** en cada pedido: genera una
imagen tipo ticket con número de pedido, productos, cantidades y precios, y
abre el resumen escrito en WhatsApp. En el celular, **Compartir imagen** envía
la imagen directamente al chat; en computadora se descarga y se adjunta. Para
envío 100 % automático desde el número del negocio haría falta la API de
WhatsApp Business.

## Avisos automáticos al WhatsApp del negocio

Los pedidos creados por **clientes** se envían automáticamente al WhatsApp
dedicado del negocio mediante **CallMeBot** (servicio gratuito). El aviso llega
como texto con número de pedido, mesa o para llevar, cliente, teléfono,
productos, cantidades y total.

Configuración (pestaña **📲 Avisos** del encargado o dueño):

1. Desde el WhatsApp del negocio, enviar `I allow callmebot to send me messages`
   al **+34 644 51 95 23**.
2. El bot responde una **apikey**.
3. En la pestaña **📲 Avisos**, escribir el número del negocio, pegar la apikey
   y pulsar **Guardar**.
4. Pulsar **Enviar prueba** para confirmar que llega.

La configuración se guarda en `PropertiesService` (`FRITIK_WA_*`), no en el
código. El envío se hace después de guardar el pedido; si CallMeBot falla, el
pedido igual se registra.

> **Autorización única:** el backend usa `UrlFetchApp`, que requiere el permiso
> de conexión externa. Si el `/exec` devuelve `403 Acceso denegado`, abrir el
> editor de Apps Script con la cuenta dueña, seleccionar la función
> `autorizarAvisos`, pulsar **Ejecutar** y aceptar los permisos una sola vez.

El cliente no ve el botón **Salir** ni la pantalla de login del personal.

## Carta

La especialidad abre la carta: **Churros** (10 productos, marcados como
⭐ Especialidad en la vista "Todos"). Después: dulces típicos, gomitas,
chocolates, postres y bebidas (36 productos en total).

## Cambiar logo y banner

1. Guarda las imágenes definitivas en `docs/assets/` (por ejemplo
   `logo.png`, `logo-wordmark.png`, `favicon.png` y el banner).
2. Si cambias el nombre/extension, actualiza las referencias en
   `docs/app.js` (`brand-logo` y `login-logo`) y el favicon en
   `docs/index.html`.
3. Sube el cambio y aumenta el `?v=` de `docs/index.html` para saltar la
   caché de GitHub Pages.

## Desplegar el backend

Desde `apps-script/fritik`:

```bash
clasp -u cunaguaroshop push -f
clasp -u cunaguaroshop create-version "descripcion"
clasp -u cunaguaroshop deploy -V <version> -d "descripcion"
```

El flag `-u cunaguaroshop` usa la credencial nombrada de la cuenta dueña sin
cambiar la sesión `default` de clasp (la de Chilokos). Copia la nueva URL
`/exec` en `docs/config.js` (`window.FRITIK_API`).

## Frontend publicado

Repositorio: `https://github.com/appmovilesoficial/fritik`

GitHub Pages (rama `main`, carpeta `/docs`):

`https://appmovilesoficial.github.io/fritik`

> Fritik y Chilokos comparten el origen `appmovilesoficial.github.io`, por eso
> las claves de `localStorage` son distintas: `fritik_token` y `fritik_rate_v2`.
