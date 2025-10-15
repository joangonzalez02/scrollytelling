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

## Estructura del proyecto

```
SCROLLAMA/
├── src/                          # Código fuente JavaScript
│   ├── main.js                   # Lógica de scrollama
│   ├── mapbox-integration.js     # Integración con Mapbox
│   ├── population-chart.js       # Gráfico de población
│   ├── vehicle-chart.js          # Gráfico de vehículos
│   ├── urban-evolution.js        # Gráfico de evolución urbana
├── dist/                         # Archivos JavaScript minificados
│   ├── main.min.js
│   ├── mapbox-integration.min.js
│   ├── population-chart.min.js
│   ├── vehicle-chart.min.js
│   └── urban-evolution.min.js
├── public/data/                  # Datos GeoJSON y CSV
│   ├── crecimientoG.geojson
│   ├── densidad-poblacional-por-distrito.geojson
│   ├── parque-vehicular.csv
│   ├── poblacion-valores.csv
│   └── tasa-de-cambio-poblacional-por-AGEB.geojson
├── assets/                       # Imágenes y videos
├── scripts/                      # Scripts de build
│   └── build.js
├── index.html                    # Página principal
├── style.css                     # Estilos CSS
├── serve.js                      # Servidor de desarrollo
├── MAPBOX-TOKEN-SETUP.md        # Guía para configurar token
└── package.json                  # Configuración de npm
```

## Build

Para minificar los archivos JavaScript:

```bash
npm run build
```

Esto lee los archivos de `src/` y genera las versiones minificadas en `dist/`.

### ⚠️ Workflow de desarrollo (IMPORTANTE)

**Cada vez que modifiques archivos `.js` en `src/`, debes:**

1. **Generar los archivos minificados:**
   ```powershell
   npm run build
   ```

2. **Hacer commit y push de los cambios:**
   ```powershell
   git add .
   git commit -m "Descripción de tus cambios"
   git push
   ```

**¿Por qué?** GitHub Pages sirve directamente desde el repositorio, y el `index.html` carga los archivos minificados de `dist/`. Si no ejecutas `npm run build`, los cambios en `src/` no se verán reflejados en producción.

**Archivos que se generan:**
- `src/main.js` → `dist/main.min.js`
- `src/mapbox-integration.js` → `dist/mapbox-integration.min.js`
- `src/population-chart.js` → `dist/population-chart.min.js`
- `src/vehicle-chart.js` → `dist/vehicle-chart.min.js`
- `src/urban-evolution.js` → `dist/urban-evolution.min.js`

## Mapbox

- El token de Mapbox está configurado en `src/mapbox-integration.js`.
- **⚠️ IMPORTANTE**: Si el mapa no se muestra, necesitas crear tu propia cuenta en Mapbox y obtener un token válido.
- Consulta `MAPBOX-TOKEN-SETUP.md` para instrucciones detalladas sobre cómo obtener y configurar tu token.
- El contenedor del mapa es `#map` y se carga dinámicamente en los steps correspondientes.

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

## Despliegue a GitHub Pages

Este proyecto está configurado para desplegarse **automáticamente** a GitHub Pages desde la rama `main`.

### Cómo funciona

1. Haces cambios en tu código local
2. Haces commit: `git commit -m "tu mensaje"`
3. Haces push: `git push origin main`
4. ✨ GitHub Pages se actualiza automáticamente (tarda 1-2 minutos)

**URL del sitio:** `https://joangonzalez02.github.io/SCROLLAMA/`

### Configuración en GitHub (ya debería estar hecho)

Si es la primera vez o necesitas verificar:
1. Ve a tu repositorio → **Settings** → **Pages**
2. En "**Build and deployment**", selecciona:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
3. Guarda y espera unos minutos

**⚠️ Nota importante:** Los archivos se sirven directamente desde la rama `main`, así que asegúrate de tener `dist/` generado antes de hacer push:

```powershell
npm run build
git add .
git commit -m "Build para producción"
git push origin main
```

### Otros servicios de hosting

Si prefieres otros servicios:
- **Vercel/Netlify**: Conecta tu repositorio y estos servicios construirán automáticamente con `npm run build`
- **Servidor Node**: Despliega usando `node serve.js` (respeta `process.env.PORT`)

---

