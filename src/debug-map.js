/**
 * Script de diagnóstico para debugging del mapa de Mapbox
 * Copia y pega este código en la consola del navegador cuando estés en un step con mapa
 */

console.log('=== DIAGNÓSTICO DEL MAPA DE MAPBOX ===\n');

// 1. Verificar que mapboxgl esté cargado
if (typeof mapboxgl === 'undefined') {
    console.error('❌ mapboxgl NO está definido');
} else {
    console.log('✅ mapboxgl está cargado, versión:', mapboxgl.version);
}

// 2. Verificar que el mapa esté inicializado
if (typeof mapboxMap === 'undefined' || !mapboxMap) {
    console.error('❌ mapboxMap NO está inicializado');
} else {
    console.log('✅ mapboxMap está inicializado');
    
    // 3. Verificar el estado del mapa
    console.log('📊 Estado del mapa:');
    console.log('  - isStyleLoaded:', mapboxMap.isStyleLoaded());
    console.log('  - Zoom:', mapboxMap.getZoom());
    console.log('  - Center:', mapboxMap.getCenter());
    console.log('  - Style:', mapboxMap.getStyle()?.name || 'No cargado');
    
    // 4. Verificar las capas
    const style = mapboxMap.getStyle();
    if (style && style.layers) {
        console.log('📋 Capas cargadas:', style.layers.length);
        console.log('  Primeras 10 capas:');
        style.layers.slice(0, 10).forEach(layer => {
            console.log(`    - ${layer.id} (${layer.type})`);
        });
        
        // Buscar capas personalizadas
        const customLayers = style.layers.filter(l => 
            l.id.includes('crecimiento') || 
            l.id.includes('poblacional') || 
            l.id.includes('densidad')
        );
        if (customLayers.length > 0) {
            console.log('  Capas personalizadas encontradas:', customLayers.length);
            customLayers.forEach(layer => {
                console.log(`    - ${layer.id} (${layer.type})`);
            });
        }
    }
    
    // 5. Verificar las fuentes
    if (style && style.sources) {
        console.log('🗂️ Fuentes cargadas:', Object.keys(style.sources).length);
        Object.keys(style.sources).forEach(sourceId => {
            const source = style.sources[sourceId];
            console.log(`  - ${sourceId} (${source.type})`);
        });
    }
}

// 6. Verificar el contenedor del mapa
const mapContainer = document.getElementById('map');
if (!mapContainer) {
    console.error('❌ Contenedor #map NO encontrado');
} else {
    console.log('✅ Contenedor #map encontrado');
    console.log('📦 Estilos del contenedor:');
    console.log('  - display:', mapContainer.style.display || 'default');
    console.log('  - opacity:', mapContainer.style.opacity || 'default');
    console.log('  - visibility:', mapContainer.style.visibility || 'default');
    console.log('  - zIndex:', mapContainer.style.zIndex || 'default');
    console.log('  - backgroundColor:', mapContainer.style.backgroundColor || 'none');
    console.log('  - Clases:', mapContainer.className);
    
    // 7. Verificar el canvas
    const canvas = mapContainer.querySelector('.mapboxgl-canvas');
    if (!canvas) {
        console.error('❌ Canvas del mapa NO encontrado');
    } else {
        console.log('✅ Canvas del mapa encontrado');
        console.log('🎨 Estilos del canvas:');
        console.log('  - width:', canvas.width);
        console.log('  - height:', canvas.height);
        console.log('  - opacity:', canvas.style.opacity || 'default');
        console.log('  - visibility:', canvas.style.visibility || 'default');
        
        // Verificar si el canvas tiene contenido
        try {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
            const pixel = imageData.data;
            console.log('🖼️ Pixel central del canvas (RGBA):', pixel[0], pixel[1], pixel[2], pixel[3]);
            if (pixel[0] === 255 && pixel[1] === 255 && pixel[2] === 255) {
                console.warn('⚠️ El pixel central es BLANCO - el mapa podría no estar renderizado');
            } else {
                console.log('✅ El canvas tiene contenido renderizado');
            }
        } catch (e) {
            console.warn('⚠️ No se pudo analizar el contenido del canvas:', e.message);
        }
    }
}

console.log('\n=== FIN DEL DIAGNÓSTICO ===');
