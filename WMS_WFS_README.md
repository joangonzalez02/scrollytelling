# Integración WMS y WFS con Mapbox GL JS

## 📋 Descripción

Esta implementación permite integrar servicios **WMS (Web Map Service)** y **WFS (Web Feature Service)** con Mapbox GL JS para el proyecto de scrollytelling de Cancún.

## 🚀 Funcionalidades Implementadas

### 1. **Servicios WMS (Web Map Service)**
- Integración de capas raster desde servidores WMS
- Soporte para múltiples proveedores (INEGI, OpenStreetMap, NOAA)
- Control de transparencia y opacidad
- Gestión automática de tiles

### 2. **Servicios WFS (Web Feature Service)**
- Consumo de datos vectoriales desde servidores WFS
- Conversión automática a GeoJSON
- Soporte para diferentes tipos de geometría (Point, Line, Polygon)
- Estilos configurables por tipo de geometría

### 3. **Controles de Usuario**
- Panel de control para activar/desactivar capas
- Interfaz intuitiva con checkboxes
- Gestión automática de capas

## 🛠️ Uso Básico

### Agregar Capa WMS
```javascript
// Agregar capa WMS de INEGI
addWMSLayer(map, 'inegi');

// Agregar con ID personalizado
addWMSLayer(map, 'inegi', 'mi-capa-inegi');
```

### Agregar Capa WFS
```javascript
// Agregar capa WFS básica
addWFSLayer(map, 'geoserver');

// Agregar con estilos personalizados
addWFSLayer(map, 'geoserver', 'urban-growth', {
    fillColor: '#ef4444',
    fillOpacity: 0.4,
    strokeColor: '#dc2626',
    strokeWidth: 2
});
```

### Cargar Controles de Capas
```javascript
// Agregar panel de control automático
addLayerControls(map);

// Para Cancún específicamente
loadCancunLayers(map);
```

## ⚙️ Configuración de Servicios

### Servicios WMS Configurados
```javascript
const wmsServices = {
    inegi: {
        url: 'https://gaia.inegi.org.mx/NLB/mdm6?',
        layers: 'conjunto_nacional',
        format: 'image/png',
        transparent: true,
        version: '1.1.1'
    },
    osm: {
        url: 'https://ows.terrestris.de/osm/service?',
        layers: 'OSM-WMS',
        format: 'image/png',
        transparent: true,
        version: '1.1.1'
    }
};
```

### Servicios WFS Configurados
```javascript
const wfsServices = {
    geoserver: {
        url: 'http://localhost:8080/geoserver/wfs',
        typeName: 'cancun:urban_growth',
        version: '2.0.0',
        outputFormat: 'application/json'
    },
    inegiWFS: {
        url: 'https://gaia.inegi.org.mx/wfs/scince2020',
        typeName: 'scince:loc_urb_2020',
        version: '2.0.0',
        outputFormat: 'application/json'
    }
};
```

## 🎨 Opciones de Estilo para WFS

### Para Puntos
```javascript
{
    radius: 6,
    color: '#3b82f6',
    opacity: 0.8,
    strokeWidth: 1,
    strokeColor: '#ffffff'
}
```

### Para Líneas
```javascript
{
    color: '#ef4444',
    width: 2,
    opacity: 0.8
}
```

### Para Polígonos
```javascript
{
    fillColor: '#10b981',
    fillOpacity: 0.3,
    strokeColor: '#059669',
    strokeWidth: 2,
    strokeOpacity: 0.8
}
```

## 🔄 Actualización de Datos

### Actualizar Capa WFS
```javascript
// Actualizar datos WFS existentes
updateWFSLayer(map, 'wfs-geoserver', 'geoserver');

// Con filtro espacial (bbox)
const bbox = [-87.1, 20.9, -86.7, 21.2]; // [minX, minY, maxX, maxY]
updateWFSLayer(map, 'wfs-geoserver', 'geoserver', bbox);
```

## 📡 Consultas WFS Avanzadas

### Obtener Datos con Filtros
```javascript
// Consulta básica
const data = await fetchWFSData('geoserver');

// Con filtro espacial y límite de features
const bbox = [-87.1, 20.9, -86.7, 21.2];
const data = await fetchWFSData('geoserver', bbox, 500);
```

## 🗺️ Integración con el Scrollytelling

### Ejemplo de Uso en Steps
```javascript
// En el step de crecimiento urbano
function onStepEnter(response) {
    if (response.index === 3) {
        // Mostrar capa WFS de crecimiento urbano
        addWFSLayer(map, 'geoserver', 'urban-growth', {
            fillColor: '#ef4444',
            fillOpacity: 0.6
        });
    }
}

function onStepExit(response) {
    if (response.index === 3) {
        // Remover capa al salir del step
        if (map.getLayer('wfs-geoserver-layer')) {
            map.removeLayer('wfs-geoserver-layer');
            map.removeSource('wfs-geoserver');
        }
    }
}
```

## 🔧 Configuración de Servidores

### GeoServer Local
1. Instalar GeoServer
2. Configurar workspace `cancun`
3. Publicar capas con nombres como `urban_growth`
4. Habilitar CORS para requests desde el navegador

### INEGI
- Los servicios de INEGI pueden requerir autenticación
- Verificar disponibilidad de endpoints
- Algunos servicios tienen límites de requests

## 🚨 Consideraciones Importantes

### CORS (Cross-Origin Resource Sharing)
- Muchos servidores WMS/WFS requieren configuración CORS
- Para desarrollo local, usar proxy o deshabilitar CORS en el navegador
- En producción, configurar correctamente los headers CORS

### Rendimiento
- Las capas WMS son raster y pueden ser pesadas
- Las capas WFS cargan todos los datos, usar filtros espaciales
- Implementar cache cuando sea posible

### Errores Comunes
- **Error 404**: Verificar URLs y nombres de capas
- **Error CORS**: Configurar servidor o usar proxy
- **Error de formato**: Verificar parámetros de outputFormat

## 📝 Ejemplos Prácticos

### Ejemplo Completo
```javascript
// Inicializar mapa
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-86.8, 21.1],
    zoom: 10
});

map.on('load', () => {
    // Agregar capa WMS de contexto
    addWMSLayer(map, 'inegi', 'contexto-mexico');
    
    // Agregar datos WFS de Cancún
    addWFSLayer(map, 'geoserver', 'cancun-data', {
        fillColor: '#3b82f6',
        fillOpacity: 0.4,
        strokeColor: '#1e40af',
        strokeWidth: 2
    });
    
    // Agregar controles
    addLayerControls(map);
});
```

## 🔗 Referencias

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/api/)
- [OGC WMS Standard](https://www.ogc.org/standards/wms)
- [OGC WFS Standard](https://www.ogc.org/standards/wfs)
- [GeoServer Documentation](http://docs.geoserver.org/)
