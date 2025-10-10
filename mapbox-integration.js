/**
 * Integración de Mapbox con Scrollama
 * Este archivo gestiona el mapa de Mapbox para la visualización de datos geográficos
 */

// Variable global para el mapa de Mapbox
let mapboxMap = null;
// Track current base style to avoid unnecessary setStyle calls
let currentBaseStyle = 'mapbox://styles/mapbox/light-v10';

// Token de acceso a Mapbox
const mapboxAccessToken = 'pk.eyJ1IjoiMHhqZmVyIiwiYSI6ImNtZ2huam90aDAzcGUyaXB4eDdpOHk0cGEifQ.CebHRBgURf4GHvbcI0pOew';

// Configuración de cuándo mostrar el mapa en cada step
const mapStepsConfig = {
    // Steps donde el mapa debe estar visible
    visibleSteps: [2, 4, 5, 7, 20, 22, 24],
    
    // Configuración específica para cada paso que muestra el mapa
    stepConfigs: {
        // Step 2: Mapa histórico de franja hotelera y supermanzanas iniciales
        "2": {
            center: [-86.8515, 21.1619], // Centro en Cancún
            zoom: 12,
            pitch: 0,
            bearing: 0,
            style: 'mapbox://styles/mapbox/light-v10',
            // Nota: El formato GPKG no es compatible directamente con Mapbox GL.
            // Por ahora, desactivamos la capa hasta contar con un GeoJSON equivalente.
            layers: []
        },
        // Step 4: Expansión urbana sin freno (mapa de crecimiento mancha urbana)
        "4": {
            center: [-86.8515, 21.1619], // Centro en Cancún
            zoom: 11,
            pitch: 30,
            bearing: 0,
            style: 'mapbox://styles/mapbox/light-v10',
            layers: [
                {
                    id: 'crecimiento-urbano',
                    type: 'fill',
                    source: {
                        type: 'geojson',
                        data: 'public/data/crecimientoG.geojson'
                    },
                    paint: {
                        'fill-color': '#219EBC',
                        'fill-opacity': 0.6,
                        'fill-outline-color': '#555'
                    },
                    popup: (properties) => {
                        const lustro = properties.LUSTRO ?? 'N/D';
                        const codigo = (properties.CODIGO_TEMP ?? properties.CODIGO) || '—';
                        return `<h3>Expansión urbana</h3>
                                <p><strong>Lustro:</strong> ${lustro}</p>
                                <p><strong>Código:</strong> ${codigo}</p>`;
                    }
                }
            ]
        },
        // Step 5: Mapa de tasa de cambio poblacional por AGEB (2010-2020)
        "5": {
            center: [-86.8515, 21.1619], 
            zoom: 12,
            pitch: 0,
            bearing: 0,
            style: 'mapbox://styles/mapbox/light-v10',
            layers: [
                {
                    id: 'tasa-cambio-poblacional',
                    type: 'fill',
                    source: {
                        type: 'geojson',
                        data: 'public/data/tasa-de-cambio-poblacional-por-AGEB.geojson'
                    },
                    paint: {
                        // Manejo robusto de valores nulos: si 'pobtot' no existe, usar 0 para asignar el color por defecto
                        'fill-color': [
                            'step',
                            ['coalesce', ['to-number', ['get', 'pobtot']], 0],
                            '#e63946', // bajo (rojo)
                            1000, '#ffb703', // medio-bajo (amarillo)
                            5000, '#8ecae6', // medio (azul claro)
                            10000, '#219ebc', // medio-alto (azul medio)
                            50000, '#023047'  // alto (azul oscuro)
                        ],
                        'fill-opacity': 0.9,
                        'fill-outline-color': '#555'
                    },
                    popup: (properties) => {
                        return `<h3>Supermanzana ${properties.supermanzana || 'N/A'}</h3>
                                <p>Población: ${(properties.pobtot || 0).toLocaleString()} habitantes</p>`;
                    }
                }
            ]
        },
        // Step 7: Mapa de densidad poblacional por distrito
        "7": {
            center: [-86.8515, 21.1619],
            zoom: 11,
            pitch: 30,
            bearing: 0,
            style: 'mapbox://styles/mapbox/light-v10',
            layers: [
                {
                    id: 'densidad-poblacional',
                    type: 'fill',
                    source: {
                        type: 'geojson',
                        data: 'public/data/densidad-poblacional-por-distrito.geojson'
                    },
                    paint: {
                        'fill-color': [
                            'step',
                            ['coalesce', ['to-number', ['get', 'DEN_HAB_HA']], 0],
                            '#f1faee', // baja densidad (claro)
                            10, '#a8dadc', 
                            30, '#457b9d',
                            60, '#1d3557',
                            100, '#e63946'  // alta densidad (intenso)
                        ],
                        'fill-opacity': 0.8,
                        'fill-outline-color': '#555'
                    },
                    popup: (properties) => {
                        const pob = Number(properties.POBTOT || 0);
                        const den = Number(properties.DEN_HAB_HA || 0);
                        const sup = Number(properties.SUPERFICIE_HA || 0);
                        return `<h3>Distrito ${properties.fid ?? ''}</h3>
                                <p>Población: ${isFinite(pob) ? pob.toLocaleString() : 'N/D'} habitantes</p>
                                <p>Densidad: ${isFinite(den) ? den.toFixed(1) : 'N/D'} hab/ha</p>
                                <p>Superficie: ${isFinite(sup) ? sup.toFixed(1) : 'N/D'} hectáreas</p>`;
                    }
                }
            ]
        },
        // Step 20: Cambio poblacional por AGEB
        "20": {
            center: [-86.8515, 21.1619], 
            zoom: 11,
            pitch: 0,
            bearing: 0,
            style: 'mapbox://styles/mapbox/light-v10',
            layers: [
                {
                    id: 'cambio-poblacional-ageb',
                    type: 'fill',
                    source: {
                        type: 'geojson',
                        data: 'public/data/tasa-de-cambio-poblacional-por-AGEB.geojson'
                    },
                    paint: {
                        // Manejo robusto de valores nulos: si 'pobtot' no existe, usar 0 para asignar el color por defecto
                        'fill-color': [
                            'step',
                            ['coalesce', ['to-number', ['get', 'pobtot']], 0],
                            '#f7f4f9', // muy bajo (casi blanco)
                            100, '#e7e1ef', // bajo 
                            500, '#d4b9da', // medio-bajo
                            1000, '#c994c7', // medio
                            5000, '#df65b0', // medio-alto
                            10000, '#e7298a', // alto 
                            50000, '#ce1256', // muy alto
                            100000, '#91003f'  // extremo
                        ],
                        'fill-opacity': 0.8,
                        'fill-outline-color': '#ffffff'
                    },
                    popup: (properties) => {
                        return `<h3>AGEB</h3>
                                <p><strong>Población total:</strong> ${(properties.pobtot || 0).toLocaleString()} habitantes</p>
                                <p><strong>Supermanzana:</strong> ${properties.supermanzana || 'N/A'}</p>`;
                    }
                }
            ]
        },
        // Step 22: Pérdida de vegetación
        "22": {
            center: [-86.8515, 21.1619],
            zoom: 11,
            pitch: 20,
            bearing: 0,
            style: 'mapbox://styles/mapbox/light-v10',
            layers: []
        },
        // Step 24: Densidad poblacional por distrito
        "24": {
            center: [-86.8515, 21.1619],
            zoom: 11,
            pitch: 30,
            bearing: 0,
            style: 'mapbox://styles/mapbox/light-v10',
            layers: [
                {
                    id: 'densidad-poblacional-distritos',
                    type: 'fill',
                    source: {
                        type: 'geojson',
                        data: 'public/data/densidad-poblacional-por-distrito.geojson'
                    },
                    paint: {
                        'fill-color': [
                            'step',
                            ['coalesce', ['to-number', ['get', 'DEN_HAB_HA']], 0],
                            '#f1faee', // baja densidad (claro)
                            10, '#a8dadc', 
                            30, '#457b9d',
                            60, '#1d3557',
                            100, '#e63946'  // alta densidad (intenso)
                        ],
                        'fill-opacity': 0.8,
                        'fill-outline-color': '#555'
                    },
                    popup: (properties) => {
                        const pob = Number(properties.POBTOT || 0);
                        const den = Number(properties.DEN_HAB_HA || 0);
                        const sup = Number(properties.SUPERFICIE_HA || 0);
                        return `<h3>Distrito ${properties.fid ?? ''}</h3>
                                <p>Población: ${isFinite(pob) ? pob.toLocaleString() : 'N/D'} habitantes</p>
                                <p>Densidad: ${isFinite(den) ? den.toFixed(1) : 'N/D'} hab/ha</p>
                                <p>Superficie: ${isFinite(sup) ? sup.toFixed(1) : 'N/D'} hectáreas</p>`;
                    }
                }
            ]
        }
    }
};

