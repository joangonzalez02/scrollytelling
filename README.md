# SCROLLAMA — Scrollytelling de Cancún

Proyecto de scrollytelling con mapas (Mapbox GL), visualizaciones D3 y servidor estático con Express.

## Requisitos
- Node.js 18+ (recomendado) y npm
- Token de Mapbox válido si lo cambias (actualmente hay uno configurado en `mapbox-integration.js`)

## Instalación

```powershell
# En Windows PowerShell
npm install
```

## Ejecución

```powershell
# Iniciar el servidor de desarrollo
npm start
```

- El servidor se levanta por defecto en `http://localhost:8000`.
- Para usar otro puerto, define la variable de entorno `PORT` antes de arrancar:

```powershell
# Ejemplo en PowerShell para usar el puerto 3000
$env:PORT=3000; npm start
```

Luego abre el navegador en `http://localhost:3000` (o el puerto que elijas).

## Estructura del proyecto (resumen)

- `index.html`: Página principal del scrollytelling.
- `style.css`: Estilos de la página.
- `main.js`: Lógica de orquestación del scrollytelling/scrollama.
- `mapbox-integration.js`: Inicialización y pasos del mapa de Mapbox GL.
- `population-chart.js`, `vehicle-chart.js`, `urban-evolution.js`: Gráficas y visualizaciones D3.
- `public/data/`: Archivos GeoJSON y CSV usados por las visualizaciones.
- `assets/`: Imágenes y videos usados en el relato.
- `serve.js`: Servidor Express para servir archivos estáticos.
- `package.json`: Scripts y dependencias del proyecto.

## Mapbox

- El archivo `mapbox-integration.js` contiene un token de acceso (`mapboxAccessToken`). Si necesitas usar tu propio token, reemplázalo por el tuyo.
- El contenedor del mapa es `#map` y el servidor entrega los archivos estáticos necesarios.

## Problemas comunes (Troubleshooting)

- El comando `python -m http.server` no es necesario aquí. Usa `npm start` o `node serve.js` para el servidor Express.
- Si el puerto ya está en uso, cambia el puerto con la variable `PORT` como se muestra arriba.
- Si no carga el mapa de Mapbox, revisa:
  - Que tengas conexión a internet.
  - Que el token de Mapbox sea válido (si lo cambiaste).
- Si las capas GeoJSON no se dibujan:
  - Confirma las rutas: por ejemplo `public/data/tasa-de-cambio-poblacional-por-AGEB.geojson`.
  - Abre la consola del navegador para ver errores de carga (CORS, 404, etc.).

## Desarrollo

- Los scripts y librerías principales se cargan desde CDN en `index.html` (Mapbox GL, Scrollama, D3, etc.).
- El servidor Express de `serve.js` sirve todo el proyecto y hace fallback a `index.html` para rutas del front.

## Despliegue

- El proyecto es estático y puede desplegarse en servicios como Vercel, Netlify o en un servidor Node simple usando `node serve.js`.
- Si tu proveedor requiere una variable de entorno para el puerto, `serve.js` ya respeta `process.env.PORT`.

---

