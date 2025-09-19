// Datos simulados para la visualización
const benitoJuarez = { type: "Polygon", coordinates: [[[-87.08, 21.08], [-86.9, 21.14], [-86.7, 21.05], [-86.85, 20.95], [-87.08, 21.08]]] };

// Datos simulados de la laguna Nichupté
const nichupte = { type: "Polygon", coordinates: [[[-86.82, 21.12], [-86.78, 21.10], [-86.77, 21.06], [-86.80, 21.04], [-86.83, 21.07], [-86.82, 21.12]]] };

// Datos simulados de la Zona Hotelera
const zonaHotelera = { type: "LineString", coordinates: [[-86.77, 21.13], [-86.75, 21.10], [-86.76, 21.07], [-86.77, 21.04], [-86.79, 21.02]] };

// Datos simulados de clusters de población
const populationClusters = [
    [-86.80, 21.10], [-86.82, 21.11], [-86.85, 21.12],
    [-86.90, 21.05], [-86.93, 21.06], [-86.95, 21.07],
    [-86.98, 21.02], [-87.01, 21.03], [-87.04, 21.01]
];

// Datos simulados de crecimiento urbano por décadas con más puntos para morphing suave
const urbanGrowth = {
    '1970': { type: "Polygon", coordinates: [[[-86.82, 21.11], [-86.815, 21.105], [-86.81, 21.10], [-86.815, 21.095], [-86.82, 21.09], [-86.825, 21.095], [-86.83, 21.10], [-86.825, 21.105], [-86.82, 21.11]]] },
    '1990': { type: "Polygon", coordinates: [[[-86.83, 21.12], [-86.815, 21.115], [-86.80, 21.11], [-86.805, 21.105], [-86.81, 21.10], [-86.815, 21.105], [-86.82, 21.10], [-86.825, 21.115], [-86.83, 21.12]]] },
    '2000': { type: "Polygon", coordinates: [[[-86.83, 21.12], [-86.805, 21.125], [-86.78, 21.13], [-86.765, 21.115], [-86.75, 21.10], [-86.775, 21.075], [-86.80, 21.05], [-86.825, 21.06], [-86.85, 21.07], [-86.84, 21.095], [-86.83, 21.12]]] },
    '2010': { type: "Polygon", coordinates: [[[-86.83, 21.12], [-86.80, 21.13], [-86.77, 21.14], [-86.745, 21.11], [-86.72, 21.08], [-86.76, 21.05], [-86.80, 21.02], [-86.85, 21.03], [-86.90, 21.04], [-86.865, 21.08], [-86.83, 21.12]]] },
    '2020': { type: "Polygon", coordinates: [[[-86.83, 21.12], [-86.79, 21.135], [-86.75, 21.15], [-86.725, 21.10], [-86.70, 21.05], [-86.775, 21.015], [-86.85, 20.98], [-86.90, 21.015], [-86.95, 21.05], [-86.89, 21.085], [-86.83, 21.12]]] }
};

// Función para morphing suave entre polígonos
function createPolygonMorph(fromGeometry, toGeometry) {
    const fromCoords = fromGeometry.coordinates[0];
    const toCoords = toGeometry.coordinates[0];
    
    // Normalizar número de puntos
    const maxPoints = Math.max(fromCoords.length, toCoords.length);
    const normalizedFrom = normalizePolygonPoints(fromCoords, maxPoints);
    const normalizedTo = normalizePolygonPoints(toCoords, maxPoints);
    
    return function(t) {
        const interpolatedCoords = normalizedFrom.map((fromPoint, i) => {
            const toPoint = normalizedTo[i];
            return [
                fromPoint[0] + (toPoint[0] - fromPoint[0]) * t,
                fromPoint[1] + (toPoint[1] - fromPoint[1]) * t
            ];
        });
        return { type: "Polygon", coordinates: [interpolatedCoords] };
    };
}

function normalizePolygonPoints(coords, targetLength) {
    if (coords.length >= targetLength) return coords.slice(0, targetLength);
    
    const normalized = [...coords];
    while (normalized.length < targetLength) {
        // Insertar puntos intermedios
        for (let i = 0; i < normalized.length - 1 && normalized.length < targetLength; i += 2) {
            const midPoint = [
                (normalized[i][0] + normalized[i + 1][0]) / 2,
                (normalized[i][1] + normalized[i + 1][1]) / 2
            ];
            normalized.splice(i + 1, 0, midPoint);
        }
    }
    return normalized.slice(0, targetLength);
}

// Datos simulados de distritos con densidad poblacional
const densityDistricts = [
    { id: 1, center: [-86.82, 21.10], density: 45, name: "Centro" },
    { id: 4, center: [-86.84, 21.12], density: 105, name: "SM 4" },
    { id: 11, center: [-86.86, 21.08], density: 110, name: "SM 11" },
    { id: 15, center: [-86.88, 21.06], density: 65, name: "SM 15" },
    { id: 20, center: [-86.90, 21.04], density: 30, name: "SM 20" },
    { id: 25, center: [-86.92, 21.02], density: 15, name: "Periferia Este" },
    { id: 30, center: [-86.94, 21.00], density: 8, name: "Periferia Sur" }
];

// Datos simulados de vehículos por año
const vehicleData = [
    { year: 2010, count: 186000 },
    { year: 2015, count: 280000 },
    { year: 2020, count: 380000 },
    { year: 2023, count: 452000 }
];

// Datos simulados de pérdida de cobertura forestal
const forestLossData = [
    { year: 2000, area: 15 },
    { year: 2006, area: 90 },
    { year: 2012, area: 45 },
    { year: 2018, area: 30 },
    { year: 2022, area: 20 }
];

// Estilos de mapa
const satelliteStyle = 'mapbox://styles/mapbox/satellite-streets-v12';
const streetStyle = 'mapbox://styles/mapbox/streets-v12';

// Inicializamos Scrollama y seleccionamos los elementos
const scroller = scrollama();
const graphicContainer = d3.select("#graphic");
const mapaContainer = d3.select("#mapa-container");

// Configuración de Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoiMHhqZmVyIiwiYSI6ImNtZjRjNjczdTA0MGsya3Bwb3B3YWw4ejgifQ.8IZ5PTYktl5ss1gREda3fg'; // Reemplaza con tu token de Mapbox

// Configuración de estilos de mapa

let map, svg, g;

