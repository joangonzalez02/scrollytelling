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

## Mapas GeoJSON — Bibliotecas utilizadas y flujo

- Biblioteca de mapas: Mapbox GL JS v3.15.0 (CDN en `index.html`).
  - CSS: `https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.css`
  - JS: `https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.js`
- Reproyección en el navegador: proj4js v2.9.2 (CDN en `index.html`).
  - Se usa para convertir GeoJSON que vienen en CRS métricos (por ejemplo EPSG:32616/UTM 16N) a WGS84 (EPSG:4326) antes de agregarlos al mapa.

### ¿Dónde está la lógica?

- `mapbox-integration.js`:
  - Inicializa el mapa (`new mapboxgl.Map(...)`).
  - Define `mapStepsConfig` con la configuración de cada paso (centro, zoom, estilo y capas a dibujar).
  - Funciones clave:
    - `reprojectGeoJSONToWGS84(geojson)`: intenta detectar el CRS de entrada (por ejemplo `EPSG:32616`), define la proyección con `proj4` si hace falta y transforma coordenadas a lon/lat (EPSG:4326). También elimina `crs` del GeoJSON final para evitar conflictos con Mapbox GL.
    - `loadGeoJSONWithReprojection(url)`: hace `fetch` del archivo y llama a la función de reproyección.
    - `showMapOverlay(config)`: aplica el estilo/viewport y agrega fuentes `type: 'geojson'` con `map.addSource` y capas `type: 'fill'` con `map.addLayer` usando los datos (ya reproyectados).
    - `updateMapForStep(stepId)`: decide mostrar/ocultar el mapa y qué capas cargar según el paso activo de scroll.

### ¿Cómo se dibujan los GeoJSON?

1. En cada paso configurado, se define un arreglo `layers` dentro de `mapStepsConfig.stepConfigs["N"]`:
   - Ejemplo (resumen):
     - `source: { type: 'geojson', data: 'public/data/tasa-de-cambio-poblacional-por-AGEB.geojson' }`
     - `type: 'fill'`, `paint: { 'fill-color': [...], 'fill-opacity': ... }`
     - Opcional: `popup(properties) { ... }` para mostrar popups al hacer clic.
2. Al cargar el estilo, se hace `addSource` y `addLayer` para cada capa. Si `source.data` es una URL, primero se `fetch`ea y reproyecta con `proj4` si trae `crs` distinto a 4326.
3. Los datos se sirven desde `public/data/*.geojson`.

### Agregar una nueva capa GeoJSON (rápido)

1. Copia tu archivo en `public/data/mi-capa.geojson`.
2. En `mapbox-integration.js`, localiza `mapStepsConfig.stepConfigs["N"]` del paso donde quieres mostrarla (o crea uno nuevo y agrega "N" a `visibleSteps`).
3. Agrega un objeto dentro de `layers` como:
   ```js
   {
     id: 'mi-capa',
     type: 'fill',
     source: { type: 'geojson', data: 'public/data/mi-capa.geojson' },
     paint: {
       'fill-color': ['step', ['to-number', ['get', 'miProp']], '#e5e5e5', 10, '#a8dadc', 30, '#457b9d'],
       'fill-opacity': 0.8,
       'fill-outline-color': '#fff'
     },
     popup: (p) => `<h3>Título</h3><p>Valor: ${p.miProp ?? 'N/D'}</p>`
   }
   ```
4. Si tu GeoJSON trae `crs` y no es `EPSG:4326`, la reproyección ocurrirá automáticamente vía `proj4`.

Notas:
- Si ves propiedades de color que dependen de campos (por ejemplo `pobtot`, `DEN_HAB_HA`), asegúrate de que tu archivo tenga esos nombres o ajusta la expresión de `fill-color`.
- Si cambias el estilo base (`config.style`), las capas se vuelven a agregar cuando el estilo termine de cargar.
- El token de Mapbox se configura en `mapbox-integration.js` (`mapboxAccessToken`). Usa el tuyo si el actual deja de funcionar.

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

### Notas sobre las gráficas

- Gráfica de población (`population-chart.js`):
  - Barras con animación de entrada por step y tooltip enriquecido fijo al viewport.
  - Selector para cambiar el conjunto de datos y escalas dinámicas.
- Gráfica de parque vehicular (`vehicle-chart.js`):
  - Animación al entrar/salir del step 27 (barras rebotan, línea se dibuja con trazo animado, puntos emergen).
  - Tooltip con el mismo estilo que población; aparece al pasar el mouse sobre barras, puntos y también al acercarse a la línea (detección del punto más cercano).
  - Ejes dobles: izquierdo para vehículos totales (barras) y derecho para autos por vivienda (línea).

## Despliegue

- El proyecto es estático y puede desplegarse en servicios como Vercel, Netlify o en un servidor Node simple usando `node serve.js`.
- Si tu proveedor requiere una variable de entorno para el puerto, `serve.js` ya respeta `process.env.PORT`.

---