// Inicializar Mapbox
function initializeMapbox() {
    console.log('=== Inicializando Mapbox ===');
    
    // Establecer token de acceso
    mapboxgl.accessToken = mapboxAccessToken;
    
    // Usar el contenedor principal #map en lugar de crear uno nuevo
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('No se encontró el contenedor #map');
        return;
    }
    
    // FORZAR VISIBILIDAD TEMPORAL PARA INICIALIZACIÓN CORRECTA
    const originalDisplay = mapContainer.style.display;
    const originalVisibility = mapContainer.style.visibility;
    const originalOpacity = mapContainer.style.opacity;
    
    // Hacer temporalmente visible para inicialización
    mapContainer.style.display = 'block';
    mapContainer.style.visibility = 'visible';
    mapContainer.style.opacity = '1';
    mapContainer.style.width = '100vw';
    mapContainer.style.height = '100vh';
    
    console.log('📏 Contenedor temporal visible para inicialización del mapa');
    
    // No crear contenedores adicionales: solo usamos #map como único contenedor de mapa
    
    // Inicializar el mapa en el contenedor principal #map
    mapboxMap = new mapboxgl.Map({
        container: 'map',
        style: currentBaseStyle,
        center: [-86.8515, 21.1619], // Centro en Cancún
        zoom: 12,
        pitch: 0,
        bearing: 0,
        // Habilitar interacciones para permitir manipulación del mapa
        scrollZoom: true,
        boxZoom: true,
        dragRotate: true,
        dragPan: true,
        keyboard: true,
        doubleClickZoom: true,
        touchZoomRotate: true
    });
    
    // RESTAURAR ESTADO ORIGINAL DEL CONTENEDOR DESPUÉS DE INICIALIZACIÓN
    mapboxMap.on('load', () => {
        console.log('🗺️ Mapa cargado, restaurando estado original del contenedor');
        mapContainer.style.display = originalDisplay || 'none';
        mapContainer.style.visibility = originalVisibility || 'hidden';
        mapContainer.style.opacity = originalOpacity || '0';
        mapContainer.classList.remove('active');
    });
    
    // Añadir controles al mapa
    mapboxMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapboxMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    
    console.log('Mapa de Mapbox inicializado correctamente (solo mapa principal)');
}