// Función para inicializar el mapa con Mapbox
function setupMap() {
    // Inicializar el mapa de Mapbox
    map = new mapboxgl.Map({
        container: 'mapa-container',
        style: streetStyle,
        center: [-86.85, 21.05], // Coordenadas aproximadas de Cancún
        zoom: 10,
        interactive: false // Desactivar interactividad para evitar conflictos con scroll
    });

    // Esperar a que el mapa cargue antes de añadir elementos
    map.on('load', function() {
        // Crear un contenedor para las visualizaciones D3
        const container = document.createElement('div');
        container.className = 'mapbox-d3-layer';
        const mapContainer = map.getCanvasContainer();
        mapContainer.appendChild(container);

        // Inicializar SVG para D3
        svg = d3.select('.mapbox-d3-layer').append('svg')
            .style('position', 'absolute')
            .style('width', '100%')
            .style('height', '100%');

        g = svg.append('g');

        // Función para proyectar coordenadas geográficas a píxeles
        function project(d) {
            const point = map.project(new mapboxgl.LngLat(d[0], d[1]));
            return [point.x, point.y];
        }

        // Dibujar el polígono de Benito Juárez
        g.append('path')
            .datum(benitoJuarez)
            .attr('d', d3.geoPath().projection(project))
            .attr('fill', '#cbd5e1')
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2);

        // Actualizar SVG cuando el mapa se mueve
        map.on('move', updateSVG);
        map.on('resize', updateSVG);

        function updateSVG() {
            g.selectAll('path').attr('d', d3.geoPath().projection(project));
            g.selectAll('circle')
                .attr('cx', d => project(d)[0])
                .attr('cy', d => project(d)[1]);
        }
    });
}

// Función para proyectar coordenadas geográficas a píxeles
function project(d) {
    if (!map) return [0, 0];
    const point = map.project(new mapboxgl.LngLat(d[0], d[1]));
    return [point.x, point.y];
}

// Esta función se activa en cada paso del scrollytelling
function handleStepEnter(response) {
    console.log(`Entrando en el paso: ${response.index}. Acción: ${response.direction}`);
    
    // Asegurarse de que el mapa esté cargado
    if (!map || !svg) return;
    
    switch (response.index) {
        case 0:
            // Paso 0: Estado inicial - limpiar todo y resetear mapa
            map.setStyle(streetStyle); // Asegurar estilo de calles
            map.flyTo({
                center: [-86.85, 21.05],
                zoom: 10,
                pitch: 0,
                bearing: 0,
                duration: 2000
            });
            
            // Limpiar todos los elementos D3
            if (g) {
                g.selectAll('*').transition().duration(500).style('opacity', 0).remove();
            }
            
            // Limpiar capas de Mapbox
            if (map.getLayer('nichupte-layer')) {
                map.removeLayer('nichupte-layer');
                map.removeSource('nichupte-source');
            }
            break;
        case 1:
            // Paso 1: Introducción al caso - mostrar imagen
            // La imagen se maneja en enhancedHandleStepEnter
            // Mantener el mapa en estado inicial y asegurar estilo correcto
            map.setStyle(streetStyle);
            map.flyTo({
                center: [-86.85, 21.05],
                zoom: 10,
                pitch: 0,
                bearing: 0,
                duration: 1500
            });
            // Limpiar elementos anteriores
            if (g) {
                g.selectAll("circle, .urban-sprawl, .urban-morph").transition().duration(500).style("opacity", 0).remove();
            }
            break;
        case 2:
            // Paso 2: Expansión de la Mancha Urbana con morphing fluido
            map.flyTo({
                center: [-86.85, 21.05],
                zoom: 10.5,
                pitch: 45, // Mayor pitch para efecto 3D
                bearing: 15,
                duration: 2000
            });
            
            // Limpiar elementos anteriores con transición
            g.selectAll(".urban-sprawl, .urban-morph")
                .transition()
                .duration(500)
                .style('opacity', 0)
                .remove();
            
            setTimeout(() => {
                const pathGenerator = d3.geoPath().projection(project);
                const morphFunction = createPolygonMorph(urbanGrowth['1990'], urbanGrowth['2020']);
                
                // Crear elemento para morphing progresivo
                g.append("path")
                    .datum(urbanGrowth['1990'])
                    .attr("class", "urban-morph")
                    .attr("d", pathGenerator)
                    .attr("fill", "#dc2626")
                    .attr("stroke", "#991b1b")
                    .attr("stroke-width", 2)
                    .attr("fill-opacity", 0)
                    .attr("stroke-opacity", 0)
                    .style('filter', 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.5))')
                    .transition()
                    .duration(1000)
                    .attr("fill-opacity", 0.3)
                    .attr("stroke-opacity", 0.8);
            }, 600);
            break;
        case 3:
            // Paso 3: Aumento de Vehículos
            map.flyTo({
                center: [-86.90, 21.05],
                zoom: 11.5,
                pitch: 45,
                bearing: 30,
                duration: 2000
            });
            g.selectAll(".urban-sprawl").transition().duration(500).style("opacity", 0.3);
            g.selectAll(".vehicle-point").remove();
            g.selectAll(".vehicle-point")
                .data(populationClusters.slice(3))
                .enter()
                .append("circle")
                .attr("class", "vehicle-point")
                .attr("cx", d => project(d)[0])
                .attr("cy", d => project(d)[1])
                .attr("r", 0)
                .attr("fill", "#22c55e")
                .transition()
                .delay((d, i) => i * 300)
                .duration(800)
                .attr("r", 10);
            break;
        case 4:
            // Paso 4: Dispersión poblacional y abandono del centro
            map.flyTo({
                center: [-86.85, 21.05],
                zoom: 11,
                pitch: 30,
                bearing: 0,
                duration: 2000
            });
            // Limpiar visualizaciones anteriores
            g.selectAll(".urban-sprawl").transition().duration(500).style("opacity", 0).remove();
            g.selectAll(".vehicle-point").transition().duration(500).remove();
            
            // Mostrar mapa de cambio poblacional por zonas
            const colorScale = d3.scaleLinear()
                .domain([-10, 0, 30])
                .range(["#ef4444", "#f8fafc", "#22c55e"]);
                
            // Simulamos datos de cambio poblacional
            const populationChangeData = [
                { center: [-86.82, 21.10], change: -12, radius: 15 }, // Centro
                { center: [-86.84, 21.12], change: -8, radius: 12 },  // Cerca del centro
                { center: [-86.86, 21.08], change: 5, radius: 10 },   // Intermedio
                { center: [-86.88, 21.06], change: 15, radius: 18 },  // Periferia cercana
                { center: [-86.90, 21.04], change: 25, radius: 20 },  // Periferia
                { center: [-86.92, 21.02], change: 30, radius: 22 }   // Periferia lejana
            ];
            
            g.selectAll(".population-change")
                .data(populationChangeData)
                .enter()
                .append("circle")
                .attr("class", "population-change")
                .attr("cx", d => {
                    const point = map.project(new mapboxgl.LngLat(d.center[0], d.center[1]));
                    return point.x;
                })
                .attr("cy", d => {
                    const point = map.project(new mapboxgl.LngLat(d.center[0], d.center[1]));
                    return point.y;
                })
                .attr("r", 0)
                .attr("fill", d => colorScale(d.change))
                .attr("stroke", "#334155")
                .attr("stroke-width", 1)
                .attr("opacity", 0.7)
                .transition()
                .duration(1000)
                .attr("r", d => d.radius);
                
            break;
            
        case 5:
            // Paso 5: Impacto ambiental con efectos 3D
            map.flyTo({
                center: [-86.80, 21.08],
                zoom: 11.5,
                pitch: 70, // Pitch más pronunciado para efecto 3D
                bearing: 25,
                duration: 2000
            });
            
            // Limpiar visualizaciones anteriores
            g.selectAll(".population-change").transition().duration(500).remove();
            
            // Mostrar la laguna de Nichupté con animación
            if (!map.getSource('nichupte-source')) {
                map.addSource('nichupte-source', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': nichupte
                    }
                });
                
                map.addLayer({
                    'id': 'nichupte-layer',
                    'type': 'fill',
                    'source': 'nichupte-source',
                    'layout': {},
                    'paint': {
                        'fill-color': '#0ea5e9',
                        'fill-opacity': 0
                    }
                });
                
                // Animar la aparición de la laguna
                setTimeout(() => {
                    map.setPaintProperty('nichupte-layer', 'fill-opacity', 0.8);
                }, 1000);
            }
            
            setTimeout(() => {
                create3DForestLossBars();
            }, 1500);
            break;
            
        case 6:
            // Paso 6: Desigualdad territorial con efectos de pulso
            map.flyTo({
                center: [-86.88, 21.06],
                zoom: 10.5,
                pitch: 60, // Mayor pitch para efecto 3D
                bearing: 0,
                duration: 2000
            });
            
            // Limpiar visualizaciones anteriores
            g.selectAll(".forest-loss-bar").transition().duration(500).remove();
            
            if (map.getLayer('nichupte-layer')) {
                map.removeLayer('nichupte-layer');
                map.removeSource('nichupte-source');
            }
            
            setTimeout(() => {
                createDensityVisualizationWithPulse();
            }, 1000);
            break;
            
        case 7:
            // Paso 7: Motorización acelerada con transición fluida
            map.flyTo({
                center: [-86.85, 21.05],
                zoom: 10,
                pitch: 0,
                bearing: 0,
                duration: 2000
            });
            
            // Transición fluida de elementos del mapa a gráfico
            const vehiclePoints = g.selectAll(".density-circle");
            if (!vehiclePoints.empty()) {
                setTimeout(() => {
                    const chartContainer = d3.select('#chart-container');
                    createMapToChartTransition(vehiclePoints, chartContainer, vehicleData);
                }, 1000);
            }
            
            // Limpiar etiquetas
            g.selectAll(".density-label").transition().duration(500).remove();
            break;
            
        case 8:
            // Paso 8: Consecuencias sociales y urbanas
            map.flyTo({
                center: [-86.85, 21.05],
                zoom: 11,
                pitch: 60,
                bearing: 30,
                duration: 2000
            });
            
            // Cambiar a estilo satelital para mostrar la realidad urbana
            map.setStyle(satelliteStyle);
            
            // Limpiar completamente visualizaciones anteriores
            if (g) {
                g.selectAll('.vehicle-bar, .vehicle-year-label, .density-circle, .density-label').transition().duration(500).remove();
            }
            
            break;
            
        case 9:
            // Paso 9: Sustainable Solutions (Estrategias de futuro)
            map.flyTo({
                center: [-86.82, 21.08],
                zoom: 12,
                pitch: 30,
                bearing: 0,
                duration: 2000
            });
            
            // Cambiar a estilo outdoors para representar un futuro más verde
            map.setStyle('mapbox://styles/mapbox/outdoors-v12');
            
            // Limpiar elementos restantes
            if (g) {
                g.selectAll('*').transition().duration(500).style('opacity', 0).remove();
            }
            
            break;
            
        case 10:
            // Paso 10: Looking ahead (Cierre / Call to action)
            map.flyTo({
                center: [-86.85, 21.05],
                zoom: 9.5,
                pitch: 0,
                bearing: 0,
                duration: 2000
            });
            
            // Volver al estilo de calles para una vista panorámica final
            map.setStyle(streetStyle);
            
            // Limpiar completamente todos los elementos
            if (g) {
                g.selectAll('*').remove();
            }
            
            break;
    }
}

