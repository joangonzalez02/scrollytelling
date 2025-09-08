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

// Datos simulados de crecimiento urbano por décadas
const urbanGrowth = {
    '1970': { type: "Polygon", coordinates: [[[-86.82, 21.11], [-86.81, 21.10], [-86.82, 21.09], [-86.83, 21.10], [-86.82, 21.11]]] },
    '1990': { type: "Polygon", coordinates: [[[-86.83, 21.12], [-86.80, 21.11], [-86.81, 21.10], [-86.82, 21.10], [-86.83, 21.12]]] },
    '2000': { type: "Polygon", coordinates: [[[-86.83, 21.12], [-86.78, 21.13], [-86.75, 21.10], [-86.80, 21.05], [-86.85, 21.07], [-86.83, 21.12]]] },
    '2010': { type: "Polygon", coordinates: [[[-86.83, 21.12], [-86.77, 21.14], [-86.72, 21.08], [-86.80, 21.02], [-86.90, 21.04], [-86.83, 21.12]]] },
    '2020': { type: "Polygon", coordinates: [[[-86.83, 21.12], [-86.75, 21.15], [-86.70, 21.05], [-86.85, 20.98], [-86.95, 21.05], [-86.83, 21.12]]] }
};

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
        interactive: true
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
            // Paso 0: Estado inicial
            map.flyTo({
                center: [-86.85, 21.05],
                zoom: 10,
                pitch: 0,
                bearing: 0,
                duration: 2000
            });
            g.selectAll("circle").transition().duration(500).remove();
            g.selectAll(".urban-sprawl").transition().duration(500).style("opacity", 0).remove();
            break;
        case 1:
            // Paso 1: Crecimiento Poblacional
            map.flyTo({
                center: [-86.85, 21.05],
                zoom: 11,
                duration: 1500
            });
            g.selectAll("circle").remove();
            g.selectAll("circle")
                .data(populationClusters)
                .enter()
                .append("circle")
                .attr("cx", d => project(d)[0])
                .attr("cy", d => project(d)[1])
                .attr("r", 0)
                .attr("fill", "#2563eb")
                .attr("opacity", 0.8)
                .transition()
                .duration(1000)
                .attr("r", 15);
            break;
        case 2:
            // Paso 2: Expansión de la Mancha Urbana
            map.flyTo({
                center: [-86.85, 21.05],
                zoom: 10.5,
                pitch: 30,
                bearing: 15,
                duration: 2000
            });
            g.selectAll(".urban-sprawl").remove();
            
            // Función para proyectar coordenadas en el path
            const pathProjection = d => d3.geoPath().projection(project)(d);
            
            g.append("path")
                .datum(urbanGrowth['1990'])
                .attr("class", "urban-sprawl")
                .attr("d", pathProjection)
                .attr("fill", "#dc2626")
                .attr("opacity", 0.5)
                .transition()
                .duration(2000)
                .ease(d3.easeCubic)
                .attrTween("d", function() {
                    const initialPath = pathProjection(urbanGrowth['1990']);
                    const finalPath = pathProjection(urbanGrowth['2020']);
                    const interpolate = d3.interpolateString(initialPath, finalPath);
                    return t => interpolate(t);
                });
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
            // Paso 5: Impacto ambiental
            map.flyTo({
                center: [-86.80, 21.08],
                zoom: 11.5,
                pitch: 45,
                bearing: 15,
                duration: 2000
            });
            
            // Limpiar visualizaciones anteriores
            g.selectAll(".population-change").transition().duration(500).remove();
            
            // Mostrar la laguna de Nichupté
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
                        'fill-opacity': 0.8
                    }
                });
            }
            
            // Mostrar gráfico de pérdida de vegetación
            const maxForestLoss = d3.max(forestLossData, d => d.area);
            const forestLossScale = d3.scaleLinear()
                .domain([0, maxForestLoss])
                .range([0, 80]);
                
            const barWidth = 30;
            const barSpacing = 15;
            const point = map.project(new mapboxgl.LngLat(-86.95, 21.10));
            const startX = point.x;
            const baseY = point.y;
            
            g.selectAll(".forest-loss-bar")
                .data(forestLossData)
                .enter()
                .append("rect")
                .attr("class", "forest-loss-bar")
                .attr("x", (d, i) => startX + i * (barWidth + barSpacing))
                .attr("y", d => baseY - forestLossScale(d.area))
                .attr("width", barWidth)
                .attr("height", d => forestLossScale(d.area))
                .attr("fill", "#16a34a")
                .attr("opacity", 0)
                .transition()
                .delay((d, i) => i * 200)
                .duration(800)
                .attr("opacity", 0.8);
                
            break;
            
        case 6:
            // Paso 6: Desigualdad territorial
            map.flyTo({
                center: [-86.88, 21.06],
                zoom: 10.5,
                pitch: 30,
                bearing: 0,
                duration: 2000
            });
            
            // Limpiar visualizaciones anteriores
            g.selectAll(".forest-loss-bar").transition().duration(500).remove();
            
            if (map.getLayer('nichupte-layer')) {
                map.removeLayer('nichupte-layer');
                map.removeSource('nichupte-source');
            }
            
            // Mostrar densidad por distritos
            const densityScale = d3.scaleLinear()
                .domain([0, d3.max(densityDistricts, d => d.density)])
                .range([5, 30]);
                
            const densityColorScale = d3.scaleLinear()
                .domain([0, 50, 100])
                .range(["#fef3c7", "#fb923c", "#b91c1c"]);
                
            g.selectAll(".density-circle")
                .data(densityDistricts)
                .enter()
                .append("circle")
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
                .attr("stroke-width", 1)
                .attr("opacity", 0.8)
                .transition()
                .delay((d, i) => i * 150)
                .duration(1000)
                .attr("r", d => densityScale(d.density));
                
            // Añadir etiquetas de densidad
            g.selectAll(".density-label")
                .data(densityDistricts)
                .enter()
                .append("text")
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
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .attr("opacity", 0)
                .text(d => d.density)
                .transition()
                .delay((d, i) => i * 150 + 500)
                .duration(500)
                .attr("opacity", 1);
                
            break;
            
        case 7:
            // Paso 7: Motorización acelerada
            map.flyTo({
                center: [-86.85, 21.05],
                zoom: 10,
                pitch: 0,
                bearing: 0,
                duration: 2000
            });
            
            // Limpiar visualizaciones anteriores
            g.selectAll(".density-circle").transition().duration(500).remove();
            g.selectAll(".density-label").transition().duration(500).remove();
            
            // Mostrar gráfico de crecimiento vehicular
            const maxVehicles = d3.max(vehicleData, d => d.count);
            const vehicleScale = d3.scaleLinear()
                .domain([0, maxVehicles])
                .range([0, 100]);
                
            const vBarWidth = 40;
            const vBarSpacing = 20;
            const vPoint = map.project(new mapboxgl.LngLat(-86.95, 21.10));
            const vStartX = vPoint.x;
            const vBaseY = vPoint.y;
            
            g.selectAll(".vehicle-bar")
                .data(vehicleData)
                .enter()
                .append("rect")
                .attr("class", "vehicle-bar")
                .attr("x", (d, i) => vStartX + i * (vBarWidth + vBarSpacing))
                .attr("y", d => vBaseY - vehicleScale(d.count))
                .attr("width", vBarWidth)
                .attr("height", d => vehicleScale(d.count))
                .attr("fill", "#3b82f6")
                .attr("opacity", 0)
                .transition()
                .delay((d, i) => i * 300)
                .duration(1000)
                .attr("opacity", 0.8);
                
            // Añadir etiquetas de años
            g.selectAll(".vehicle-year-label")
                .data(vehicleData)
                .enter()
                .append("text")
                .attr("class", "vehicle-year-label")
                .attr("x", (d, i) => vStartX + i * (vBarWidth + vBarSpacing) + vBarWidth/2)
                .attr("y", vBaseY + 15)
                .attr("text-anchor", "middle")
                .attr("fill", "#1e293b")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .attr("opacity", 0)
                .text(d => d.year)
                .transition()
                .delay((d, i) => i * 300 + 500)
                .duration(500)
                .attr("opacity", 1);
                
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
            
            // Limpiar visualizaciones anteriores
            g.selectAll(".vehicle-bar").transition().duration(500).remove();
            g.selectAll(".vehicle-year-label").transition().duration(500).remove();
            
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
            
            break;
    }
}