// === Utilidades de proyección y reproyección ===
// Define EPSG:32616 si proj4 está disponible
function ensureProjDefs() {
    if (typeof proj4 !== 'undefined' && !proj4.defs['EPSG:32616']) {
        // UTM zone 16N
        proj4.defs('EPSG:32616', '+proj=utm +zone=16 +datum=WGS84 +units=m +no_defs +type=crs');
    }
}

// Reproyectar GeoJSON de EPSG:32616 (o cualquier CRS métrico) a WGS84 lon/lat
function reprojectGeoJSONToWGS84(geojson) {
    try {
        if (!geojson || typeof proj4 === 'undefined') return geojson;
        const crsName = geojson.crs && geojson.crs.properties && geojson.crs.properties.name;
        if (!crsName) return geojson; // ya podría estar en WGS84
        // Buscar EPSG code
        const epsg = (crsName.match(/EPSG::(\d+)/) || [])[1] || (crsName.match(/EPSG:(\d+)/) || [])[1];
        if (!epsg) return geojson;
        let fromEpsg = `EPSG:${epsg}`;
        // Corrección específica: algunos archivos vienen etiquetados como EPSG:6371 (radio de la Tierra),
        // pero las coordenadas están en UTM zona 16N (EPSG:32616) para Cancún. Mapearlo explícitamente.
        if (fromEpsg === 'EPSG:6371') {
            fromEpsg = 'EPSG:32616';
        }
        if (fromEpsg === 'EPSG:4326') return geojson; // ya está en WGS84
        ensureProjDefs();
        if (!proj4.defs[fromEpsg]) {
            // Si no está definida, intentar definir rápidamente zonas UTM comunes de Cancún
            if (fromEpsg === 'EPSG:32616') {
                proj4.defs('EPSG:32616', '+proj=utm +zone=16 +datum=WGS84 +units=m +no_defs +type=crs');
            } else {
                console.warn('CRS no reconocido para reproyección:', fromEpsg);
                // Evitar logs repetidos: devolver copia con crs eliminado para no reintentar
                const cleaned = JSON.parse(JSON.stringify(geojson));
                delete cleaned.crs;
                return cleaned;
            }
        }
        const transformer = proj4(fromEpsg, 'EPSG:4326');
        const reprojectCoord = (coord) => {
            const [x, y] = coord;
            const [lon, lat] = transformer.forward([x, y]);
            return [lon, lat];
        };
        const reprojectCoords = (coords, depth) => {
            if (depth === 2) {
                // [x,y] punto
                return reprojectCoord(coords);
            } else {
                return coords.map(c => reprojectCoords(c, depth - 1));
            }
        };
        const reprojectFeature = (feat) => {
            if (!feat || !feat.geometry) return feat;
            const geom = feat.geometry;
            if (!geom.coordinates) return feat;
            const type = geom.type;
            let depth;
            switch (type) {
                case 'Point': depth = 2; break;
                case 'MultiPoint': depth = 3; break;
                case 'LineString': depth = 3; break;
                case 'MultiLineString': depth = 4; break;
                case 'Polygon': depth = 4; break;
                case 'MultiPolygon': depth = 5; break;
                case 'GeometryCollection':
                    if (Array.isArray(geom.geometries)) {
                        geom.geometries = geom.geometries.map(g => ({
                            ...g,
                            coordinates: g.coordinates ? reprojectCoords(g.coordinates, (
                                g.type === 'Point' ? 2 :
                                g.type === 'MultiPoint' || g.type === 'LineString' ? 3 :
                                g.type === 'MultiLineString' || g.type === 'Polygon' ? 4 : 5
                            )) : g.coordinates
                        }));
                    }
                    return feat;
                default:
                    return feat;
            }
            geom.coordinates = reprojectCoords(geom.coordinates, depth);
            return feat;
        };
        const cloned = JSON.parse(JSON.stringify(geojson));
        const isValidGeom = (geom) => {
            if (!geom || !geom.type || geom.coordinates == null) return false;
            // consider empty arrays invalid
            const hasCoords = Array.isArray(geom.coordinates) && geom.coordinates.length > 0;
            return hasCoords;
        };
        if (cloned.type === 'FeatureCollection') {
            cloned.features = cloned.features.map(reprojectFeature).filter(f => f && f.geometry && isValidGeom(f.geometry));
        } else if (cloned.type === 'Feature') {
            reprojectFeature(cloned);
            if (!isValidGeom(cloned.geometry)) {
                return { type: 'FeatureCollection', features: [] };
            }
        }
        // Eliminar CRS para evitar conflictos con Mapbox GL
        delete cloned.crs;
        return cloned;
    } catch (e) {
        console.warn('Fallo al reproyectar GeoJSON, usando datos originales:', e);
        return geojson;
    }
}