// Inicializamos Scrollama y el mapa una vez que la página carga
// --- Multimedia y gráficos sintéticos ---
const multimediaSteps = {
    1: { // Introducción al caso - Digging in
        tipo: 'imagen',
        url: 'assets/img_1.png',
        layout: 'layout-right-panel'
    },
    2: { // Población en perspectiva
        tipo: 'grafico-barras',
        datos: [
            { categoria: '1970', valor: 6867, color: '#D4A373' },
            { categoria: '1980', valor: 30000, color: '#D4A373' },
            { categoria: '1990', valor: 167730, color: '#D4A373' },
            { categoria: '2000', valor: 397191, color: '#D4A373' },
            { categoria: '2010', valor: 628306, color: '#D4A373' },
            { categoria: '2020', valor: 911000, color: '#D4A373' }
        ],
        layout: 'layout-top-left'
    },
    3: { // Expansión urbana sin freno
        tipo: 'video',
        url: 'public/videos/1.mp4',
        layout: 'layout-left-panel'
    },
    7: { // Motorización acelerada
        tipo: 'grafico-barras',
        datos: [
            { categoria: '2010', valor: 186000, color: '#D4A373' },
            { categoria: '2015', valor: 300000, color: '#D4A373' },
            { categoria: '2020', valor: 400000, color: '#D4A373' },
            { categoria: '2023', valor: 452000, color: '#D4A373' }
        ]
    },
    8: { // Consecuencias sociales y urbanas
        tipo: 'grafico-poblacion-dinamico',
        poster: 'assets/img_1.png',
        loop: true,
        layout: 'layout-top-left'
    }
};

let populationData = [];



function limpiarVisuals() {
    document.getElementById('chart-container').style.opacity = 0;
    document.getElementById('image-container').style.opacity = 0;
    document.getElementById('video-container').style.opacity = 0;
    document.getElementById('mapa-container').style.opacity = 1;
    
    // Limpiar completamente el contenido de los contenedores
    const chartContainer = d3.select('#chart-container').select('svg');
    chartContainer.selectAll('*').remove();
    
    // Limpiar elementos D3 del mapa
    if (typeof g !== 'undefined' && g) {
        g.selectAll('.forest-loss-bar, .forest-year-label, .vehicle-bar, .vehicle-year-label').remove();
    }
}

function transicionarVisual(contenedor, mostrar = true, duracion = 1000) {
    const elemento = document.getElementById(contenedor);
    if (mostrar) {
        elemento.style.transition = `opacity ${duracion}ms ease-in-out, transform ${duracion}ms ease-in-out`;
        elemento.style.opacity = 1;
        elemento.style.transform = 'scale(1)';
    } else {
        elemento.style.transition = `opacity ${duracion}ms ease-in-out, transform ${duracion}ms ease-in-out`;
        elemento.style.opacity = 0;
        elemento.style.transform = 'scale(0.95)';
    }
}

