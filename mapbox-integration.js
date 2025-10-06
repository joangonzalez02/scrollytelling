/**
 * Integración de Mapbox con Scrollama
 * Este archivo gestiona el mapa de Mapbox para la visualización de datos geográficos
 */

// Variable global para el mapa de Mapbox
let mapboxMap = null;

// Token de acceso a Mapbox
const mapboxAccessToken = 'pk.eyJ1IjoiMHhqZmVyIiwiYSI6ImNtZjRjNjczdTA0MGsya3Bwb3B3YWw4ejgifQ.8IZ5PTYktl5ss1gREda3fg';

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
            layers: [
                {
                    id: 'supermanzanas-iniciales',
                    type: 'fill',
                    source: {
                        type: 'geojson',
                        data: 'public/data/supermanzanas-iniciales.gpkg'
                    },
                    paint: {
                        'fill-color': '#219EBC',
                        'fill-opacity': 0.6,
                        'fill-outline-color': '#023047'
                    },
                    popup: (properties) => {
                        return `<h3>Supermanzana ${properties.supermanzana || ''}</h3>
                                <p>Parte del plan maestro original de Cancún</p>`;
                    }
                }
            ]
        },
        // Step 4: Expansión urbana sin freno (mapa de crecimiento mancha urbana)
        "4": {
            center: [-86.8515, 21.1619], // Centro en Cancún
            zoom: 11,
            pitch: 30,
            bearing: 0,
            style: 'mapbox://styles/mapbox/satellite-streets-v11',
            layers: []
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
                        'fill-color': [
                            'step',
                            ['get', 'pobtot'],
                            '#e63946', // bajo (rojo)
                            1000, '#ffb703', // medio-bajo (amarillo)
                            5000, '#8ecae6', // medio (azul claro)
                            10000, '#219ebc', // medio-alto (azul medio)
                            50000, '#023047'  // alto (azul oscuro)
                        ],
                        'fill-opacity': 0.7,
                        'fill-outline-color': '#555'
                    },
                    popup: (properties) => {
                        return `<h3>Supermanzana ${properties.supermanzana || 'N/A'}</h3>
                                <p>Población: ${properties.pobtot.toLocaleString()} habitantes</p>`;
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
            style: 'mapbox://styles/mapbox/dark-v10',
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
                            ['get', 'DEN_HAB_HA'],
                            '#f1faee', // baja densidad (claro)
                            10, '#a8dadc', 
                            30, '#457b9d',
                            60, '#1d3557',
                            100, '#e63946'  // alta densidad (intenso)
                        ],
                        'fill-opacity': 0.8,
                        'fill-outline-color': '#fff'
                    },
                    popup: (properties) => {
                        return `<h3>Distrito ${properties.fid}</h3>
                                <p>Población: ${properties.POBTOT.toLocaleString()} habitantes</p>
                                <p>Densidad: ${properties.DEN_HAB_HA.toFixed(1)} hab/ha</p>
                                <p>Superficie: ${properties.SUPERFICIE_HA.toFixed(1)} hectáreas</p>`;
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
                        'fill-color': [
                            'step',
                            ['get', 'pobtot'],
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
            style: 'mapbox://styles/mapbox/satellite-streets-v11',
            layers: []
        },
        // Step 24: Densidad poblacional por distrito
        "24": {
            center: [-86.8515, 21.1619],
            zoom: 11,
            pitch: 30,
            bearing: 0,
            style: 'mapbox://styles/mapbox/dark-v10',
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
                            ['get', 'DEN_HAB_HA'],
                            '#f1faee', // baja densidad (claro)
                            10, '#a8dadc', 
                            30, '#457b9d',
                            60, '#1d3557',
                            100, '#e63946'  // alta densidad (intenso)
                        ],
                        'fill-opacity': 0.8,
                        'fill-outline-color': '#fff'
                    },
                    popup: (properties) => {
                        return `<h3>Distrito ${properties.fid}</h3>
                                <p>Población: ${properties.POBTOT.toLocaleString()} habitantes</p>
                                <p>Densidad: ${properties.DEN_HAB_HA.toFixed(1)} hab/ha</p>
                                <p>Superficie: ${properties.SUPERFICIE_HA.toFixed(1)} hectáreas</p>`;
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
    
    // Crear el contenedor para el overlay si no existe
    if (!document.getElementById('mapbox-container')) {
        const container = document.createElement('div');
        container.id = 'mapbox-container';
        container.className = 'mapbox-container overlay';
        
        // Botón de cierre
        const closeBtn = document.createElement('button');
        closeBtn.className = 'map-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = hideMapOverlay;
        
        container.appendChild(closeBtn);
        document.body.appendChild(container);
    }
    
    // Inicializar el mapa en el contenedor principal #map
    mapboxMap = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-86.8515, 21.1619], // Centro en Cancún
        zoom: 12,
        pitch: 0,
        bearing: 0
    });
    
    // Añadir controles al mapa
    mapboxMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapboxMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    
    // Crear mapas embebidos en steps específicos
    createEmbeddedMaps();
    
    console.log('Mapa de Mapbox inicializado correctamente');
}