// Cargar GeoJSON desde URL, con reproyección si trae CRS distinto a 4326
async function loadGeoJSONWithReprojection(url) {
    // Evitar caché para reflejar cambios recientes en GitHub Pages
    const sep = url.includes('?') ? '&' : '?';
    const noCacheUrl = `${url}${sep}v=${Date.now()}`;
    const res = await fetch(noCacheUrl, { cache: 'no-store' });
    const data = await res.json();
    return reprojectGeoJSONToWGS84(data);
}

// Función para mostrar el mapa en modo overlay
function showMapOverlay(config) {
    console.log('=== showMapOverlay INICIANDO ===');
    console.log('Config recibida:', config);
    
    const mapContainer = document.getElementById('map');
    
    if (!mapContainer) {
        console.error('❌ No se encontró el contenedor #map');
        return;
    }
    
    if (!mapboxMap) {
        console.error('❌ mapboxMap no está inicializado');
        return;
    }
    
    console.log('✅ Contenedor y mapa encontrados, procediendo...');
    
    // Asegurar que el mapa base esté visible usando múltiples métodos
    mapContainer.style.display = 'block';
    mapContainer.style.opacity = '1';
    mapContainer.style.visibility = 'visible';
    mapContainer.style.zIndex = '1000';
    mapContainer.classList.add('active');
    
    // Asegurarnos que el canvas del mapa tenga opacidad completa
    const mapCanvas = mapContainer.querySelector('.mapboxgl-canvas');
    if (mapCanvas) {
        mapCanvas.style.opacity = '1';
    }
    
    console.log('✅ Estilos aplicados al contenedor');
    console.log('Contenedor display:', mapContainer.style.display);
    console.log('Contenedor opacity:', mapContainer.style.opacity);
    console.log('Contenedor visibility:', mapContainer.style.visibility);
    console.log('Contenedor z-index:', mapContainer.style.zIndex);
    
    // No crear zonas de scroll superpuestas para no bloquear controles del mapa
    
    // Reenviar eventos de rueda del ratón al documento para permitir scroll mientras el mapa está visible
    if (!mapContainer._wheelForwardHandler) {
        mapContainer._wheelForwardHandler = function(event) {
            try {
                event.preventDefault();
                event.stopPropagation();
            } catch (_) {}
            const delta = event.deltaY || 0;
            window.scrollBy(0, delta);
        };
    }
    mapContainer.addEventListener('wheel', mapContainer._wheelForwardHandler, { passive: false, capture: true });
    
    // Añadir event listener para permitir scroll con teclado
    addKeyboardScrollSupport();
    
    // FORZAR REDIMENSIÓN DEL MAPA ANTES DE APLICAR CONFIGURACIÓN
    console.log('📏 Forzando resize del mapa para pantalla completa...');
    
    // Deshabilitar zoom con scroll para permitir scrollear la página
    try { mapboxMap.scrollZoom.disable(); } catch (_) {}
    
    // Múltiples resize con diferentes delays para asegurar dimensionamiento correcto
    setTimeout(() => { if (mapboxMap) { mapboxMap.resize(); console.log('✅ Resize 1 del mapa completado (100ms)'); } }, 100);
    setTimeout(() => { if (mapboxMap) { mapboxMap.resize(); console.log('✅ Resize 2 del mapa completado (300ms)'); } }, 300);
    setTimeout(() => { if (mapboxMap) { mapboxMap.resize(); console.log('✅ Resize 3 del mapa completado (600ms)'); } }, 600);
    
    // Preparar manejador para reinsertar las capas al terminar de cargar el estilo
    const onStyleLoad = async () => {
        console.log('🎨 Estilo del mapa cargado, añadiendo capas...');
        // Eliminar capas existentes si las hay
    const layersToRemove = ['densidad-poblacional','densidad-poblacional-distritos','tasa-cambio-poblacional','cambio-poblacional-ageb','supermanzanas-iniciales','crecimiento-urbano'];
        layersToRemove.forEach(layerId => { if (mapboxMap.getLayer(layerId)) { mapboxMap.removeLayer(layerId); console.log(`🗑️ Capa ${layerId} eliminada`); } });
        
        // Eliminar fuentes existentes si las hay
    const sourcesToRemove = ['densidad-poblacional-src','densidad-poblacional-distritos-src','tasa-cambio-poblacional-src','cambio-poblacional-ageb-src','supermanzanas-iniciales-src','crecimiento-urbano-src'];
        sourcesToRemove.forEach(sourceId => { if (mapboxMap.getSource(sourceId)) { mapboxMap.removeSource(sourceId); console.log(`🗑️ Fuente ${sourceId} eliminada`); } });
        
        // Encontrar una capa de referencia para insertar por debajo de etiquetas (símbolos)
        const beforeLabelId = (() => {
            try {
                const style = mapboxMap.getStyle();
                if (!style || !style.layers) return null;
                const symbolLayer = style.layers.find(l => l.type === 'symbol');
                return symbolLayer ? symbolLayer.id : null;
            } catch { return null; }
        })();

        // Añadir las capas definidas en la configuración
        if (config.layers && config.layers.length > 0) {
            console.log(`📊 Añadiendo ${config.layers.length} capas...`);
            for (const layer of config.layers) {
                try {
                    const sourceId = layer.id + '-src';
                    // Si la fuente es GeoJSON con URL, cargarla y reproyectar si es necesario
                    let source = { ...layer.source };
                    if (source.type === 'geojson' && typeof source.data === 'string') {
                        if (source.data.toLowerCase().endsWith('.gpkg')) {
                            console.warn(`⛔ Formato GPKG no soportado para ${layer.id}. Omite esta capa hasta convertir a GeoJSON.`);
                            continue;
                        }
                        console.log(`⬇️ Cargando GeoJSON para ${layer.id} desde ${source.data} ...`);
                        const gj = await loadGeoJSONWithReprojection(source.data);
                        source = { ...source, data: gj };
                    }
                    mapboxMap.addSource(sourceId, source);
                    const paintProperties = { ...layer.paint }; // Conservar opacidad definida
                    // Insertar por debajo de etiquetas para que se vean calles y nombres
                    const layerDef = { id: layer.id, type: layer.type, source: sourceId, paint: paintProperties };
                    if (beforeLabelId) {
                        mapboxMap.addLayer(layerDef, beforeLabelId);
                    } else {
                        mapboxMap.addLayer(layerDef);
                    }
                    if (layer.popup) {
                        mapboxMap.on('click', layer.id, (e) => {
                            const properties = e.features[0].properties;
                            const content = layer.popup(properties);
                            new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(content).addTo(mapboxMap);
                        });
                        mapboxMap.on('mouseenter', layer.id, () => { mapboxMap.getCanvas().style.cursor = 'pointer'; });
                        mapboxMap.on('mouseleave', layer.id, () => { mapboxMap.getCanvas().style.cursor = ''; });
                    }
                    console.log(`✅ Capa ${layer.id} añadida correctamente`);
                } catch (error) {
                    console.error(`❌ Error añadiendo capa ${layer.id}:`, error);
                }
            }
        } else {
            console.log('ℹ️ No hay capas para añadir');
        }
        console.log('📏 Resize final del mapa tras cargar capas...');
        setTimeout(() => { if (mapboxMap) { mapboxMap.resize(); console.log('✅ Resize final completado'); } }, 500);
    };

    // Aplicar configuración específica con manejo de estilo actual
    console.log('🗺️ Aplicando configuración del mapa...');
    const targetStyle = config.style || currentBaseStyle;
    const shouldChangeStyle = targetStyle !== currentBaseStyle;
    if (shouldChangeStyle) {
        // Cambiaremos de estilo y esperaremos a que cargue para añadir capas
        mapboxMap.once('style.load', onStyleLoad);
        mapboxMap.setStyle(targetStyle);
        currentBaseStyle = targetStyle;
    } else {
        // Mismo estilo: si ya está cargado, añadimos capas de inmediato; si no, esperamos a que cargue
        if (mapboxMap.isStyleLoaded && mapboxMap.isStyleLoaded()) {
            onStyleLoad();
        } else {
            mapboxMap.once('style.load', onStyleLoad);
        }
    }
    mapboxMap.flyTo({
        center: config.center,
        zoom: config.zoom,
        pitch: config.pitch,
        bearing: config.bearing,
        duration: 2000,
        essential: true
    });
    
    console.log('=== showMapOverlay COMPLETADO ===');
}