// Función mejorada con patrón data().join() y transiciones fluidas
function dibujarGraficoBarras(datos) {
    // NO limpiar visuals para mantener el texto visible
    transicionarVisual('mapa-container', false);
    const chartContainer = document.getElementById('chart-container');
    transicionarVisual('chart-container', true);
    
    const svg = d3.select(chartContainer).select('svg');
    const width = chartContainer.offsetWidth;
    const height = chartContainer.offsetHeight;
    const margin = 60; // Mayor margen para mejor legibilidad
    const chartWidth = width - margin * 2;
    const chartHeight = height - margin * 2;
    
    const x = d3.scaleBand().domain(datos.map(d => d.categoria)).range([0, chartWidth]).padding(0.15);
    const y = d3.scaleLinear().domain([0, d3.max(datos, d => d.valor)]).range([chartHeight, 0]);
    
    // Limpiar solo el contenido del SVG, no todo
    svg.selectAll('g').remove();
    
    const g = svg.append('g').attr('transform', `translate(${margin},${margin})`);
    
    // Usar patrón data().join() optimizado
    const bars = g.selectAll('.bar')
        .data(datos, d => d.categoria)
        .join(
            enter => enter.append('rect')
                .attr('class', 'bar')
                .attr('x', d => x(d.categoria))
                .attr('y', chartHeight)
                .attr('width', x.bandwidth())
                .attr('height', 0)
                .attr('fill', d => d.color)
                .attr('stroke', '#8B5A2B')
                .attr('stroke-width', 1)
                .style('opacity', 0),
            update => update,
            exit => exit.transition().duration(300).style('opacity', 0).remove()
        );
    
    // Animación de entrada más suave
    bars.transition()
        .delay((d, i) => i * 150)
        .duration(1000)
        .ease(d3.easeBackOut.overshoot(1.2))
        .attr('y', d => y(d.valor))
        .attr('height', d => chartHeight - y(d.valor))
        .style('opacity', 0.9);
    
    // Ejes con mejor formato
    const xAxis = g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x))
        .style('font-size', '12px')
        .style('font-weight', 'bold');
        
    const yAxis = g.append('g')
        .call(d3.axisLeft(y).tickFormat(d3.format('.2s')))
        .style('font-size', '11px');
    
    // Etiquetas de valores en las barras
    g.selectAll('.value-label')
        .data(datos)
        .join('text')
        .attr('class', 'value-label')
        .attr('x', d => x(d.categoria) + x.bandwidth()/2)
        .attr('y', d => y(d.valor) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', '#2D1810')
        .style('opacity', 0)
        .text(d => d3.format('.2s')(d.valor))
        .transition()
        .delay((d, i) => i * 150 + 800)
        .duration(500)
        .style('opacity', 1);
}

// Función para crear visualización de densidad con efectos de pulso
function createDensityVisualizationWithPulse() {
    const densityScale = d3.scaleLinear()
        .domain([0, d3.max(densityDistricts, d => d.density)])
        .range([8, 35]);
        
    const densityColorScale = d3.scaleLinear()
        .domain([0, 50, 100])
        .range(["#fef3c7", "#fb923c", "#b91c1c"]);
    
    // Crear círculos principales con data().join()
    const circles = g.selectAll(".density-circle")
        .data(densityDistricts, d => d.id)
        .join(
            enter => enter.append("circle")
                .attr("class", "density-circle")
                .attr("cx", d => {
                    const point = map.project(new mapboxgl.LngLat(d.center[0], d.center[1]));
                    return point.x;
                })
                .attr("cy", d => {
                    const point = map.project(new mapboxgl.LngLat(d.center[0], d.center[1]));
                    return point.y;
                })
                .attr("r", 0)
                .attr("fill", d => densityColorScale(d.density))
                .attr("stroke", "#334155")
                .attr("stroke-width", 2)
                .style("opacity", 0),
            update => update,
            exit => exit.transition().duration(500).style("opacity", 0).remove()
        );
    
    // Animación de entrada con pulsos
    circles.transition()
        .delay((d, i) => i * 200)
        .duration(1000)
        .ease(d3.easeElasticOut)
        .attr("r", d => densityScale(d.density))
        .style("opacity", 0.8)
        .on("end", function(d) {
            // Crear efecto de pulso continuo para densidades altas
            if (d.density > 80) {
                createPulseEffect(d3.select(this), d);
            }
        });
    
    // Etiquetas con animación
    const labels = g.selectAll(".density-label")
        .data(densityDistricts, d => d.id)
        .join(
            enter => enter.append("text")
                .attr("class", "density-label")
                .attr("x", d => {
                    const point = map.project(new mapboxgl.LngLat(d.center[0], d.center[1]));
                    return point.x;
                })
                .attr("y", d => {
                    const point = map.project(new mapboxgl.LngLat(d.center[0], d.center[1]));
                    return point.y + 5;
                })
                .attr("text-anchor", "middle")
                .attr("fill", "#1e293b")
                .attr("font-size", "11px")
                .attr("font-weight", "bold")
                .style("text-shadow", "0 0 3px white")
                .style("opacity", 0)
                .text(d => d.density),
            update => update,
            exit => exit.transition().duration(300).style("opacity", 0).remove()
        );
    
    labels.transition()
        .delay((d, i) => i * 200 + 800)
        .duration(600)
        .style("opacity", 1);
}

// Función para crear efecto de pulso
function createPulseEffect(selection, data) {
    const pulseCircle = g.append("circle")
        .attr("cx", selection.attr("cx"))
        .attr("cy", selection.attr("cy"))
        .attr("r", selection.attr("r"))
        .attr("fill", "none")
        .attr("stroke", selection.attr("fill"))
        .attr("stroke-width", 3)
        .style("opacity", 0.8);
    
    function pulse() {
        pulseCircle
            .attr("r", selection.attr("r"))
            .style("opacity", 0.8)
            .transition()
            .duration(2000)
            .ease(d3.easeCircleOut)
            .attr("r", parseFloat(selection.attr("r")) * 2.5)
            .style("opacity", 0)
            .on("end", pulse);
    }
    
    pulse();
}

function showVideo(url) {
    limpiarVisuals();
    transicionarVisual('mapa-container', false);
    const videoContainer = document.getElementById('video-container');
    transicionarVisual('video-container', true);
    const video = videoContainer.querySelector('video');
    video.src = url;
    video.play();
}