// Crear mapas embebidos dentro de los steps que lo requieran
function createEmbeddedMaps() {
    // Los steps 4, 20, 22, 24 usan overlay, no embebidos
    const overlaySteps = ['4', '20', '22', '24'];
    
    // Recorrer la configuración de steps
    Object.keys(mapStepsConfig.stepConfigs).forEach(stepId => {
        // Saltar steps que deben usar overlay
        if (overlaySteps.includes(stepId)) {
            console.log(`Step ${stepId} usa overlay, saltando creación de mapa embebido`);
            return;
        }
        
        const step = document.querySelector(`section[data-step="${stepId}"]`);
        if (!step) return;
        
        // Verificar si ya existe un mapa embebido en este step
        let mapContainer = step.querySelector('.mapbox-embedded');
        
        if (!mapContainer) {
            // Crear contenedor para el mapa
            mapContainer = document.createElement('div');
            mapContainer.className = 'mapbox-container mapbox-embedded';
            mapContainer.id = `mapbox-embedded-${stepId}`;
            mapContainer.style.height = '400px';
            mapContainer.style.margin = '20px 0';
            
            // Buscar dónde insertar el mapa dentro del step
            const stepContent = step.querySelector('.step-content');
            if (stepContent) {
                // Insertar después del contenido
                stepContent.appendChild(mapContainer);
            } else {
                // Si no hay un contenedor específico, añadir al final del step
                step.appendChild(mapContainer);
            }
            
            // Inicializar el mapa embebido con la configuración específica
            const config = mapStepsConfig.stepConfigs[stepId];
            
            // Crear el mapa
            const embeddedMap = new mapboxgl.Map({
                container: mapContainer.id,
                style: config.style,
                center: config.center,
                zoom: config.zoom,
                pitch: config.pitch,
                bearing: config.bearing,
                interactive: true
            });
            
            // Añadir controles básicos
            embeddedMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
            
            // Añadir capas específicas para este mapa
            embeddedMap.on('load', () => {
                // Cargar capas GeoJSON para este step
                if (config.layers && config.layers.length > 0) {
                    config.layers.forEach(layer => {
                        // Primero añadir la fuente
                        const sourceId = `${layer.id}-src-${stepId}`;
                        embeddedMap.addSource(sourceId, layer.source);
                        
                        // Luego añadir la capa usando esa fuente
                        embeddedMap.addLayer({
                            id: `${layer.id}-${stepId}`,
                            type: layer.type,
                            source: sourceId,
                            paint: layer.paint
                        });
                        
                        // Si la capa tiene popup configurado, añadirlo
                        if (layer.popup) {
                            // Añadir interacción de popup
                            embeddedMap.on('click', `${layer.id}-${stepId}`, (e) => {
                                const properties = e.features[0].properties;
                                const content = layer.popup(properties);
                                
                                new mapboxgl.Popup()
                                    .setLngLat(e.lngLat)
                                    .setHTML(content)
                                    .addTo(embeddedMap);
                            });
                            
                            // Cambiar el cursor al pasar por encima
                            embeddedMap.on('mouseenter', `${layer.id}-${stepId}`, () => {
                                embeddedMap.getCanvas().style.cursor = 'pointer';
                            });
                            
                            // Restaurar cursor al salir
                            embeddedMap.on('mouseleave', `${layer.id}-${stepId}`, () => {
                                embeddedMap.getCanvas().style.cursor = '';
                            });
                        }
                    });
                }
            });
        }
    });
}