// Función para ocultar el mapa en modo overlay
function hideMapOverlay() {
    console.log('=== hideMapOverlay INICIANDO ===');
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.style.display = 'none';
        mapContainer.style.opacity = '0';
        mapContainer.style.visibility = 'hidden';
        mapContainer.classList.remove('active');
        const scrollZones = mapContainer.querySelectorAll('.map-scroll-zone');
        scrollZones.forEach(zone => zone.remove());
        // Remover reenrutamiento de scroll
        if (mapContainer._wheelForwardHandler) {
            mapContainer.removeEventListener('wheel', mapContainer._wheelForwardHandler, { capture: true });
        }
        console.log('✅ Contenedor del mapa ocultado');
    } else {
        console.error('❌ No se encontró el contenedor #map para ocultar');
    }
}

// Función para actualizar el mapa según el step actual
function updateMapForStep(stepId) {
    console.log(`=== updateMapForStep(${stepId}) INICIANDO ===`);
    const stepIdStr = String(stepId);
    console.log('📋 Verificando configuración...');
    console.log('Steps visibles:', mapStepsConfig.visibleSteps);
    console.log('¿Step está en visibleSteps?', mapStepsConfig.visibleSteps.includes(Number(stepId)));
    console.log('¿Existe configuración para step?', !!mapStepsConfig.stepConfigs[stepIdStr]);
    if (mapStepsConfig.visibleSteps.includes(Number(stepId)) && mapStepsConfig.stepConfigs[stepIdStr]) {
        console.log(`✅ Step ${stepId} debe mostrar mapa, llamando showMapOverlay...`);
        // Usar el wrapper para que también gestione la leyenda
        if (window.mapboxHelper && typeof window.mapboxHelper.showMapOverlay === 'function') {
            window.mapboxHelper.showMapOverlay(mapStepsConfig.stepConfigs[stepIdStr]);
        } else {
            showMapOverlay(mapStepsConfig.stepConfigs[stepIdStr]);
        }
    } else {
        console.log(`❌ Step ${stepId} NO debe mostrar mapa, llamando hideMapOverlay...`);
        if (window.mapboxHelper && typeof window.mapboxHelper.hideMapOverlay === 'function') {
            window.mapboxHelper.hideMapOverlay();
        } else {
            hideMapOverlay();
        }
    }
    console.log(`=== updateMapForStep(${stepId}) COMPLETADO ===`);
}