// Función para crear barras 3D de pérdida forestal
function create3DForestLossBars() {
    const maxForestLoss = d3.max(forestLossData, d => d.area);
    const forestLossScale = d3.scaleLinear()
        .domain([0, maxForestLoss])
        .range([0, 120]); // Barras más altas para efecto 3D
        
    const barWidth = 35;
    const barSpacing = 20;
    const point = map.project(new mapboxgl.LngLat(-86.95, 21.10));
    const startX = point.x;
    const baseY = point.y;
    
    // Crear barras con efecto 3D usando gradientes
    const bars = g.selectAll(".forest-loss-bar")
        .data(forestLossData, d => d.year)
        .join(
            enter => enter.append("rect")
                .attr("class", "forest-loss-bar")
                .attr("x", (d, i) => startX + i * (barWidth + barSpacing))
                .attr("y", baseY)
                .attr("width", barWidth)
                .attr("height", 0)
                .attr("fill", "url(#forestGradient)")
                .attr("stroke", "#065f46")
                .attr("stroke-width", 2)
                .style("filter", "drop-shadow(3px 3px 6px rgba(0,0,0,0.3))")
                .style("opacity", 0),
            update => update,
            exit => exit.transition().duration(500).style("opacity", 0).remove()
        );
    
    // Crear gradiente para efecto 3D
    const defs = g.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "forestGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
    
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#22c55e")
        .attr("stop-opacity", 1);
    
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#15803d")
        .attr("stop-opacity", 1);
    
    // Animación de crecimiento con rebote
    bars.transition()
        .delay((d, i) => i * 300)
        .duration(1200)
        .ease(d3.easeElasticOut.amplitude(1).period(0.4))
        .attr("y", d => baseY - forestLossScale(d.area))
        .attr("height", d => forestLossScale(d.area))
        .style("opacity", 0.9);
    
    // Etiquetas de años con animación
    const labels = g.selectAll(".forest-year-label")
        .data(forestLossData, d => d.year)
        .join(
            enter => enter.append("text")
                .attr("class", "forest-year-label")
                .attr("x", (d, i) => startX + i * (barWidth + barSpacing) + barWidth/2)
                .attr("y", baseY + 20)
                .attr("text-anchor", "middle")
                .attr("fill", "#1e293b")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .style("opacity", 0)
                .text(d => d.year),
            update => update,
            exit => exit.transition().duration(300).style("opacity", 0).remove()
        );
    
    labels.transition()
        .delay((d, i) => i * 300 + 800)
        .duration(600)
        .style("opacity", 1);
}

function showImage(url) {
    limpiarVisuals();
    transicionarVisual('mapa-container', false);
    const imageContainer = document.getElementById('image-container');
    transicionarVisual('image-container', true);
    const img = imageContainer.querySelector('img');
    img.src = url;
    // Agregar efecto blur al fondo
    img.style.filter = 'blur(2px)';
    img.style.transform = 'scale(1.05)';
}

// ===== INTEGRACIÓN WMS Y WFS CON MAPBOX =====

// Configuración de servicios WMS
const wmsServices = {
    // Ejemplo con datos de INEGI México
    inegi: {
        url: 'https://gaia.inegi.org.mx/NLB/mdm6?',
        layers: 'conjunto_nacional',
        format: 'image/png',
        transparent: true,
        version: '1.1.1'
    },
    // Ejemplo con OpenStreetMap WMS
    osm: {
        url: 'https://ows.terrestris.de/osm/service?',
        layers: 'OSM-WMS',
        format: 'image/png',
        transparent: true,
        version: '1.1.1'
    },
    // Ejemplo con datos ambientales
    environmental: {
        url: 'https://nowcoast.noaa.gov/arcgis/services/nowcoast/mapoverlays_political/MapServer/WMSServer?',
        layers: '1',
        format: 'image/png',
        transparent: true,
        version: '1.3.0'
    }
};

// Configuración de servicios WFS
const wfsServices = {
    // Ejemplo con GeoServer local o remoto
    geoserver: {
        url: 'http://localhost:8080/geoserver/wfs',
        typeName: 'cancun:urban_growth',
        version: '2.0.0',
        outputFormat: 'application/json'
    },
    // Ejemplo con datos de INEGI
    inegiWFS: {
        url: 'https://gaia.inegi.org.mx/wfs/scince2020',
        typeName: 'scince:loc_urb_2020',
        version: '2.0.0',
        outputFormat: 'application/json'
    }
};

// Función para agregar capa WMS a Mapbox
function addWMSLayer(map, serviceKey, layerId = null) {
    const service = wmsServices[serviceKey];
    if (!service) {
        console.error(`Servicio WMS '${serviceKey}' no encontrado`);
        return;
    }
    
    const sourceId = layerId || `wms-${serviceKey}`;
    const layerIdFinal = `${sourceId}-layer`;
    
    // Construir URL del WMS
    const wmsUrl = `${service.url}SERVICE=WMS&VERSION=${service.version}&REQUEST=GetMap&LAYERS=${service.layers}&STYLES=&FORMAT=${service.format}&TRANSPARENT=${service.transparent}&HEIGHT=256&WIDTH=256&SRS=EPSG:3857&BBOX={bbox-epsg-3857}`;
    
    // Agregar fuente raster
    map.addSource(sourceId, {
        type: 'raster',
        tiles: [wmsUrl],
        tileSize: 256
    });
    
    // Agregar capa
    map.addLayer({
        id: layerIdFinal,
        type: 'raster',
        source: sourceId,
        paint: {
            'raster-opacity': 0.8
        }
    });
    
    console.log(`Capa WMS '${serviceKey}' agregada con ID: ${layerIdFinal}`);
    return layerIdFinal;
}

// Función para consumir datos WFS y convertirlos a GeoJSON
async function fetchWFSData(serviceKey, bbox = null, maxFeatures = 1000) {
    const service = wfsServices[serviceKey];
    if (!service) {
        console.error(`Servicio WFS '${serviceKey}' no encontrado`);
        return null;
    }
    
    try {
        // Construir parámetros WFS
        let wfsParams = new URLSearchParams({
            service: 'WFS',
            version: service.version,
            request: 'GetFeature',
            typeName: service.typeName,
            outputFormat: service.outputFormat,
            maxFeatures: maxFeatures
        });
        
        // Agregar bbox si se proporciona
        if (bbox) {
            wfsParams.append('bbox', `${bbox.join(',')},EPSG:4326`);
        }
        
        const url = `${service.url}?${wfsParams.toString()}`;
        console.log(`Consultando WFS: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Datos WFS obtenidos: ${data.features?.length || 0} features`);
        return data;
        
    } catch (error) {
        console.error(`Error al consultar WFS '${serviceKey}':`, error);
        return null;
    }
}