// Función para mostrar el mapa en modo overlay
function showMapOverlay(config) {
    console.log('showMapOverlay: Mostrando mapa con configuración:', config);
    
    const mapContainer = document.getElementById('map');
    
    if (!mapContainer || !mapboxMap) {
        console.error('No se encontró el contenedor del mapa o el mapa no está inicializado');
        return;
    }
    
    // Asegurar que el mapa base esté visible
    mapContainer.style.display = 'block';
    mapContainer.style.opacity = '1';
    mapContainer.style.visibility = 'visible';
    
    console.log('Contenedor del mapa mostrado, aplicando configuración...');
    
    // Aplicar configuración específica
    mapboxMap.setStyle(config.style);
    mapboxMap.flyTo({
        center: config.center,
        zoom: config.zoom,
        pitch: config.pitch,
        bearing: config.bearing,
        duration: 2000,
        essential: true
    });
    
    // Cuando el estilo termine de cargarse, añadir capas específicas
    mapboxMap.once('styledata', () => {
        console.log('Estilo del mapa cargado, añadiendo capas...');
        
        // Eliminar capas existentes si las hay
        const layersToRemove = [
            'densidad-poblacional', 'densidad-poblacional-distritos', 
            'tasa-cambio-poblacional', 'cambio-poblacional-ageb', 
            'supermanzanas-iniciales'
        ];
        
        layersToRemove.forEach(layerId => {
            if (mapboxMap.getLayer(layerId)) {
                mapboxMap.removeLayer(layerId);
                console.log(`Capa ${layerId} eliminada`);
            }
        });
        
        // Eliminar fuentes existentes si las hay
        const sourcesToRemove = [
            'densidad-poblacional-src', 'densidad-poblacional-distritos-src',
            'tasa-cambio-poblacional-src', 'cambio-poblacional-ageb-src',
            'supermanzanas-iniciales-src'
        ];
        
        sourcesToRemove.forEach(sourceId => {
            if (mapboxMap.getSource(sourceId)) {
                mapboxMap.removeSource(sourceId);
                console.log(`Fuente ${sourceId} eliminada`);
            }
        });
        
        // Añadir las capas definidas en la configuración
        if (config.layers && config.layers.length > 0) {
            config.layers.forEach(layer => {
                console.log(`Añadiendo capa: ${layer.id}`);
                console.log(`Fuente de datos: ${layer.source.data}`);
                
                // Primero añadir la fuente
                const sourceId = layer.id + '-src';
                mapboxMap.addSource(sourceId, layer.source);
                
                // Luego añadir la capa usando esa fuente
                mapboxMap.addLayer({
                    id: layer.id,
                    type: layer.type,
                    source: sourceId,
                    paint: layer.paint
                });
                
                // Añadir interacción de popup si está configurada
                if (layer.popup) {
                    mapboxMap.on('click', layer.id, (e) => {
                        const properties = e.features[0].properties;
                        const content = layer.popup(properties);
                        
                        new mapboxgl.Popup()
                            .setLngLat(e.lngLat)
                            .setHTML(content)
                            .addTo(mapboxMap);
                    });
                    
                    // Cambiar cursor al hover
                    mapboxMap.on('mouseenter', layer.id, () => {
                        mapboxMap.getCanvas().style.cursor = 'pointer';
                    });
                    
                    mapboxMap.on('mouseleave', layer.id, () => {
                        mapboxMap.getCanvas().style.cursor = '';
                    });
                }
                
                console.log(`Capa ${layer.id} añadida correctamente`);
            });
        }
    });
    
    console.log('showMapOverlay: Proceso completado');
}

// Función para ocultar el mapa en modo overlay
function hideMapOverlay() {
    console.log('hideMapOverlay: Ocultando mapa');
    
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.style.display = 'none';
        mapContainer.style.opacity = '0';
        mapContainer.style.visibility = 'hidden';
        console.log('Contenedor del mapa ocultado');
    }
}

// Función para actualizar el mapa según el step actual
function updateMapForStep(stepId) {
    const stepIdStr = String(stepId);
    
    // Verificar si este paso debe mostrar el mapa en overlay
    if (mapStepsConfig.visibleSteps.includes(Number(stepId)) && mapStepsConfig.stepConfigs[stepIdStr]) {
        showMapOverlay(mapStepsConfig.stepConfigs[stepIdStr]);
    } else {
        hideMapOverlay();
    }
}

// Integración con Scrollama
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Mapbox cuando la página esté cargada
    initializeMapbox();
    
    // La integración con Scrollama se realiza en main.js
    // Añade un evento personalizado que será capturado por main.js
    document.dispatchEvent(new CustomEvent('mapbox-ready'));
});

// Exportar funciones para uso en otros archivos
window.mapboxHelper = {
    updateMapForStep,
    showMapOverlay,
    hideMapOverlay
};