// Inicializamos Scrollama y el mapa una vez que la página carga
// --- Multimedia y gráficos sintéticos ---
const multimediaSteps = {
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
}

function dibujarGraficoBarras(datos) {
        limpiarVisuals();
        document.getElementById('mapa-container').style.opacity = 0;
        const chartContainer = document.getElementById('chart-container');
        chartContainer.style.opacity = 1;
        const svg = d3.select(chartContainer).select('svg');
        svg.selectAll('*').remove();
        const width = chartContainer.offsetWidth;
        const height = chartContainer.offsetHeight;
        const margin = 40;
        const chartWidth = width - margin * 2;
        const chartHeight = height - margin * 2;
        const x = d3.scaleBand().domain(datos.map(d => d.categoria)).range([0, chartWidth]).padding(0.1);
        const y = d3.scaleLinear().domain([0, d3.max(datos, d => d.valor)]).range([chartHeight, 0]);
        const g = svg.append('g').attr('transform', `translate(${margin},${margin})`);
        g.selectAll('.bar')
            .data(datos)
            .join('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.categoria))
            .attr('y', chartHeight)
            .attr('width', x.bandwidth())
            .attr('fill', d => d.color)
            .transition()
            .duration(750)
            .attr('y', d => y(d.valor))
            .attr('height', d => chartHeight - y(d.valor));
        g.append('g').attr('transform', `translate(0,${chartHeight})`).call(d3.axisBottom(x));
        g.append('g').call(d3.axisLeft(y));
}

function showVideo(url) {
    limpiarVisuals();
    document.getElementById('mapa-container').style.opacity = 0;
    const videoContainer = document.getElementById('video-container');
    videoContainer.style.opacity = 1;
    const video = videoContainer.querySelector('video');
    video.src = url;
    video.play();
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
        document.getElementById('mapa-container').style.opacity = 1;
        return;
    }
    
    if (response.index !== 7 && response.index !== 8) {
        const currentStep = response.element;
        currentStep.classList.add('is-out');
    }
    switch (config.tipo) {
        case 'grafico-barras':
            dibujarGraficoBarras(config.datos);
            break;
        case 'video':
            showVideo(config.url);
            break;
        // Puedes agregar más tipos si lo necesitas
        default:
            limpiarVisuals();
            document.getElementById('mapa-container').style.opacity = 1;
    }
}

// Reemplaza el evento de Scrollama por la versión mejorada
window.addEventListener('load', () => {
    setupMap();
    scroller.setup({
        step: ".step",
        offset: 0.5,
    })
    .onStepEnter(enhancedHandleStepEnter)
    .onStepExit(response => {
        console.log(`Saliendo del paso: ${response.index}. Acción: ${response.direction}`);
    });

    window.addEventListener('resize', scroller.resize);
});