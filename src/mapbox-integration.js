/**
 * Integración de Mapbox con Scrollama
 * Este archivo gestiona el mapa de Mapbox para la visualización de datos geográficos
 */

// Variable global para el mapa de Mapbox
let mapboxMap = null;
// Track current base style to avoid unnecessary setStyle calls
let currentBaseStyle = 'mapbox://styles/mapbox/light-v10';
// Flag de depuración (poner en true para ver logs detallados)
const MAPBOX_DEBUG = false;
const dbg = (...args) => { if (MAPBOX_DEBUG) console.log('[MAPBOX]', ...args); };

// Configuración específica para la escena de "Dimensiones de Caminar"
// Incluye los límites del puntaje y la cámara de inicio/fin para animación con scroll
const MAP_CONFIG = {
    scoreMin: 0,
    // Para Step 31 usamos el rango de la categoría superior (1901)
    scoreMax: 1901,
    cameraStart: { zoom: 14, center: [-86.85, 21.168] },
    cameraStartOverride: { center: [-86.853500, 21.171500], zoom: 12.99 },
    cameraEnd: { zoom: 10.5, center: [-86.85, 21.16] }
};

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
    visibleSteps: [19, 25, 31],
    
    // Configuración específica para cada paso que muestra el mapa
    stepConfigs: {
        // Step 19: Cambio porcentual poblacional (2010–2020) por AGEB
        "19": {
            center: MAP_CONFIG.cameraEnd.center,
            zoom: MAP_CONFIG.cameraEnd.zoom,
            pitch: 0,
            bearing: 0,
            style: 'mapbox://styles/mapbox/light-v10',
            layers: [
                {
                    id: 'cambio-poblacional-ageb',
                    type: 'fill',
                    source: {
                        type: 'geojson',
                        data: 'public/data/cambio-poblacional.geojson'
                    },
                    paint: {
                        // Rampa monocromática verde claro (negativos) a verde oscuro (positivos)
                        'fill-color': [
                            'step',
                            ['coalesce', ['to-number', ['get', 'p100_dife_pob']], 0],
                            '#f7fcf5',      // Clase 1: Pérdida muy intensa
                            -75, '#e5f5e0', // Clase 2: Pérdida fuerte
                            -50, '#c7e9c0', // Clase 3: Pérdida moderada
                            -25, '#a1d99b', // Clase 4: Pérdida ligera / estancamiento
                            0,   '#74c476', // Clase 5: Crecimiento ligero
                            25,  '#41ab5d', // Clase 6: Crecimiento moderado
                            50,  '#238b45', // Clase 7: Crecimiento fuerte
                            75,  '#006d2c', // Clase 8: Crecimiento muy fuerte
                            100, '#00441b'  // Clase 9: Crecimiento extraordinario / expansión acelerada
                        ],
                        'fill-opacity': 0.85,
                        'fill-outline-color': '#ffffff'
                    },
                    popup: (props) => {
                        const pob2020 = Number(props.POBTOT || props.Pob2020 || 0);
                        const pob2010 = Number(props.Pob2010 || 0);
                        const difAbs = Number(props.Dif_pob || (pob2020 - pob2010));
                        const difPct = Number(props.p100_dife_pob || ((pob2010 !== 0) ? ((pob2020 - pob2010) / pob2010) * 100 : 0));
                        return `<h3>AGEB ${props.CVE_AGEB || ''}</h3>
                                <p><strong>Población 2010:</strong> ${isFinite(pob2010) ? pob2010.toLocaleString() : 'N/D'} hab.</p>
                                <p><strong>Población 2020:</strong> ${isFinite(pob2020) ? pob2020.toLocaleString() : 'N/D'} hab.</p>
                                <p><strong>Diferencia absoluta:</strong> ${isFinite(difAbs) ? difAbs.toLocaleString() : 'N/D'} hab.</p>
                                <p><strong>Cambio porcentual:</strong> ${isFinite(difPct) ? difPct.toFixed(1) : 'N/D'}%</p>`;
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
        // Step 25: Grado de marginación (GM_2020)
        "25": {
            center: MAP_CONFIG.cameraEnd.center,
            zoom: MAP_CONFIG.cameraEnd.zoom,
            pitch: 30,
            bearing: 0,
            style: 'mapbox://styles/mapbox/light-v10',
            layers: [
                {
                    id: 'indice-marginacion-distritos',
                    type: 'fill',
                    source: {
                        type: 'geojson',
                        data: 'public/data/indice-marginacion.geojson'
                    },
                    paint: {
                        'fill-color': [
                            'match', ['get', 'GM_2020'],
                            'Muy alto', '#5e0a26',
                            'Alto', '#a11742',
                            'Medio', '#d24d71',
                            'Bajo', '#ee89a6',
                            'Muy bajo', '#f9c2d1',
                            /* default */ '#cccccc'
                        ],
                        'fill-opacity': 0.8,
                        'fill-outline-color': '#ffffff'
                    },
                    popup: (properties) => {
                        const pob = Number(properties.POB_TOTAL || properties.POBTOT || 0);
                        const grado = properties.GM_2020 || 'N/D';
                        const im = Number(properties.IM_2020 || 0);
                        // Determinar la clave identificadora
                        const agKey = properties.CVE_AGEB || properties.CVEGEO || properties.CVE || properties.fid || properties.id || '';
                        return `<h3>AGEB ${agKey}</h3>
                                <p><strong>Grado de marginación:</strong> ${grado}</p>
                                <p><strong>Índice de marginación (IM 2020):</strong> ${isFinite(im) ? im.toFixed(2) : 'N/D'}</p>
                                <p><strong>Población 2020:</strong> ${isFinite(pob) ? pob.toLocaleString() : 'N/D'} habitantes</p>`;
                    }
                }
            ]
        },
        // Step 31: Dimensiones de Caminar
        "31": {
            center: [-86.8515, 21.1619],
            zoom: 11,
            pitch: 0,
            bearing: 0,
            style: 'mapbox://styles/mapbox/light-v10',
            layers: [
                {
                    id: 'dimensiones-caminar',
                    type: 'fill',
                    source: {
                        type: 'geojson',
                        data: 'public/data/dimensiones-de-caminar.geojson'
                    },
                    paint: {
                        'fill-color': [
                            'step',
                            ['+',
                                ['to-number', ['get', 'Eval_D_abastecerse_cnt']],
                                ['to-number', ['get', 'Eval_aprender_cnt']],
                                ['to-number', ['get', 'Eval_D_circular_cnt']],
                                ['to-number', ['get', 'Eval_D_cuidados_cnt']],
                                ['to-number', ['get', 'Eval_D_disfrutar_cnt']],
                                ['to-number', ['get', 'Eval_D_reutil_reparar_cnt']],
                                ['to-number', ['get', 'Eval_D_trabajar_cnt']]
                            ],
                            '#f1faee',      // 0 (sin registros)
                            1, '#d4e9e7',   // 1–300 muy baja
                            301, '#a8dadc', // 301–700 baja
                            701, '#6ca9c1', // 701–1250 media
                            1250, '#1d3557',// 1251–1900 alta
                            1901, '#e63946' // 1901+ muy alta
                        ],
                        'fill-opacity': 0.85,
                        'fill-outline-color': '#ffffff'
                    },
                    popup: (p) => {
                        const abastecer = Number(p.Eval_D_abastecerse_cnt || 0);
                        const aprender = Number(p.Eval_aprender_cnt || 0);
                        const circular = Number(p.Eval_D_circular_cnt || 0);
                        const cuidados = Number(p.Eval_D_cuidados_cnt || 0);
                        const disfrutar = Number(p.Eval_D_disfrutar_cnt || 0);
                        const reutil = Number(p.Eval_D_reutil_reparar_cnt || 0);
                        const trabajar = Number(p.Eval_D_trabajar_cnt || 0);
                        const total = abastecer + aprender + circular + cuidados + disfrutar + reutil + trabajar;
                        return `<h3>Oportunidades de las dimensiones del desarrollo</h3>
                            <p><strong>Total agregado:</strong> ${total}</p>
                            <p><strong>Abastecerse:</strong> ${abastecer}</p>
                            <p><strong>Aprender:</strong> ${aprender}</p>
                            <p><strong>Circular:</strong> ${circular}</p>
                            <p><strong>Cuidados:</strong> ${cuidados}</p>
                            <p><strong>Disfrutar:</strong> ${disfrutar}</p>
                            <p><strong>Reutilizar/Reparar:</strong> ${reutil}</p>
                            <p><strong>Trabajar:</strong> ${trabajar}</p>`;
                    }
                }
            ]
        }
    }
};

// Inicializar Mapbox
function initializeMapbox() {
    
    // Establecer token de acceso
    mapboxgl.accessToken = mapboxAccessToken;
    // Deshabilitar telemetría para evitar peticiones de eventos bloqueadas por adblockers
    try { if (mapboxgl.setTelemetryEnabled) { mapboxgl.setTelemetryEnabled(false); } } catch(_) {}
    
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
    // Silenciar errores de eventos de telemetría bloqueados por adblockers
    try {
        const origError = console.error;
        console.error = function(...args) {
            if (args.some(a => typeof a === 'string' && a.includes('events.mapbox.com/events'))) {
                return; // swallow
            }
            origError.apply(console, args);
        };
    } catch(_) {}
        
    // RESTAURAR ESTADO ORIGINAL DEL CONTENEDOR DESPUÉS DE INICIALIZACIÓN
    mapboxMap.on('load', () => {
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
            }
        }, 100);
        
        // Verificar que el estilo base se haya cargado
        setTimeout(() => {
            const style = mapboxMap.getStyle();
            if (style && style.layers) {
                dbg('Capas estilo base:', style.layers.length, style.layers.slice(0, 5).map(l => `${l.id} (${l.type})`));
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
            }
        }, 250);
    });
    
    // Añadir controles al mapa
    mapboxMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapboxMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    
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
    
    const mapContainer = document.getElementById('map');
    
    if (!mapContainer) {
        console.error('❌ No se encontró el contenedor #map');
        return;
    }
    
    if (!mapboxMap) {
        console.error('❌ mapboxMap no está inicializado');
        return;
    }
    
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
    } else {
        console.warn('⚠️ No se encontró el canvas del mapa');
    }
    
    // Verificar que el contenedor del canvas también esté visible
    const canvasContainer = mapContainer.querySelector('.mapboxgl-canvas-container');
    if (canvasContainer) {
        canvasContainer.style.opacity = '1';
    }
    
    // RESIZE INMEDIATO después de hacer visible el contenedor
    if (mapboxMap) {
        mapboxMap.resize();
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
    
    // Deshabilitar zoom con scroll para permitir scrollear la página
    try { mapboxMap.scrollZoom.disable(); } catch (_) {}
    
    // Múltiples resize con diferentes delays para asegurar dimensionamiento correcto
    setTimeout(() => { if (mapboxMap) { mapboxMap.resize(); dbg('Resize 1'); } }, 100);
    setTimeout(() => { if (mapboxMap) { mapboxMap.resize(); dbg('Resize 2'); } }, 300);
    setTimeout(() => { if (mapboxMap) { mapboxMap.resize(); dbg('Resize 3'); } }, 600);
    
    // Preparar manejador para reinsertar las capas al terminar de cargar el estilo
    const onStyleLoad = async () => {
        // Construir dinámicamente la lista de layer IDs y source IDs definidos en la configuración
        const allConfiguredLayerIds = [];
        try {
            for (const sc of Object.values(mapStepsConfig.stepConfigs || {})) {
                if (sc && Array.isArray(sc.layers)) {
                    for (const l of sc.layers) {
                        if (l && l.id) allConfiguredLayerIds.push(l.id);
                    }
                }
            }
        } catch (e) { dbg('error building configuredLayerIds', e); }

        // Eliminar capas existentes definidas por la app si las hay
        allConfiguredLayerIds.forEach(layerId => {
            try {
                // remover listeners asociados para evitar handlers duplicados
                try { mapboxMap.off && mapboxMap.off('mousemove', layerId); } catch (_) {}
                try { mapboxMap.off && mapboxMap.off('mouseenter', layerId); } catch (_) {}
                try { mapboxMap.off && mapboxMap.off('mouseleave', layerId); } catch (_) {}
                if (mapboxMap.getLayer && mapboxMap.getLayer(layerId)) {
                    mapboxMap.removeLayer(layerId);
                }
            } catch (e) { /* silent */ }
        });

        // Eliminar fuentes correspondientes (usamos convención '<layerId>-src')
        allConfiguredLayerIds.forEach(layerId => {
            const sourceId = layerId + '-src';
            try {
                if (mapboxMap.getSource && mapboxMap.getSource(sourceId)) {
                    mapboxMap.removeSource(sourceId);
                }
            } catch (e) { /* silent */ }
        });
        
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
                        // Cargar y reproyectar si es GeoJSON (maneja CRS distinto a 4326, ej. EPSG:32616)
                        if (source.data.toLowerCase().endsWith('.geojson')) {
                            try {
                                const geojsonData = await loadGeoJSONWithReprojection(source.data);
                                source = { ...source, data: geojsonData };
                            } catch (e) {
                                console.warn('⚠️ No se pudo cargar/reproyectar', source.data, e);
                            }
                        }
                    }
                    // Evitar error "There is already a source with ID" si ya existe
                    if (!mapboxMap.getSource(sourceId)) {
                        mapboxMap.addSource(sourceId, source);
                    } else {
                        dbg('Fuente ya existía, se reutiliza:', sourceId);
                    }
                    const paintProperties = { ...layer.paint }; // Conservar opacidad definida
                    // Insertar por debajo de etiquetas para que se vean calles y nombres
                    const layerDef = { id: layer.id, type: layer.type, source: sourceId, paint: paintProperties };
                    if (!mapboxMap.getLayer(layer.id)) {
                        if (beforeLabelId) {
                            mapboxMap.addLayer(layerDef, beforeLabelId);
                        } else {
                            mapboxMap.addLayer(layerDef);
                        }
                    } else {
                        dbg('Capa ya existente, se omite agregar:', layer.id);
                    }
                    if (layer.popup) {
                        // Variable para almacenar el popup activo
                        let currentPopup = null;

                        // Asegurarnos de remover handlers previos para evitar duplicados
                        try { mapboxMap.off && mapboxMap.off('mousemove', layer.id); } catch(_) {}
                        try { mapboxMap.off && mapboxMap.off('mouseenter', layer.id); } catch(_) {}
                        try { mapboxMap.off && mapboxMap.off('mouseleave', layer.id); } catch(_) {}

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
                } catch (error) {
                    console.error(`❌ Error añadiendo capa ${layer.id}:`, error);
                }
            }
        } else {
            dbg('Sin capas para añadir en este step');
        }
        setTimeout(() => { if (mapboxMap) { mapboxMap.resize(); } }, 500);
    };

    // Aplicar configuración específica con manejo de estilo actual
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
        }
    }, 1000);
    
    setTimeout(() => {
        if (mapboxMap) {
            mapboxMap.resize();
        }
    }, 2500);
    
    dbg('showMapOverlay completado');
}