// Función para agregar datos WFS como capa vectorial en Mapbox
async function addWFSLayer(map, serviceKey, layerId = null, styleConfig = {}) {
    const data = await fetchWFSData(serviceKey);
    if (!data || !data.features) {
        console.error(`No se pudieron obtener datos WFS para '${serviceKey}'`);
        return;
    }
    
    const sourceId = layerId || `wfs-${serviceKey}`;
    const layerIdFinal = `${sourceId}-layer`;
    
    // Agregar fuente GeoJSON
    map.addSource(sourceId, {
        type: 'geojson',
        data: data
    });
    
    // Determinar tipo de geometría para el estilo
    const firstFeature = data.features[0];
    const geometryType = firstFeature?.geometry?.type;
    
    let layerConfig = {
        id: layerIdFinal,
        source: sourceId
    };
    
    // Configurar estilo según tipo de geometría
    switch (geometryType) {
        case 'Point':
        case 'MultiPoint':
            layerConfig.type = 'circle';
            layerConfig.paint = {
                'circle-radius': styleConfig.radius || 6,
                'circle-color': styleConfig.color || '#3b82f6',
                'circle-opacity': styleConfig.opacity || 0.8,
                'circle-stroke-width': styleConfig.strokeWidth || 1,
                'circle-stroke-color': styleConfig.strokeColor || '#ffffff'
            };
            break;
            
        case 'LineString':
        case 'MultiLineString':
            layerConfig.type = 'line';
            layerConfig.paint = {
                'line-color': styleConfig.color || '#ef4444',
                'line-width': styleConfig.width || 2,
                'line-opacity': styleConfig.opacity || 0.8
            };
            break;
            
        case 'Polygon':
        case 'MultiPolygon':
            // Agregar capa de relleno
            map.addLayer({
                id: `${layerIdFinal}-fill`,
                type: 'fill',
                source: sourceId,
                paint: {
                    'fill-color': styleConfig.fillColor || '#10b981',
                    'fill-opacity': styleConfig.fillOpacity || 0.3
                }
            });
            
            // Agregar capa de borde
            layerConfig.type = 'line';
            layerConfig.paint = {
                'line-color': styleConfig.strokeColor || '#059669',
                'line-width': styleConfig.strokeWidth || 2,
                'line-opacity': styleConfig.strokeOpacity || 0.8
            };
            break;
            
        default:
            console.warn(`Tipo de geometría no soportado: ${geometryType}`);
            return;
    }
    
    map.addLayer(layerConfig);
    console.log(`Capa WFS '${serviceKey}' agregada con ID: ${layerIdFinal}`);
    return layerIdFinal;
}

// Función para actualizar datos WFS en tiempo real
async function updateWFSLayer(map, sourceId, serviceKey, bbox = null) {
    const data = await fetchWFSData(serviceKey, bbox);
    if (data && map.getSource(sourceId)) {
        map.getSource(sourceId).setData(data);
        console.log(`Datos WFS actualizados para: ${sourceId}`);
    }
}

// Función para agregar controles de capas WMS/WFS
function addLayerControls(map) {
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    controlsContainer.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: white;
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        padding: 10px;
        max-width: 200px;
        z-index: 1000;
    `;
    
    controlsContainer.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; font-size: 14px;">Capas Disponibles</div>
        
        <div style="margin-bottom: 8px;">
            <label style="display: flex; align-items: center; font-size: 12px;">
                <input type="checkbox" id="wms-inegi" style="margin-right: 5px;">
                INEGI (WMS)
            </label>
        </div>
        
        <div style="margin-bottom: 8px;">
            <label style="display: flex; align-items: center; font-size: 12px;">
                <input type="checkbox" id="wms-osm" style="margin-right: 5px;">
                OSM (WMS)
            </label>
        </div>
        
        <div style="margin-bottom: 8px;">
            <label style="display: flex; align-items: center; font-size: 12px;">
                <input type="checkbox" id="wfs-geoserver" style="margin-right: 5px;">
                Urban Growth (WFS)
            </label>
        </div>
        
        <div style="margin-bottom: 8px;">
            <label style="display: flex; align-items: center; font-size: 12px;">
                <input type="checkbox" id="wfs-inegi" style="margin-right: 5px;">
                INEGI Localidades (WFS)
            </label>
        </div>
    `;
    
    // Event listeners para los controles
    controlsContainer.addEventListener('change', (e) => {
        const checkbox = e.target;
        const [type, service] = checkbox.id.split('-');
        
        if (checkbox.checked) {
            if (type === 'wms') {
                addWMSLayer(map, service);
            } else if (type === 'wfs') {
                addWFSLayer(map, service);
            }
        } else {
            // Remover capa
            const layerId = `${type}-${service}-layer`;
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
            if (map.getLayer(`${layerId}-fill`)) {
                map.removeLayer(`${layerId}-fill`);
            }
            if (map.getSource(`${type}-${service}`)) {
                map.removeSource(`${type}-${service}`);
            }
        }
    });
    
    document.body.appendChild(controlsContainer);
    return controlsContainer;
}

// Ejemplo de uso específico para Cancún
function loadCancunLayers(map) {
    // Cargar datos específicos de Cancún al cargar el mapa
    map.on('load', () => {
        // Ejemplo: Agregar capa WMS de INEGI para contexto
        // addWMSLayer(map, 'inegi', 'cancun-context');
        
        // Ejemplo: Cargar datos WFS de crecimiento urbano
        // addWFSLayer(map, 'geoserver', 'urban-growth', {
        //     fillColor: '#ef4444',
        //     fillOpacity: 0.4,
        //     strokeColor: '#dc2626',
        //     strokeWidth: 2
        // });
        
        // Agregar controles de capas
        addLayerControls(map);
    });
}

// Sistema avanzado de transiciones fluidas
function createMapToChartTransition(mapElements, chartContainer, chartData) {
    const elements = mapElements.nodes();
    const chartBars = chartContainer.selectAll('.bar').data(chartData);
    
    // Fase 1: Recoger elementos del mapa
    mapElements.transition()
        .duration(800)
        .ease(d3.easeBackIn)
        .attr('r', 3)
        .style('opacity', 0.3)
        .on('end', function(d, i) {
            if (i === elements.length - 1) {
                // Fase 2: Transformar en barras
                setTimeout(() => {
                    dibujarGraficoBarrasAnimado(chartData, chartContainer);
                }, 200);
            }
        });
}

function dibujarGraficoBarrasAnimado(datos, container) {
    const svg = container.select('svg');
    const width = container.node().offsetWidth;
    const height = container.node().offsetHeight;
    const margin = 40;
    const chartWidth = width - margin * 2;
    const chartHeight = height - margin * 2;
    
    const x = d3.scaleBand().domain(datos.map(d => d.categoria)).range([0, chartWidth]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(datos, d => d.valor)]).range([chartHeight, 0]);
    
    const g = svg.append('g').attr('transform', `translate(${margin},${margin})`);
    
    // Barras aparecen desde el centro con efecto de explosión
    g.selectAll('.bar')
        .data(datos)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.categoria) + x.bandwidth()/2)
        .attr('y', chartHeight/2)
        .attr('width', 0)
        .attr('height', 0)
        .attr('fill', d => d.color)
        .transition()
        .delay((d, i) => i * 150)
        .duration(800)
        .ease(d3.easeElasticOut)
        .attr('x', d => x(d.categoria))
        .attr('y', d => y(d.valor))
        .attr('width', x.bandwidth())
        .attr('height', d => chartHeight - y(d.valor));
}

