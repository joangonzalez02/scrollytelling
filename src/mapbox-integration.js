/**
 * Integración de Mapbox con Scrollama
 * Este archivo gestiona el mapa de Mapbox para la visualización de datos geográficos
 */

// Variable global para el mapa de Mapbox
let mapboxMap = null;
// Track current base style to avoid unnecessary setStyle calls
let currentBaseStyle = 'mapbox://styles/mapbox/light-v10';

// Lustros disponibles y paleta monocromática basada en colores globales (azules)
const LUSTROS = [1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025];
const LUSTRO_COLORS = {
    1980: '#E3F2FA',
    1985: '#CDEAF6',
    1990: '#B7E1F2',
    1995: '#A1D8EE',
    2000: '#8ECAE6', // global
    2005: '#6FBAD8',
    2010: '#4BAAD0',
    2015: '#219EBC', // global
    2020: '#1A7D95',
    2025: '#023047'  // global
};
let selectedLustros = new Set(LUSTROS); // por defecto, todos activos

// Token de acceso a Mapbox
// ✅ Token actualizado - Si sigue dando error 403, crea tu propia cuenta en:
// https://account.mapbox.com/auth/signup/ (GRATIS, 50,000 vistas/mes)
// Más detalles en: MAPBOX-TOKEN-SETUP.md
const mapboxAccessToken = 'pk.eyJ1IjoiMHhqZmVyIiwiYSI6ImNtZjRjNjczdTA0MGsya3Bwb3B3YWw4ejgifQ.8IZ5PTYktl5ss1gREda3fg';