// Función para crear zonas de scroll en los bordes del mapa
function createScrollZones(mapContainer) {
    // Eliminar zonas existentes
    const existingZones = mapContainer.querySelectorAll('.map-scroll-zone');
    existingZones.forEach(zone => zone.remove());
    
    // Crear zona superior
    const topZone = document.createElement('div');
    topZone.className = 'map-scroll-zone top';
    topZone.addEventListener('wheel', handleScrollZoneWheel, { passive: false });
    mapContainer.appendChild(topZone);
    
    // Crear zona inferior
    const bottomZone = document.createElement('div');
    bottomZone.className = 'map-scroll-zone bottom';
    bottomZone.addEventListener('wheel', handleScrollZoneWheel, { passive: false });
    mapContainer.appendChild(bottomZone);
}

// Función para manejar scroll en las zonas de bordes
function handleScrollZoneWheel(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Pasar el evento de scroll al documento principal
    const scrollAmount = event.deltaY;
    window.scrollBy(0, scrollAmount);
}

// Función para añadir soporte de scroll con teclado
function addKeyboardScrollSupport() {
    document.addEventListener('keydown', function(event) {
        const mapContainer = document.getElementById('map');
        if (mapContainer && mapContainer.style.display !== 'none') {
            // Permitir scroll con teclas de flecha y Page Up/Down
            if (event.key === 'ArrowDown' || event.key === 'PageDown') {
                event.preventDefault();
                window.scrollBy(0, 100);
            } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
                event.preventDefault();
                window.scrollBy(0, -100);
            } else if (event.key === 'Home') {
                event.preventDefault();
                window.scrollTo(0, 0);
            } else if (event.key === 'End') {
                event.preventDefault();
                window.scrollTo(0, document.body.scrollHeight);
            }
        }
    });
}

