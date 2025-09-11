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
        url: 'assets/img_1.png'
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
        ]
    },
    3: { // Expansión urbana sin freno
        tipo: 'video',
        url: 'public/videos/1.mp4'
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
        tipo: 'video',
        url: 'public/videos/3.mp4'
    }
};

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

    // Lógica para ocultar la nota sticky cuando hay multimedia
    document.querySelectorAll('.step').forEach(el => el.classList.remove('is-out'));
    const config = multimediaSteps[response.index];
    if (!config) {
        limpiarVisuals();
        transicionarVisual('mapa-container', true);
        return;
    }
    
    if (response.index !== 7 && response.index !== 8 && response.index !== 1 && response.index !== 3 && response.index !== 2) {
        const currentStep = response.element;
        currentStep.classList.add('is-out');
    }
    
    // Aplicar transiciones suaves con mejor timing
    setTimeout(() => {
        switch (config.tipo) {
            case 'grafico-barras':
                dibujarGraficoBarras(config.datos);
                break;
            case 'video':
                showVideo(config.url);
                break;
            case 'imagen':
                showImage(config.url);
                break;
            default:
                limpiarVisuals();
                transicionarVisual('mapa-container', true);
        }
    }, 300); // Timing optimizado para transiciones más fluidas
}

// Reemplaza el evento de Scrollama por la versión mejorada
window.addEventListener('load', () => {
    setupMap();
    scroller.setup({
        step: ".step",
        offset: 0.5,
        progress: true // Habilitar seguimiento de progreso
    })
    .onStepEnter(enhancedHandleStepEnter)
    .onStepProgress(handleStepProgress) // Manejar progreso durante el scroll
    .onStepExit(response => {
        console.log(`Saliendo del paso: ${response.index}. Acción: ${response.direction}`);
        
        // Limpiar elementos específicos al salir de cada paso
        switch(response.index) {
            case 2: // Saliendo del paso de población
                // Asegurar que el gráfico se oculte completamente
                const chartContainer = d3.select('#chart-container').select('svg');
                chartContainer.selectAll('*').transition().duration(300).style('opacity', 0).remove();
                document.getElementById('chart-container').style.opacity = 0;
                break;
            case 5: // Saliendo del paso ambiental
                if (g) {
                    g.selectAll('.forest-loss-bar, .forest-year-label').transition().duration(300).remove();
                }
                break;
            case 7: // Saliendo del paso vehicular
                if (g) {
                    g.selectAll('.vehicle-bar, .vehicle-year-label').transition().duration(300).remove();
                }
                break;
            case 8: // Saliendo del paso satelital - resetear estilo
                if (response.direction === 'up') {
                    map.setStyle(streetStyle);
                }
                break;
        }
        
        // Transición suave al salir
        const config = multimediaSteps[response.index];
        if (config) {
            const contenedor = config.tipo === 'grafico-barras' ? 'chart-container' :
                             config.tipo === 'video' ? 'video-container' :
                             config.tipo === 'imagen' ? 'image-container' : 'mapa-container';
            transicionarVisual(contenedor, false, 300);
        }
    });

    window.addEventListener('resize', scroller.resize);
});