// Configuración de cuándo mostrar el mapa en cada step
const mapStepsConfig = {
    // Steps donde el mapa debe estar visible (solo los que realmente tienen mapa)
    visibleSteps: [19, 25],
    
    // Configuración específica para cada paso que muestra el mapa
    stepConfigs: {
        // Step 19: Cambio poblacional por AGEB 
        "19": {
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
        // Step 21: Pérdida de vegetación
        "21": {
            center: [-86.8515, 21.1619],
            zoom: 11,
            pitch: 20,
            bearing: 0,
            style: 'mapbox://styles/mapbox/light-v10',
            layers: []
        },
        // Step 25: Densidad poblacional por distrito 
        "25": {
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
    
    console.log('🗺️ Instancia de mapa creada con estilo:', currentBaseStyle);
    
    // Log de eventos de estilo para debugging
    mapboxMap.on('styledata', () => {
        console.log('🎨 Estilo del mapa cargando datos...');
    });
    
    mapboxMap.on('style.load', () => {
        console.log('🎨 Estilo del mapa completamente cargado');
    });
    
    mapboxMap.on('error', (e) => {
        console.error('❌ Error en Mapbox:', e.error);
    });
    
    // RESTAURAR ESTADO ORIGINAL DEL CONTENEDOR DESPUÉS DE INICIALIZACIÓN
    mapboxMap.on('load', () => {
        console.log('🗺️ Mapa cargado correctamente');
        // NO restaurar a oculto, dejar que sea controlado por showMapOverlay/hideMapOverlay
        // Solo remover clase active para que comience en estado neutral
        mapContainer.classList.remove('active');
        // Asegurar que el contenedor vuelva a estado oculto inicial
        mapContainer.style.display = 'none';
        mapContainer.style.visibility = 'hidden';
        mapContainer.style.opacity = '0';
        
        // IMPORTANTE: Forzar un resize después de la carga para asegurar dimensiones correctas
        setTimeout(() => {
            if (mapboxMap) {
                mapboxMap.resize();
                console.log('✅ Resize inicial del mapa completado');
            }
        }, 100);
        
        // Verificar que el estilo base se haya cargado
        setTimeout(() => {
            const style = mapboxMap.getStyle();
            console.log('🎨 Estilo del mapa:', style ? 'Cargado' : 'NO CARGADO');
            if (style && style.layers) {
                console.log('📊 Capas del estilo base:', style.layers.length);
                console.log('📋 Primeras capas:', style.layers.slice(0, 5).map(l => `${l.id} (${l.type})`));
            }
        }, 500);
        
        // Notificar que Mapbox está listo
        document.dispatchEvent(new CustomEvent('mapbox-ready'));
    });
    
    // Listener global para resize del window
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (mapboxMap && mapContainer.style.display === 'block') {
                mapboxMap.resize();
                console.log('✅ Mapa redimensionado por cambio en ventana');
            }
        }, 250);
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
    mapContainer.style.backgroundColor = ''; // Asegurar que no haya fondo que cubra el mapa
    mapContainer.classList.add('active');
    
    // Asegurarnos que el canvas del mapa tenga opacidad completa y esté visible
    const mapCanvas = mapContainer.querySelector('.mapboxgl-canvas');
    if (mapCanvas) {
        mapCanvas.style.opacity = '1';
        console.log('✅ Canvas del mapa configurado con opacidad 1');
    } else {
        console.warn('⚠️ No se encontró el canvas del mapa');
    }
    
    // Verificar que el contenedor del canvas también esté visible
    const canvasContainer = mapContainer.querySelector('.mapboxgl-canvas-container');
    if (canvasContainer) {
        canvasContainer.style.opacity = '1';
        console.log('✅ Contenedor del canvas configurado');
    }
    
    console.log('✅ Estilos aplicados al contenedor');
    console.log('Contenedor display:', mapContainer.style.display);
    console.log('Contenedor opacity:', mapContainer.style.opacity);
    console.log('Contenedor visibility:', mapContainer.style.visibility);
    console.log('Contenedor z-index:', mapContainer.style.zIndex);
    
    // RESIZE INMEDIATO después de hacer visible el contenedor
    if (mapboxMap) {
        mapboxMap.resize();
        console.log('✅ Resize inmediato ejecutado');
    }
    
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
                        // Variable para almacenar el popup activo
                        let currentPopup = null;
                        
                        // Mostrar popup al pasar el mouse
                        mapboxMap.on('mousemove', layer.id, (e) => {
                            // Remover popup anterior si existe
                            if (currentPopup) {
                                currentPopup.remove();
                            }
                            
                            const properties = e.features[0].properties;
                            const content = layer.popup(properties);
                            currentPopup = new mapboxgl.Popup({
                                closeButton: false,
                                closeOnClick: false
                            })
                            .setLngLat(e.lngLat)
                            .setHTML(content)
                            .addTo(mapboxMap);
                        });
                        
                        // Cambiar cursor al entrar
                        mapboxMap.on('mouseenter', layer.id, () => { 
                            mapboxMap.getCanvas().style.cursor = 'pointer'; 
                        });
                        
                        // Remover popup y restaurar cursor al salir
                        mapboxMap.on('mouseleave', layer.id, () => { 
                            mapboxMap.getCanvas().style.cursor = '';
                            if (currentPopup) {
                                currentPopup.remove();
                                currentPopup = null;
                            }
                        });
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
    
    // Resize adicional después del flyTo para asegurar dimensiones correctas
    setTimeout(() => {
        if (mapboxMap) {
            mapboxMap.resize();
            console.log('✅ Resize post-flyTo completado (1000ms)');
        }
    }, 1000);
    
    setTimeout(() => {
        if (mapboxMap) {
            mapboxMap.resize();
            console.log('✅ Resize post-flyTo completado (2500ms)');
        }
    }, 2500);
    
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
    
    // FORZAR OCULTADO TOTAL DE LEYENDA Y PANEL DE LUSTROS
    try {
        const legend = document.getElementById('map-legend');
        if (legend) {
            legend.style.display = 'none';
            console.log('🔍 DEBUG: Leyenda forzadamente ocultada en hideMapOverlay original');
        }
        const panel = document.getElementById('map-lustro-control');
        if (panel) {
            panel.style.display = 'none';
            console.log('🔍 DEBUG: Panel de lustros forzadamente ocultado en hideMapOverlay original');
        }
    } catch (e) {
        console.warn('Error en limpieza de leyendas:', e);
    }
}

// Función para actualizar el mapa según el step actual
async function updateMapForStep(stepId) {
    console.log(`=== updateMapForStep(${stepId}) INICIANDO ===`);
    
    // FORZAR LIMPIEZA TOTAL AL INICIO DE CUALQUIER ACTUALIZACIÓN
    try {
        const legend = document.getElementById('map-legend');
        if (legend) legend.style.display = 'none';
        const panel = document.getElementById('map-lustro-control');
        if (panel) panel.style.display = 'none';
        console.log('🔍 DEBUG: Limpieza preventiva de leyendas realizada');
    } catch {}
    
    const stepIdStr = String(stepId);
    console.log('📋 Verificando configuración...');
    console.log('Steps visibles:', mapStepsConfig.visibleSteps);
    console.log('¿Step está en visibleSteps?', mapStepsConfig.visibleSteps.includes(Number(stepId)));
    console.log('¿Existe configuración para step?', !!mapStepsConfig.stepConfigs[stepIdStr]);
    if (mapStepsConfig.visibleSteps.includes(Number(stepId)) && mapStepsConfig.stepConfigs[stepIdStr]) {
        console.log(`✅ Step ${stepId} debe mostrar mapa, llamando showMapOverlay...`);
        // Asegurar que el mapa esté listo antes de mostrar
        await ensureMapboxReady();
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
let mapInitPromise = null;
async function ensureMapboxReady() {
    if (mapboxMap) return true;
    if (!mapInitPromise) {
        mapInitPromise = new Promise((resolve) => {
            // Verificar si Mapbox GL ya está cargado (por ejemplo, desde HTML)
            if (typeof mapboxgl !== 'undefined') {
                console.log('✅ Mapbox GL ya está cargado, inicializando mapa...');
                initializeMapbox();
                const onReady = () => { document.removeEventListener('mapbox-ready', onReady); resolve(true); };
                document.addEventListener('mapbox-ready', onReady);
                return;
            }
            
            console.log('⏳ Cargando librería de Mapbox bajo demanda...');
            // Insertar script de Mapbox GL dinámicamente solo si no está cargado
            const script = document.createElement('script');
            script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.js';
            script.async = true;
            script.onload = () => {
                console.log('✅ Mapbox GL cargado, inicializando mapa...');
                initializeMapbox();
                const onReady = () => { document.removeEventListener('mapbox-ready', onReady); resolve(true); };
                document.addEventListener('mapbox-ready', onReady);
            };
            script.onerror = () => {
                console.error('❌ No se pudo cargar Mapbox GL');
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }
    return mapInitPromise;
}

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
    console.log('🔍 DEBUG: showLegend llamado con título:', title);
    const l = legendEl();
    if (!l) {
      console.log('🔍 DEBUG: No se encontró elemento de leyenda');
      return;
    }
    if (title) {
      const t = l.querySelector('.legend-title');
      if (t) t.textContent = title;
    }
    l.style.display = 'block';
    console.log('🔍 DEBUG: Leyenda mostrada, display =', l.style.display);
  }

  function hideLegend() {
    console.log('🔍 DEBUG: hideLegend llamado');
    const l = legendEl();
    if (l) {
      l.style.display = 'none';
      console.log('🔍 DEBUG: Leyenda ocultada');
    }
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
        const allowedValues = options.allowedValues ? new Set(options.allowedValues) : null;

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

        // Expression: ['match', input, v1, c1, v2, c2, ..., defaultColor]
            if (Array.isArray(fillColor) && fillColor[0] === 'match') {
            const expr = fillColor;
            const pairs = [];
            // values start at index 2, alternate as value,color ... until last item which is default
            for (let i = 2; i < expr.length - 1; i += 2) {
                const value = expr[i];
                const color = expr[i + 1];
                if ((typeof value === 'number' || typeof value === 'string') && typeof color === 'string') {
                        if (!allowedValues || allowedValues.has(value)) {
                            pairs.push({ value, color });
                        }
                } else {
                    break;
                }
            }
            if (pairs.length > 0) {
                showLegend(title);
                pairs.forEach(p => addItem(p.color, String(p.value)));
                return;
            }
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
        'tasa-cambio-poblacional': 'Tasa de cambio poblacional (2010–2020)',
        'cambio-poblacional-ageb': 'Tasa de cambio poblacional (2010–2020)',
        'densidad-poblacional': 'Densidad poblacional (hab/ha)',
        'densidad-poblacional-distritos': 'Densidad poblacional (hab/ha)'
  };

  // Override
  window.mapboxHelper.showMapOverlay = function(config) {
        console.log('🔍 DEBUG: showMapOverlay llamado con config:', config);
        
        // FORZAR LIMPIEZA COMPLETA DE TODAS LAS LEYENDAS AL INICIO
        try {
            const l = document.getElementById('map-legend');
            if (l) {
                const items = l.querySelector('.legend-items');
                if (items) items.innerHTML = '';
                // No ocultar aún; decidiremos según la capa
                l.style.display = 'none';
            }
            // También ocultar panel de lustros por defecto
            const panel = document.getElementById('map-lustro-control');
            if (panel) panel.style.display = 'none';
        } catch {}

        originalShow(config);
        try {
            // REGLAS PARA MOSTRAR PANEL DE LUSTROS O LEYENDA
            const hasCrecimiento = (config.layers || []).some(l => l.id === 'crecimiento-urbano');
            
            // USAR EL STEP ID DE LA CONFIGURACIÓN
            let targetStepId = null;
            for (const [stepKey, stepConfig] of Object.entries(mapStepsConfig.stepConfigs)) {
              if (stepConfig === config) {
                targetStepId = parseInt(stepKey);
                break;
              }
            }
            
            // Solo mostrar panel de lustros en step 4 con capa de crecimiento
            const shouldShowLustroPanel = hasCrecimiento && targetStepId === 4;
            
            console.log('🔍 DEBUG: hasCrecimiento:', hasCrecimiento);
            console.log('🔍 DEBUG: targetStepId para panel:', targetStepId);
            console.log('🔍 DEBUG: shouldShowLustroPanel:', shouldShowLustroPanel);
            
            toggleLustroPanel(shouldShowLustroPanel);
            if (shouldShowLustroPanel) {
                console.log('🔍 DEBUG: Aplicando filtro de lustros');
                // Aplicar filtro una vez que la capa exista
                applyLustroFilterWhenReady();
                // En este caso, ocultamos la leyenda (solo checkboxes)
                hideLegend();
            } else {
                // Para otras capas, construir y mostrar la leyenda dinámicamente
                const preferredOrder = [
                    'densidad-poblacional',
                    'densidad-poblacional-distritos',
                    'tasa-cambio-poblacional',
                    'cambio-poblacional-ageb'
                ];
                const layers = (config.layers || []);
                let legendLayer = null;
                // Priorizar por IDs conocidos
                for (const id of preferredOrder) {
                    const found = layers.find(l => l.id === id);
                    if (found) { legendLayer = found; break; }
                }
                // Si no, tomar la primera capa tipo fill con expresión de color
                if (!legendLayer) {
                    legendLayer = layers.find(l => l.type === 'fill' && l.paint && l.paint['fill-color']);
                }
                if (legendLayer && legendLayer.paint) {
                    const title = layerTitles[legendLayer.id] || 'Leyenda';
                    buildLegendFromPaint(legendLayer.paint, { title });
                } else {
                    hideLegend();
                }
            }
    } catch (e) {
      console.warn('No se pudo construir la leyenda:', e);
      hideLegend();
    }
  };

  window.mapboxHelper.hideMapOverlay = function() {
    console.log('🔍 DEBUG: hideMapOverlay ejecutado - FORZANDO OCULTADO TOTAL');
    originalHide();
    
    // FORZAR OCULTADO TOTAL DE TODAS LAS LEYENDAS Y PANELES
    try {
      const legend = document.getElementById('map-legend');
      if (legend) {
        legend.style.display = 'none';
        console.log('🔍 DEBUG: Leyenda forzadamente ocultada');
      }
      
      const panel = document.getElementById('map-lustro-control');
      if (panel) {
        panel.style.display = 'none';
        console.log('🔍 DEBUG: Panel de lustros forzadamente ocultado');
      }
    } catch (e) {
      console.warn('Error ocultando leyendas:', e);
    }
    
    hideLegend();
    toggleLustroPanel(false);
  };

    // Exponer un helper público mínimo para actualizar leyenda desde fuera
    window.mapboxLegend = {
        buildFromPaint: (paint, options) => {
            try { buildLegendFromPaint(paint, options || {}); } catch {}
        },
        hide: () => { try { hideLegend(); } catch {} },
        show: (title) => { try { showLegend(title); } catch {} }
    };
})();

// ===== Panel de checkboxes para filtrar por lustro =====
function ensureLustroPanel() {
        if (document.getElementById('map-lustro-control')) return;
        const panel = document.createElement('div');
        panel.id = 'map-lustro-control';
        panel.style.position = 'fixed';
    // La posición se calculará dinámicamente en relación a la leyenda
        panel.style.zIndex = '2000';
        panel.style.background = 'rgba(255,255,255,0.96)';
        panel.style.color = '#222';
        panel.style.borderRadius = '8px';
        panel.style.boxShadow = '0 6px 18px rgba(0,0,0,0.18)';
        panel.style.padding = '10px 12px';
        panel.style.minWidth = '220px';
        panel.style.pointerEvents = 'auto';
        panel.style.display = 'none';

    const title = document.createElement('div');
    title.className = 'lustro-title';
    title.textContent = 'Expansión urbana por periodo';
        title.style.fontWeight = '700';
        title.style.fontSize = '13px';
        title.style.marginBottom = '8px';
        panel.appendChild(title);

    const list = document.createElement('div');
    list.className = 'lustro-list';
        list.style.display = 'grid';
        list.style.gridTemplateColumns = 'repeat(2, minmax(100px, 1fr))';
        list.style.gap = '6px 12px';

        LUSTROS.forEach(l => {
                const item = document.createElement('label');
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.gap = '6px';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.value = String(l);
                cb.checked = true;
                cb.addEventListener('change', () => {
                        if (cb.checked) selectedLustros.add(Number(cb.value));
                        else selectedLustros.delete(Number(cb.value));
                        applyLustroFilterWhenReady();
                });
                const sw = document.createElement('span');
                sw.style.width = '14px';
                sw.style.height = '10px';
                sw.style.borderRadius = '2px';
                sw.style.border = '1px solid rgba(0,0,0,0.2)';
                sw.style.display = 'inline-block';
                sw.style.background = LUSTRO_COLORS[l];
                const lab = document.createElement('span');
                lab.textContent = String(l);
                item.appendChild(cb);
                item.appendChild(sw);
                item.appendChild(lab);
                list.appendChild(item);
        });
        panel.appendChild(list);
        document.body.appendChild(panel);
}

function toggleLustroPanel(show) {
        console.log('🔍 DEBUG: toggleLustroPanel llamado con show =', show);
        ensureLustroPanel();
        const panel = document.getElementById('map-lustro-control');
        console.log('🔍 DEBUG: Panel encontrado:', !!panel);
        if (!panel) return;
        panel.style.display = show ? 'block' : 'none';
        console.log('🔍 DEBUG: Panel display establecido a:', panel.style.display);
        if (show) {
            positionLustroPanel();
            window.addEventListener('resize', positionLustroPanel);
        } else {
            window.removeEventListener('resize', positionLustroPanel);
        }
}

function positionLustroPanel() {
    const panel = document.getElementById('map-lustro-control');
    if (!panel || panel.style.display === 'none') return;
    const legend = document.getElementById('map-legend');

    // Asegurar que podemos medir
    const prevVis = panel.style.visibility;
    const prevDisp = panel.style.display;
    if (prevDisp === 'none') {
        panel.style.visibility = 'hidden';
        panel.style.display = 'block';
    }
    const panelRect = panel.getBoundingClientRect();
    const panelW = panelRect.width || 240;
    const panelH = panelRect.height || 120;

    const gap = 8;
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const isMobile = vw <= 640;

    // Siempre ubicar en la esquina inferior derecha para no estorbar el mapa
    panel.style.right = '14px';
    panel.style.left = '';
    panel.style.top = '';
    panel.style.bottom = '14px';

    // Ajustes de tamaño para móviles (compacto)
    panel.style.minWidth = isMobile ? '190px' : '240px';
    panel.style.padding = isMobile ? '6px 8px' : '10px 12px';
    panel.style.maxHeight = isMobile ? '40vh' : '60vh';
    panel.style.overflowY = 'auto';

    const titleEl = panel.querySelector('.lustro-title');
    if (titleEl) {
        titleEl.style.fontSize = isMobile ? '12px' : '13px';
        titleEl.style.marginBottom = isMobile ? '6px' : '8px';
    }
    const list = panel.querySelector('.lustro-list');
    if (list) {
        // En móvil: 2 columnas; en escritorio: 1 columna (según lo solicitado)
        list.style.gridTemplateColumns = isMobile
            ? 'repeat(2, minmax(90px, 1fr))'
            : 'repeat(1, minmax(140px, 1fr))';
        list.style.gap = isMobile ? '4px 8px' : '6px 12px';
        // Ajustar tamaño de swatches y tipografía en items
        Array.from(list.children).forEach(lbl => {
            if (!(lbl instanceof HTMLElement)) return;
            lbl.style.gap = isMobile ? '4px' : '6px';
            const cb = lbl.querySelector('input[type="checkbox"]');
            if (cb) cb.style.transform = isMobile ? 'scale(0.9)' : 'scale(1)';
            const sw = lbl.querySelector('span'); // primer span del item (swatch)
            if (sw) {
                sw.style.width = isMobile ? '12px' : '14px';
                sw.style.height = isMobile ? '8px' : '10px';
            }
            const lab = lbl.querySelector('span + span'); // segundo span (etiqueta)
            if (lab) {
                lab.style.fontSize = isMobile ? '12px' : '13px';
            }
        });
    }

    // Restaurar estado si fue modificado para medir
    if (prevDisp === 'none') {
        panel.style.display = 'none';
        panel.style.visibility = prevVis || 'visible';
    }
}

function applyLustroFilter() {
        if (!mapboxMap) return;
        const layerId = 'crecimiento-urbano';
        if (!mapboxMap.getLayer || !mapboxMap.getLayer(layerId)) return;
        const values = Array.from(selectedLustros);
    if (values.length === 0) {
        // Ocultar completamente la capa y la leyenda
        try { mapboxMap.setLayoutProperty(layerId, 'visibility', 'none'); } catch {}
        const legend = document.getElementById('map-legend');
        if (legend) legend.style.display = 'none';
        // También quitar cualquier filtro anterior para futuras activaciones
        try { mapboxMap.setFilter(layerId, null); } catch {}
        return;
    }
    // Mostrar la capa, aplicar el filtro y reconstruir leyenda con seleccionados
    try { mapboxMap.setLayoutProperty(layerId, 'visibility', 'visible'); } catch {}
    // Construir un 'match' enumerado: ['match', ['to-number', ['get','LUSTRO']], v1, true, v2, true, ..., false]
    const matchExpr = ['match', ['to-number', ['get', 'LUSTRO']]];
    values.forEach(v => { matchExpr.push(v, true); });
    matchExpr.push(false);
    mapboxMap.setFilter(layerId, matchExpr);
    try { console.debug('Filtro aplicado a crecimiento-urbano:', JSON.stringify(matchExpr)); } catch {}
    // No reconstruir la leyenda: dejamos únicamente el panel de lustros visible
}

function applyLustroFilterWhenReady(attempts = 0) {
        if (!mapboxMap) return;
        const layerId = 'crecimiento-urbano';
        if (mapboxMap.getLayer && mapboxMap.getLayer(layerId)) {
                applyLustroFilter();
                return;
        }
        if (attempts > 10) return; // evitar bucle infinito
        // Reintentar pronto y también cuando el mapa esté idle
        setTimeout(() => applyLustroFilterWhenReady(attempts + 1), 150);
        try { mapboxMap.once && mapboxMap.once('idle', () => applyLustroFilter()); } catch {}
}

// Función de debug para testing manual
window.debugMapa = function(stepId = 19) {
    console.log('=== FUNCIÓN DEBUG MAPA ===');
    console.log('Testing step:', stepId);
    const mapContainer = document.getElementById('map');
    console.log('Contenedor #map:', mapContainer);
    console.log('mapboxMap:', mapboxMap);
    console.log('mapStepsConfig:', mapStepsConfig);
    
    // Debug de elementos de leyenda
    const legend = document.getElementById('map-legend');
    console.log('Elemento leyenda:', legend);
    const panel = document.getElementById('map-lustro-control');
    console.log('Panel lustros:', panel);
    
    // Debug del step actual
    const currentStep = document.querySelector('.step.is-active');
    console.log('Step actual en DOM:', currentStep);
    if (currentStep) {
        console.log('Data-step del elemento actual:', currentStep.getAttribute('data-step'));
    }
    
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