// Función para ocultar el mapa en modo overlay
function hideMapOverlay() {
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
        
    } else {
        console.error('❌ No se encontró el contenedor #map para ocultar');
    }
    
    // FORZAR OCULTADO TOTAL DE LEYENDA Y PANEL DE LUSTROS
    try {
        const legend = document.getElementById('map-legend');
        if (legend) {
            legend.style.display = 'none';        }
        const panel = document.getElementById('map-lustro-control');
        if (panel) {
            panel.style.display = 'none';
        }
    } catch (e) {
        console.warn('Error en limpieza de leyendas:', e);
    }
}

// Función para actualizar el mapa según el step actual
async function updateMapForStep(stepId) {
    
    // FORZAR LIMPIEZA TOTAL AL INICIO DE CUALQUIER ACTUALIZACIÓN
    try {
        const legend = document.getElementById('map-legend');
        if (legend) legend.style.display = 'none';
        const panel = document.getElementById('map-lustro-control');
        if (panel) panel.style.display = 'none';
        dbg('Limpieza preventiva leyendas');
    } catch {}
    
    const stepIdStr = String(stepId);
    if (mapStepsConfig.visibleSteps.includes(Number(stepId)) && mapStepsConfig.stepConfigs[stepIdStr]) {
        // Asegurar que el mapa esté listo antes de mostrar
        await ensureMapboxReady();
        // Usar el wrapper para que también gestione la leyenda
        if (window.mapboxHelper && typeof window.mapboxHelper.showMapOverlay === 'function') {
            window.mapboxHelper.showMapOverlay(mapStepsConfig.stepConfigs[stepIdStr]);
        } else {
            showMapOverlay(mapStepsConfig.stepConfigs[stepIdStr]);
        }
    } else {
        if (window.mapboxHelper && typeof window.mapboxHelper.hideMapOverlay === 'function') {
            window.mapboxHelper.hideMapOverlay();
        } else {
            hideMapOverlay();
        }
    }
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
                        // Si estamos en Step 31 y la capa existe, enfocar a "Muy alta" al entrar
                        const isStep31 = targetStepId === 31;
                        if (isStep31) {
                            const layerId = 'dimensiones-caminar';
                            const sourceId = layerId + '-src';
                            const src = mapboxMap.getSource && mapboxMap.getSource(sourceId);
                            const data = src && (src._data || src._options && src._options.data);
                            if (data && Array.isArray(data.features) && data.features.length > 0) {
                                // Calcular bbox de las features con suma >= 1901 (Muy alta)
                                const sumProps = (p) => (
                                    Number(p.Eval_D_abastecerse_cnt || 0) +
                                    Number(p.Eval_aprender_cnt || 0) +
                                    Number(p.Eval_D_circular_cnt || 0) +
                                    Number(p.Eval_D_cuidados_cnt || 0) +
                                    Number(p.Eval_D_disfrutar_cnt || 0) +
                                    Number(p.Eval_D_reutil_reparar_cnt || 0) +
                                    Number(p.Eval_D_trabajar_cnt || 0)
                                );
                                const target = 1901;
                                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                                const expandBBox = (coords) => {
                                    // coords puede ser arbitrariamente profundo; aplanar buscando puntos [lon,lat]
                                    if (!coords) return;
                                    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
                                        const lon = coords[0], lat = coords[1];
                                        if (isFinite(lon) && isFinite(lat)) {
                                            if (lon < minX) minX = lon;
                                            if (lat < minY) minY = lat;
                                            if (lon > maxX) maxX = lon;
                                            if (lat > maxY) maxY = lat;
                                        }
                                    } else if (Array.isArray(coords)) {
                                        coords.forEach(expandBBox);
                                    }
                                };

                                data.features.forEach((f) => {
                                    try {
                                        const total = sumProps(f.properties || {});
                                        if (total >= target && f.geometry && f.geometry.coordinates) {
                                            expandBBox(f.geometry.coordinates);
                                        }
                                    } catch {}
                                });

                                const hasBBox = isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY) && (maxX > minX) && (maxY > minY);
                                if (MAP_CONFIG.cameraStartOverride && Array.isArray(MAP_CONFIG.cameraStartOverride.center)) {
                                    // Usar override manual si está definido
                                    try {
                                        mapboxMap.jumpTo({ center: MAP_CONFIG.cameraStartOverride.center, zoom: MAP_CONFIG.cameraStartOverride.zoom || 14 });
                                    } catch {}
                                    sceneManager.setScene('step-31', { center: MAP_CONFIG.cameraStartOverride.center, zoom: MAP_CONFIG.cameraStartOverride.zoom || 14 }, { center: MAP_CONFIG.cameraEnd.center, zoom: MAP_CONFIG.cameraEnd.zoom });
                                } else if (hasBBox) {
                                    const bounds = [[minX, minY], [maxX, maxY]];
                                    try {
                                        mapboxMap.fitBounds(bounds, { padding: 60, duration: 800, essential: true });
                                    } catch {}
                                    // Configurar escena desde este encuadre hacia el final (zoom out general)
                                    const centerFrom = [ (minX + maxX) / 2, (minY + maxY) / 2 ];
                                    // Estimar zoom actual después del fit
                                    let currentZoom = mapboxMap.getZoom ? mapboxMap.getZoom() : 12.5;
                                    sceneManager.setScene('step-31', { center: centerFrom, zoom: currentZoom }, { center: MAP_CONFIG.cameraEnd.center, zoom: MAP_CONFIG.cameraEnd.zoom });

                                    // Establecer opacidad inicial: solo "Muy alta" visible
                                    const sumExpr = ['+',
                                        ['to-number', ['get', 'Eval_D_abastecerse_cnt']],
                                        ['to-number', ['get', 'Eval_aprender_cnt']],
                                        ['to-number', ['get', 'Eval_D_circular_cnt']],
                                        ['to-number', ['get', 'Eval_D_cuidados_cnt']],
                                        ['to-number', ['get', 'Eval_D_disfrutar_cnt']],
                                        ['to-number', ['get', 'Eval_D_reutil_reparar_cnt']],
                                        ['to-number', ['get', 'Eval_D_trabajar_cnt']]
                                    ];
                                    try {
                                        mapboxMap.setPaintProperty(layerId, 'fill-opacity', ['case', ['>=', ['coalesce', sumExpr, -9999], 1901], 0.85, 0.02]);
                                    } catch {}
                                }
                            }
                        }
    
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
        const mapVisible = mapContainer && mapContainer.style.display !== 'none';
        if (!mapVisible) return;
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
                initializeMapbox();
                const onReady = () => { document.removeEventListener('mapbox-ready', onReady); resolve(true); };
                document.addEventListener('mapbox-ready', onReady);
                return;
            }
            
            // Insertar script de Mapbox GL dinámicamente solo si no está cargado
            const script = document.createElement('script');
            script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.js';
            script.async = true;
            script.onload = () => {
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

// ===== Escenas con progreso para animar la cámara =====
// Permite interpolar la cámara de Mapbox en función de un progreso 0..1 dentro de una sección larga.
const sceneManager = (function() {
    // Utilidad de interpolación lineal
    function lerp(a, b, t) { return a + (b - a) * t; }
    function lerpCoord(a, b, t) { return [ lerp(a[0], b[0], t), lerp(a[1], b[1], t) ]; }
    function clamp01(x) { return Math.max(0, Math.min(1, x)); }

    const scenes = {
        // Escena para step 25 (marginación)
        // Progreso 0: vista general; progreso 1: zoom a un barrio de interés
        'step-25': {
            from: { center: MAP_CONFIG.cameraEnd.center, zoom: MAP_CONFIG.cameraEnd.zoom, pitch: 10, bearing: 0 },
            to:   { center: MAP_CONFIG.cameraStartOverride.center, zoom: MAP_CONFIG.cameraStartOverride.zoom || 14, pitch: 28, bearing: -10 },
            durationMs: 0 // se anima por frames según progreso; no usamos flyTo con duration
        },
        // Escena para step 19 (cambio porcentual)
        'step-19': {
            from: { center: MAP_CONFIG.cameraEnd.center, zoom: MAP_CONFIG.cameraEnd.zoom, pitch: 0, bearing: 0 },
            to:   { center: MAP_CONFIG.cameraStartOverride.center, zoom: MAP_CONFIG.cameraStartOverride.zoom || 14, pitch: 12, bearing: 5 },
            durationMs: 0
        },
        // Escena para step 31 (dimensiones caminar)
        'step-31': {
            from: { center: MAP_CONFIG.cameraStart.center, zoom: MAP_CONFIG.cameraStart.zoom, pitch: 0, bearing: 0 },
            to:   { center: MAP_CONFIG.cameraEnd.center,   zoom: MAP_CONFIG.cameraEnd.zoom,   pitch: 0, bearing: 0 },
            durationMs: 0
        }
    };

    // Aplica la cámara en función del progreso [0..1]
    function applyCameraProgress(sceneId, progress) {
        if (!mapboxMap) return;
        const scene = scenes[sceneId];
        if (!scene) return;
        const t = clamp01(progress);
        const c = lerpCoord(scene.from.center, scene.to.center, t);
        const z = lerp(scene.from.zoom, scene.to.zoom, t);
        const p = lerp(scene.from.pitch, scene.to.pitch, t);
        const b = lerp(scene.from.bearing, scene.to.bearing, t);
        try {
            mapboxMap.jumpTo({ center: c, zoom: z, pitch: p, bearing: b });
        } catch (e) {
            dbg('jumpTo failed', e);
        }
    }

    // API pública
    return {
        applyCameraProgress,
        has: (id) => Boolean(scenes[id]),
        // Permite ajustar dinámicamente la escena (from/to) tras cargar datos
        setScene: (id, from, to) => {
            if (scenes[id]) {
                if (from) scenes[id].from = { ...scenes[id].from, ...from };
                if (to) scenes[id].to = { ...scenes[id].to, ...to };
            }
        }
    };
})();

// Exponer función para uso desde Scrollama (p.ej., calcular progreso de una sección larga)
window.mapboxHelper.setCameraProgress = function(sceneId, progress) {
    sceneManager.applyCameraProgress(sceneId, progress);
};

// Helper: actualizar opacidad de la capa de dimensiones en función del progreso (umbral descendente)
window.mapboxHelper.updateDimensionesOpacity = function(progress) {
    try {
        if (!mapboxMap) return;
        const layerId = 'dimensiones-caminar';
        if (!mapboxMap.getLayer || !mapboxMap.getLayer(layerId)) return;
        const p = Math.max(0, Math.min(1, Number(progress) || 0));
        // Umbral desciende desde 1901 (Muy alta) hasta 0, para ir incluyendo categorías
        const threshold = MAP_CONFIG.scoreMax - p * (MAP_CONFIG.scoreMax - MAP_CONFIG.scoreMin);
        // Usa la misma suma de campos que define el color como "total" dinámico
        const sumExpr = ['+',
            ['to-number', ['get', 'Eval_D_abastecerse_cnt']],
            ['to-number', ['get', 'Eval_aprender_cnt']],
            ['to-number', ['get', 'Eval_D_circular_cnt']],
            ['to-number', ['get', 'Eval_D_cuidados_cnt']],
            ['to-number', ['get', 'Eval_D_disfrutar_cnt']],
            ['to-number', ['get', 'Eval_D_reutil_reparar_cnt']],
            ['to-number', ['get', 'Eval_D_trabajar_cnt']]
        ];
        const expr = ['case', ['>=', ['coalesce', sumExpr, -9999], threshold], 0.8, 0.05];
        mapboxMap.setPaintProperty(layerId, 'fill-opacity', expr);
    } catch (e) {
        dbg('updateDimensionesOpacity error', e);
    }
};

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
    if (!l) {
      return;
    }
    if (title) {
      const t = l.querySelector('.legend-title');
      if (t) t.textContent = title;
    }
    l.style.display = 'block';
  }

  function hideLegend() {
    const l = legendEl();
    if (l) {
      l.style.display = 'none';
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
        const layerId = options.layerId || null; // Capturar id de capa si se pasó
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

            // PERSONALIZACIÓN: si es la capa de cambio porcentual poblacional, mostrar rangos fijos con %
            if (layerId === 'cambio-poblacional-ageb') {
                showLegend(title);
                const customStops = [
                    { color: baseColor,                 label: '≤ −75% · Pérdida muy intensa de población' },
                    { color: pairs[0]?.color,           label: '−75% a −50% · Pérdida fuerte' },
                    { color: pairs[1]?.color,           label: '−50% a −25% · Pérdida moderada' },
                    { color: pairs[2]?.color,           label: '−25% a 0% · Pérdida ligera / estancamiento' },
                    { color: pairs[3]?.color,           label: '0% a 25% · Crecimiento ligero' },
                    { color: pairs[4]?.color,           label: '25% a 50% · Crecimiento moderado' },
                    { color: pairs[5]?.color,           label: '50% a 75% · Crecimiento fuerte' },
                    { color: pairs[6]?.color,           label: '75% a 100% · Crecimiento muy fuerte' },
                    { color: pairs[7]?.color || pairs[pairs.length-1]?.color, label: '≥ 100% · Crecimiento extraordinario / expansión acelerada' }
                ];
                customStops.forEach(s => { if (s.color && s.label) addItem(s.color, s.label); });
                return;
            }
            // Construcción genérica por defecto
            showLegend(title);
            if (pairs.length === 0) { addItem(baseColor, 'Valor bajo'); return; }
            addItem(baseColor, `< ${formatNumber(pairs[0].stop)} %`);
            for (let i = 0; i < pairs.length; i++) {
                const from = pairs[i].stop;
                const to = (i + 1 < pairs.length) ? pairs[i + 1].stop : null;
                const color = pairs[i].color;
                const label = to == null
                    ? `≥ ${formatNumber(from)} %`
                    : `${formatNumber(from)} – ${formatNumber(to)} %`;
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
      'cambio-poblacional-ageb': 'Cambio porcentual de población (2010–2020)',
      'densidad-poblacional': 'Densidad poblacional (hab/ha)',
      'densidad-poblacional-distritos': 'Densidad poblacional (hab/ha)',
      'indice-marginacion-distritos': 'Grado de marginación (GM 2020)',
      'dimensiones-caminar': 'Diversidad funcional caminable'
  };

  // Override
  window.mapboxHelper.showMapOverlay = function(config) {
        
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
            
            toggleLustroPanel(shouldShowLustroPanel);
            if (shouldShowLustroPanel) {
                // Aplicar filtro una vez que la capa exista
                applyLustroFilterWhenReady();
                // En este caso, ocultamos la leyenda (solo checkboxes)
                hideLegend();
            } else {
                // Para otras capas, construir y mostrar la leyenda dinámicamente
                const preferredOrder = [
                    'indice-marginacion-distritos',
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
                    // Leyenda personalizada para dimensiones de caminar (sumatoria 7 campos)
                    if (legendLayer.id === 'dimensiones-caminar') {
                        const legend = document.getElementById('map-legend');
                        if (legend) {
                            const titleEl = legend.querySelector('.legend-title');
                            const itemsEl = legend.querySelector('.legend-items');
                            if (itemsEl) itemsEl.innerHTML = '';
                            if (titleEl) titleEl.textContent = title;
                            legend.style.display = 'block';
                            const add = (color,label) => {
                                const row = document.createElement('div');
                                row.className = 'legend-item';
                                const sw = document.createElement('span');
                                sw.className = 'legend-swatch';
                                sw.style.background = color;
                                const lab = document.createElement('span');
                                lab.className = 'legend-label';
                                lab.textContent = label;
                                row.appendChild(sw); row.appendChild(lab);
                                itemsEl.appendChild(row);
                            };
                            // Colores definidos en expresión step del paint
                            const expr = legendLayer.paint['fill-color'];
                            // Índices: 2 base, 4,6,8,10,12 colores de los cortes 1,301,701,1250,1901
                            const color0 = expr[2];
                            const color1 = expr[4];
                            const color2 = expr[6];
                            const color3 = expr[8];
                            const color4 = expr[10];
                            const color5 = expr[12];
                            add(color0,'0 Sin registros');
                            add(color1,'1–300 Muy baja');
                            add(color2,'301–700 Baja');
                            add(color3,'701–1250 Media');
                            add(color4,'1251–1900 Alta');
                            add(color5,'1901+ Muy alta');
                        }
                    } else {
                        buildLegendFromPaint(legendLayer.paint, { title, layerId: legendLayer.id });
                    }
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
    originalHide();
    
    // FORZAR OCULTADO TOTAL DE TODAS LAS LEYENDAS Y PANELES
    try {
      const legend = document.getElementById('map-legend');
      if (legend) {
        legend.style.display = 'none';
      }
      
      const panel = document.getElementById('map-lustro-control');
      if (panel) {
        panel.style.display = 'none';
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
        ensureLustroPanel();
        const panel = document.getElementById('map-lustro-control');
        if (!panel) return;
        panel.style.display = show ? 'block' : 'none';
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