// Función mejorada para manejar transiciones progresivas
function handleStepProgress(response) {
    const progress = response.progress || 0;
    const config = multimediaSteps[response.index];
    
    // Manejo específico por paso para animaciones granulares
    switch(response.index) {
        case 2: // Expansión urbana progresiva
            if (g && g.select('.urban-morph').node()) {
                const morphFunction = createPolygonMorph(urbanGrowth['1990'], urbanGrowth['2020']);
                const pathGenerator = d3.geoPath().projection(project);
                const interpolatedGeometry = morphFunction(progress);
                
                g.select('.urban-morph')
                    .datum(interpolatedGeometry)
                    .attr('d', pathGenerator)
                    .attr('fill-opacity', 0.3 + (progress * 0.4));
            }
            break;
            
        case 6: // Densidad con pulsos progresivos
            if (g && progress > 0.3) {
                const pulseIntensity = (progress - 0.3) / 0.7;
                g.selectAll('.density-circle')
                    .style('filter', `drop-shadow(0 0 ${pulseIntensity * 10}px rgba(255,0,0,0.6))`);
            }
            break;
        case 8:
            if (response.index === 9 && populationData.length > 0) {
            const yearIndex = Math.floor(response.progress * (populationData.length - 1));
            const currentYearIndex = Math.max(0, Math.min(yearIndex, populationData.length - 1));
            dibujarGraficoPoblacion(populationData[currentYearIndex]);
            break;
}
    }
    
    // Efectos generales de multimedia
    if (config) {
        const elemento = document.getElementById(
            config.tipo === 'grafico-barras' ? 'chart-container' :
            config.tipo === 'video' ? 'video-container' :
            config.tipo === 'imagen' ? 'image-container' : 'mapa-container'
        );
        
        if (elemento) {
            const scale = 0.85 + (progress * 0.15);
            const opacity = Math.max(0, Math.min(1, progress * 1.8));
            const blur = config.tipo === 'imagen' ? Math.max(0, 6 - (progress * 4)) : 0;
            
            elemento.style.transform = `scale(${scale}) translateZ(0)`;
            elemento.style.opacity = opacity;
            
            if (config.tipo === 'imagen') {
                const img = elemento.querySelector('img');
                if (img) {
                    img.style.filter = `blur(${blur}px) brightness(${0.7 + progress * 0.3})`;
                }
            }
        }
    }
}

// --- Modifica handleStepEnter para mostrar multimedia ---
const originalHandleStepEnter = handleStepEnter;
function enhancedHandleStepEnter(response) {
    // Primero ejecuta la lógica original
    originalHandleStepEnter(response);

    const stepElement = response.element;
    const stepIndex = response.index;
    const config = multimediaSteps[stepIndex];

    // Limpiar clases de layout anteriores
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('layout-fullscreen', 'layout-overlay', 'layout-side-text');
    });

    if (!config) {
        limpiarVisuals();
        transicionarVisual('mapa-container', true);
        return;
    }

    // Aplicar la nueva clase de layout
    if (config.layout && config.layout !== 'default') {
        stepElement.classList.add(config.layout);
    }

    // Lógica para ocultar la nota sticky cuando hay multimedia
    document.querySelectorAll('.step').forEach(el => el.classList.remove('is-out'));
    const configStep = multimediaSteps[response.index];
    if (!configStep) {
        limpiarVisuals();
        transicionarVisual('mapa-container', true);
        return;
    }
    
    if (response.index !== 7 && response.index !== 8 && response.index !== 1 && response.index !== 3 && response.index !== 2) {
        const currentStep = response.element;
        currentStep.classList.add('is-out');
    }
    if (response.index === 8) {
        limpiarVisuals();
        transicionarVisual('mapa-container', true);
        chartInitialized = false;
        return;
    }
    if (response.index === 9) {
        limpiarVisuals();
        // Oculta el mapa y muestra solo la gráfica
        document.getElementById('mapa-container').style.opacity = 0;
        transicionarVisual('chart-container', true);
        if (populationData.length > 0) {
            dibujarGraficoPoblacion(populationData[0]);
        }
        return;
    }

    
    // Aplicar transiciones suaves con mejor timing
    setTimeout(() => {
        switch (configStep.tipo) {
            case 'grafico-barras':
                dibujarGraficoBarras(configStep.datos);
                break;
            case 'grafico-barras-csv':
                dibujarGraficoBarrasCSV(configStep.datos, response.index);
                break;
            case 'video':
                showVideo(configStep.url);
                break;
            case 'imagen':
                showImage(configStep.url);
                break;
            default:
                limpiarVisuals();
                transicionarVisual('mapa-container', true);
        }
    }, 300); // Timing optimizado para transiciones más fluidas
// Nueva función para dibujar gráfico de barras desde CSV
function dibujarGraficoBarrasCSV(csvPath) {
function dibujarGraficoBarrasCSV(csvPath, stepIndex) {
    transicionarVisual('mapa-container', false);
    const chartContainer = document.getElementById('chart-container');
    transicionarVisual('chart-container', true);
    const svg = d3.select(chartContainer).select('svg');
    const width = chartContainer.offsetWidth;
    const height = chartContainer.offsetHeight;
    const margin = 60;
    const chartWidth = width - margin * 2;
    const chartHeight = height - margin * 2;

    d3.csv(csvPath).then(data => {
        // Filtrar años válidos y convertir valores numéricos
        const years = data.map(d => d['Año']).filter(y => y && !isNaN(parseInt(y)));
        const series = [
            { key: 'Poblacion México', color: '#3b82f6' },
            { key: 'Poblacion Mundo', color: '#6366f1' },
            { key: 'Población Benito Juárez', color: '#dc2626' },
            { key: 'Población Resto de Quintana Roo', color: '#f59e42' },
            { key: 'Población Todo de Quintana Roo', color: '#16a34a' }
        ];

        // Determinar el año a mostrar según el paso
        // El primer paso de gráfica CSV es el index donde está multimediaSteps[8]
        // Los siguientes años corresponden a los siguientes pasos
        const firstStepIndex = 8;
        const yearIdx = stepIndex - firstStepIndex;
        const year = years[yearIdx] || years[0];
        const yearData = data.find(d => d['Año'] === year);

        // Limpiar SVG
        svg.selectAll('*').remove();
        const g = svg.append('g').attr('transform', `translate(${margin},${margin})`);

        // Preparar datos para las barras, solo columnas con datos
        const barData = series.map(s => {
            let valor = yearData[s.key];
            if (valor && valor.trim() !== '') {
                valor = parseInt(valor.replace(/\./g, '').replace(/,/g, ''));
                return {
                    key: s.key,
                    valor: valor,
                    color: s.color
                };
            }
            return null;
        }).filter(d => d !== null);

        // Eje X: nombres de columna
        const x = d3.scaleBand().domain(barData.map(d => d.key)).range([0, chartWidth]).padding(0.15);
        // Eje Y
        const y = d3.scaleLinear().domain([0, d3.max(barData, d => d.valor)]).range([chartHeight, 0]);

        // Dibujar barras
        g.selectAll('.bar')
            .data(barData)
            .join('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.key))
            .attr('y', chartHeight)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', d => d.color)
            .attr('stroke', '#334155')
            .attr('stroke-width', 1)
            .style('opacity', 0)
            .transition()
            .duration(900)
            .attr('y', d => y(d.valor))
            .attr('height', d => chartHeight - y(d.valor))
            .style('opacity', 0.9);

        // Eje X con nombres de columna
        g.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x).tickFormat(d => d))
            .style('font-size', '13px')
            .style('font-weight', 'bold');

        // Eje Y
        g.append('g')
            .call(d3.axisLeft(y).tickFormat(d3.format('.2s')))
            .style('font-size', '11px');

        // Título del año
        svg.append('text')
            .attr('x', width/2)
            .attr('y', margin/2)
            .attr('text-anchor', 'middle')
            .style('font-size', '22px')
            .style('font-weight', 'bold')
            .style('fill', '#334155')
            .text(`Año: ${year}`);
    });
}
}
    const configPop = multimediaSteps[response.index];
    if (configPop && configPop.tipo === 'grafico-poblacion-dinamico') {
        limpiarVisuals();
        transicionarVisual('chart-container', true);
        
        // Dibuja el primer año de la gráfica
        if (populationData.length > 0) {
            dibujarGraficoPoblacion(populationData[0]);
        }
    } else {
         chartInitialized = false; // Resetea el estado si no es la gráfica
    }
}