// Integración con Scrollama
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando mapa principal...');
    initializeMapbox();
    document.dispatchEvent(new CustomEvent('mapbox-ready'));
});

// Exportar funciones para uso en otros archivos
window.mapboxHelper = { updateMapForStep, showMapOverlay, hideMapOverlay };

// ===== Leyenda dinámica para capas GeoJSON =====
(function() {
  const legendEl = () => document.getElementById('map-legend');
  const itemsEl = () => legendEl() ? legendEl().querySelector('.legend-items') : null;

  function clearLegend() {
    const el = itemsEl();
    if (el) el.innerHTML = '';
  }

  function showLegend(title) {
    const l = legendEl();
    if (!l) return;
    if (title) {
      const t = l.querySelector('.legend-title');
      if (t) t.textContent = title;
    }
    l.style.display = 'block';
  }

  function hideLegend() {
    const l = legendEl();
    if (l) l.style.display = 'none';
  }

  function addItem(color, label) {
    const parent = itemsEl();
    if (!parent) return;
    const row = document.createElement('div');
    row.className = 'legend-item';
    const sw = document.createElement('span');
    sw.className = 'legend-swatch';
    sw.style.background = color;
    const lab = document.createElement('span');
    lab.className = 'legend-label';
    lab.textContent = label;
    row.appendChild(sw); row.appendChild(lab);
    parent.appendChild(row);
  }

  // Interpret Mapbox GL expressions for 'step' and fixed color strings
  function buildLegendFromPaint(paint, options = {}) {
    clearLegend();
    const title = options.title || 'Leyenda';

    // Fixed color string
    const fillColor = paint && paint['fill-color'];
    if (!fillColor) return hideLegend();

    // Expression: ['step', ['get', 'field'], color0, stop1, color1, stop2, color2, ...]
    if (Array.isArray(fillColor) && fillColor[0] === 'step') {
      const expr = fillColor;
      // expr[1] is input, could be coalesce/to-number/get
      const baseColor = expr[2];
      const pairs = [];
      // Remaining are threshold/color pairs
      for (let i = 3; i < expr.length; i += 2) {
        const stop = expr[i];
        const color = expr[i + 1];
        if (typeof stop === 'number' && typeof color === 'string') {
          pairs.push({ stop, color });
        }
      }

      // Build labels: < stop1, stop1–stop2, …, ≥ lastStop
      showLegend(title);
      if (pairs.length === 0) {
        addItem(baseColor, 'Valor bajo');
        return;
      }
      // First range: < first stop => baseColor
      addItem(baseColor, `< ${formatNumber(pairs[0].stop)}`);
      for (let i = 0; i < pairs.length; i++) {
        const from = pairs[i].stop;
        const to = (i + 1 < pairs.length) ? pairs[i + 1].stop : null;
        const color = pairs[i].color;
        const label = to == null
          ? `≥ ${formatNumber(from)}`
          : `${formatNumber(from)} – ${formatNumber(to)}`;
        addItem(color, label);
      }
      return;
    }

    // Simple string color
    if (typeof fillColor === 'string') {
      showLegend(title);
      addItem(fillColor, 'Área destacada');
      return;
    }

    // Fallback: hide
    hideLegend();
  }

  function formatNumber(n) {
    try { return Number(n).toLocaleString('es-MX'); } catch { return String(n); }
  }

  // Hook legend into show/hide overlay
  const originalShow = showMapOverlay;
  const originalHide = hideMapOverlay;

  // Map human titles per step/layer
  const layerTitles = {
    'crecimiento-urbano': 'Expansión urbana por periodo',
    'tasa-cambio-poblacional': 'Población total por AGEB',
    'cambio-poblacional-ageb': 'Población total por AGEB',
    'densidad-poblacional': 'Densidad (hab/ha) por distrito',
    'densidad-poblacional-distritos': 'Densidad (hab/ha) por distrito'
  };

  // Override
  window.mapboxHelper.showMapOverlay = function(config) {
    originalShow(config);
    try {
      // Build legend from the first fill layer in config
      const layer = (config.layers || []).find(l => l.type === 'fill');
      if (layer && layer.paint) {
        const title = layerTitles[layer.id] || 'Leyenda';
        buildLegendFromPaint(layer.paint, { title });
      } else {
        hideLegend();
      }
    } catch (e) {
      console.warn('No se pudo construir la leyenda:', e);
      hideLegend();
    }
  };

  window.mapboxHelper.hideMapOverlay = function() {
    originalHide();
    hideLegend();
  };
})();

// Función de debug para testing manual
window.debugMapa = function(stepId = 20) {
    console.log('=== FUNCIÓN DEBUG MAPA ===');
    console.log('Testing step:', stepId);
    const mapContainer = document.getElementById('map');
    console.log('Contenedor #map:', mapContainer);
    console.log('mapboxMap:', mapboxMap);
    console.log('mapStepsConfig:', mapStepsConfig);
    if (mapContainer) {
        console.log('Estilos actuales del contenedor:');
        console.log('- display:', window.getComputedStyle(mapContainer).display);
        console.log('- opacity:', window.getComputedStyle(mapContainer).opacity);
        console.log('- visibility:', window.getComputedStyle(mapContainer).visibility);
        console.log('- z-index:', window.getComputedStyle(mapContainer).zIndex);
    }
    if (window.mapboxHelper) {
        console.log('Llamando updateMapForStep...');
        window.mapboxHelper.updateMapForStep(stepId);
    }
};