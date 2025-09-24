// Configuración de capas Lizmap para cada step del scrollytelling
const lizmapLayerConfig = {
    // Configuración base de Lizmap
    baseConfig: {
        server: 'http://45.132.241.118/lizmap/index.php/view/map',
        repository: 'etapasimplementadas20232024',
        project: 'Semaforos_2025_'
    },
    
    // Configuración de capas por step (steps con has-map class muestran visualizaciones)
    stepLayers: {
        1: { // Imagen aérea contrastando Zona Hotelera, Laguna Nichupté y ciudad continental
            layers: ['baselayers', 'zona_hotelera', 'laguna_nichupte', 'ciudad_continental'],
            center: [-86.84, 21.13],
            zoom: 10,
            description: 'Contraste Zona Hotelera y Ciudad Continental'
        },
        3: { // Mapa histórico de la franja hotelera y supermanzanas iniciales
            layers: ['baselayers', 'desarrollo_historico', 'supermanzanas_originales'],
            center: [-86.82, 21.08],
            zoom: 11,
            description: 'Desarrollo histórico y supermanzanas'
        },
        5: { // Gráfico comparativo poblacional (México – Mundo – Q. Roo – Benito Juárez, 1970–2020)
            layers: ['baselayers', 'crecimiento_poblacional', 'comparativo_regional'],
            center: [-86.85, 21.08],
            zoom: 11,
            description: 'Crecimiento poblacional comparativo'
        },
        7: { // Gráfico de crecimiento de la mancha urbana (1984–2020)
            layers: ['baselayers', 'expansion_urbana', 'mancha_urbana_historica'],
            center: [-86.85, 21.08],
            zoom: 10,
            description: 'Expansión de la mancha urbana'
        },
        9: { // Mapa de tasa de cambio poblacional por AGEB (2010–2020)
            layers: ['baselayers', 'densidad_poblacional', 'cambio_poblacional_ageb'],
            center: [-86.85, 21.05],
            zoom: 11,
            description: 'Cambio poblacional por AGEB'
        },
        11: { // Gráfico pérdida de cobertura forestal (2000–2020) + mapa ANP Nichupté
            layers: ['baselayers', 'cobertura_forestal', 'anp_nichupte', 'perdida_vegetacion'],
            center: [-86.85, 21.10],
            zoom: 10,
            description: 'Impacto ambiental y ANP'
        },
        13: { // Mapa de densidad poblacional por distrito
            layers: ['baselayers', 'densidad_poblacional', 'distritos', 'servicios_publicos'],
            center: [-86.85, 21.05],
            zoom: 10,
            description: 'Densidad poblacional por distrito'
        },
        15: { // Gráfico del parque vehicular (2010–2023) + autos por vivienda
            layers: ['baselayers', 'red_vial', 'congestion_vehicular', 'transporte_publico'],
            center: [-86.83, 21.06],
            zoom: 11,
            description: 'Parque vehicular y movilidad'
        },
        17: { // Fotos de tráfico + periferias con servicios insuficientes
            layers: ['baselayers', 'crucesintervenidos_2023_2024', 'servicios_publicos', 'periferias'],
            center: [-86.83, 21.06],
            zoom: 12,
            description: 'Consecuencias sociales y urbanas'
        },
        19: { // Mockup "antes/después" de calle completa + foto del Parque de la Equidad
            layers: ['baselayers', 'proyectos_futuros', 'parque_equidad', 'calles_completas'],
            center: [-86.82, 21.08],
            zoom: 12,
            description: 'Soluciones sostenibles y proyectos modelo'
        }
    },
    
    // Función para generar la URL de Lizmap
    generateLizmapUrl: function(stepConfig) {
        const { server, repository, project } = this.baseConfig;
        const layers = stepConfig.layers.join(',');
        const bbox = this.calculateBbox(stepConfig.center, stepConfig.zoom);
        
        return `${server}?repository=${repository}&project=${project}&layers=${layers}&bbox=${bbox}&center=${stepConfig.center.join(',')}&zoom=${stepConfig.zoom}`;
    },
    
    // Función para calcular el bbox basado en centro y zoom
    calculateBbox: function(center, zoom) {
        const [lon, lat] = center;
        const delta = 0.1 / zoom; // Aproximación simple para el delta
        return `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
    }
};

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = lizmapLayerConfig;
} else if (typeof window !== 'undefined') {
    window.lizmapLayerConfig = lizmapLayerConfig;
}