let chartInitialized = false; // Controla si el SVG de la gráfica ya fue creado

function dibujarGraficoPoblacion(yearData) {
    if (!yearData) return;

    // --- 1. Preparación del contenedor y escalas ---
    const chartContainer = d3.select('#chart-container');
    const svg = chartContainer.select('svg');
    const width = chartContainer.node().offsetWidth;
    const height = chartContainer.node().offsetHeight;
    const margin = { top: 80, right: 40, bottom: 80, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Filtra las columnas que no sean 'Año' y que tengan valor en el año actual
    const categories = Object.keys(yearData).filter(key => key !== 'Año' && yearData[key] !== null);
    const values = categories.map(cat => yearData[cat]);

    // Limpiamos el SVG si es la primera vez o si cambiamos de visualización
    if (!chartInitialized) {
        svg.selectAll('*').remove();
    }

    const g = svg.selectAll('.chart-group').data([null]);
    const gEnter = g.enter().append('g').attr('class', 'chart-group');
    gEnter.merge(g).attr('transform', `translate(${margin.left},${margin.top})`);
    
    // --- 2. Definición de Ejes y Escalas ---
    const x = d3.scaleBand()
        .domain(categories)
        .range([0, chartWidth])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(populationData.flatMap(d => Object.values(d).slice(1)))]) // Dominio máximo de todos los años
        .range([chartHeight, 0]);

    // --- 3. Dibujar/Actualizar Ejes ---
    gEnter.append('g').attr('class', 'x-axis');
    g.select('.x-axis')
        .attr('transform', `translate(0,${chartHeight})`)
        .transition().duration(200)
        .call(d3.axisBottom(x));

    gEnter.append('g').attr('class', 'y-axis');
    g.select('.y-axis')
        .transition().duration(200)
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.2s')));

    // --- 4. Dibujar/Actualizar Barras (la magia está aquí) ---
    const bars = g.select('.chart-group').selectAll('.bar')
        .data(categories, d => d); // Usar la categoría como key

    bars.exit()
        .transition().duration(200)
        .attr('height', 0)
        .attr('y', chartHeight)
        .remove();

    bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d))
        .attr('width', x.bandwidth())
        .attr('y', chartHeight)
        .attr('height', 0)
        .attr('fill', '#2563eb')
        .merge(bars) // Une las barras nuevas y existentes para la transición
        .transition().duration(350)
        .attr('x', d => x(d))
        .attr('width', x.bandwidth())
        .attr('y', d => y(yearData[d]))
        .attr('height', d => chartHeight - y(yearData[d]));

    // --- 5. Título del Año ---
    const yearLabel = svg.selectAll('.year-label').data([null]);
    yearLabel.enter()
        .append('text')
        .attr('class', 'year-label')
        .attr('x', width / 2)
        .attr('y', margin.top / 2 + 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '28px')
        .attr('font-weight', 'bold')
        .attr('fill', '#334155')
        .merge(yearLabel)
        .text(`Año: ${yearData.Año}`);
        
    chartInitialized = true;
}

window.addEventListener('load', () => {
    const scroller = scrollama(); // 1. Define scroller aquí

    d3.csv('public/data/Población - Valores.csv').then(data => {
        // Limpiamos y convertimos los datos (esto ya lo tenías bien)
        data.forEach(d => {
            for (let key in d) {
                if (key !== 'Año') {
                    const value = d[key].replace(/\./g, '').replace(/,/g, '');
                    d[key] = value ? +value : null;
                } else {
                    d[key] = +d[key];
                }
            }
        });
        populationData = data;

        // 2. AÑADE EL CÁLCULO DE LA ESCALA MÁXIMA AQUÍ
        maxPopulationValue = d3.max(populationData, d => {
            return d3.max(Object.keys(d), key => {
                if (key !== 'Año' && key !== 'Poblacion Mundo' && key !== 'Poblacion México') {
                    return d[key];
                }
                return 0;
            });
        });
        console.log("Datos cargados. Valor máximo local:", maxPopulationValue);

        // 3. MUEVE LA INICIALIZACIÓN AQUÍ DENTRO
        setupMap();
        
        scroller.setup({
            step: ".step",
            offset: 0.5,
            progress: true
        })
        .onStepEnter(enhancedHandleStepEnter) // 4. Llamada simplificada
        .onStepProgress(handleStepProgress)
        .onStepExit(response => {
            console.log(`Saliendo del paso: ${response.index}. Acción: ${response.direction}`);
            
            // Tu lógica de onStepExit está bien, la mantenemos
            switch(response.index) {
                case 8:
                    chartInitialized = false; // Importante para redibujar si se vuelve a entrar
                    if (response.direction === 'up') {
                        map.setStyle(streetStyle);
                    }
                    break;
                // ... (otros cases que tenías)
            }
            
            const config = multimediaSteps[response.index];
            if (config) {
                const contenedorId = {
                    'grafico-barras': 'chart-container',
                    'video': 'video-container',
                    'imagen': 'image-container',
                    'grafico-poblacion-dinamico': 'chart-container'
                }[config.tipo] || 'mapa-container';
                transicionarVisual(contenedorId, false, 300);
            }
        });

    }).catch(error => {
        console.error("Error al cargar o procesar el archivo CSV:", error);
    });

    window.addEventListener('resize', () => scroller.resize());
});

