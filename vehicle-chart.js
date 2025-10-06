// Configuración para el gráfico del parque vehicular
document.addEventListener('DOMContentLoaded', function() {
    // Variables para almacenar datos y estado
    let vehicleData = [];
    let chart = null;

    // Datos de ejemplo del parque vehicular (2010-2023)
    const vehicleDataRaw = [
        { year: 2010, vehicles: 186000, vehiclesPerHousehold: 0.41 },
        { year: 2011, vehicles: 195000, vehiclesPerHousehold: 0.42 },
        { year: 2012, vehicles: 205000, vehiclesPerHousehold: 0.43 },
        { year: 2013, vehicles: 218000, vehiclesPerHousehold: 0.45 },
        { year: 2014, vehicles: 232000, vehiclesPerHousehold: 0.47 },
        { year: 2015, vehicles: 248000, vehiclesPerHousehold: 0.49 },
        { year: 2016, vehicles: 265000, vehiclesPerHousehold: 0.51 },
        { year: 2017, vehicles: 283000, vehiclesPerHousehold: 0.53 },
        { year: 2018, vehicles: 302000, vehiclesPerHousehold: 0.55 },
        { year: 2019, vehicles: 322000, vehiclesPerHousehold: 0.57 },
        { year: 2020, vehicles: 335000, vehiclesPerHousehold: 0.59 },
        { year: 2021, vehicles: 348000, vehiclesPerHousehold: 0.61 },
        { year: 2022, vehicles: 362000, vehiclesPerHousehold: 0.63 },
        { year: 2023, vehicles: 380000, vehiclesPerHousehold: 0.65 }
    ];

    // Función para cargar datos
    function loadData() {
        vehicleData = vehicleDataRaw.map(d => {
            return {
                year: d.year,
                vehicles: d.vehicles,
                vehiclesPerHousehold: d.vehiclesPerHousehold
            };
        });

        console.log('Datos de vehículos cargados:', vehicleData);
        createChart();
    }

    // Función para crear el gráfico
    function createChart() {
        const container = d3.select('#vehicleGrowthChart');
        if (container.empty()) return;

        // Limpiar contenedor
        container.html('');

        // Dimensiones base para el viewBox, ajustadas para mejor visualización
        const baseWidth = 1200; // Aumentado para mejor uso del espacio
        const baseHeight = 700; // Aumentado para mejor visualización
        const margin = { top: 60, right: 80, bottom: 60, left: 100 }; // Márgenes aumentados para evitar cortes
        
        // Dimensiones internas del área de dibujo
        const width = baseWidth - margin.left - margin.right;
        const height = baseHeight - margin.top - margin.bottom;

        // Crear SVG responsive con viewBox
        const svg = container.append('svg')
            .attr('viewBox', `0 0 ${baseWidth} ${baseHeight}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '100%')
            .style('height', '100%')
            .style('display', 'block')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Escalas
        const xScale = d3.scaleLinear()
            .domain(d3.extent(vehicleData, d => d.year))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(vehicleData, d => d.vehicles)])
            .range([height, 0]);

        // Ejes
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.format('d'));

        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d => `${(d / 1000).toFixed(0)}k`);

        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis)
            .selectAll('text')
            .style('font-size', `${Math.min(width * 0.015, 16)}px`)
            .style('fill', '#023047');

        svg.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll('text')
            .style('font-size', `${Math.min(width * 0.015, 16)}px`)
            .style('fill', '#023047');

        // Línea para vehículos
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.vehicles))
            .curve(d3.curveMonotoneX);

        svg.append('path')
            .datum(vehicleData)
            .attr('class', 'line vehicles-line')
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', '#FB8500')
            .attr('stroke-width', 3);

        // Puntos para vehículos
        svg.selectAll('.vehicle-point')
            .data(vehicleData)
            .enter()
            .append('circle')
            .attr('class', 'vehicle-point')
            .attr('cx', d => xScale(d.year))
            .attr('cy', d => yScale(d.vehicles))
            .attr('r', 5)
            .attr('fill', '#FB8500')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);

        // Título
        svg.append('text')
            .attr('class', 'title')
            .attr('x', width / 2)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .style('font-size', `${Math.min(width * 0.02, 24)}px`)
            .style('font-weight', 'bold')
            .style('fill', '#023047')
            .text('Crecimiento del Parque Vehicular en Cancún (2010-2023)');

        // Etiquetas de ejes
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('x', width / 2)
            .attr('y', height + 45)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#023047')
            .text('Año');

        svg.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -80)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#023047')
            .text('Número de Vehículos');

        // Tooltip
        const tooltip = d3.select('.tooltip');

        // Función para mostrar tooltip
        function showTooltip(d) {
            tooltip.style('opacity', 1)
                .html(`
                    <div><strong>Año:</strong> ${d.year}</div>
                    <div><strong>Vehículos:</strong> ${d.vehicles.toLocaleString()}</div>
                    <div><strong>Vehículos por hogar:</strong> ${d.vehiclesPerHousehold}</div>
                `)
                .style('left', (d3.event.pageX + 10) + 'px')
                .style('top', (d3.event.pageY - 10) + 'px');
        }

        // Función para ocultar tooltip
        function hideTooltip() {
            tooltip.style('opacity', 0);
        }

        // Agregar eventos a los puntos
        svg.selectAll('.vehicle-point')
            .on('mouseover', showTooltip)
            .on('mouseout', hideTooltip);

        // Información adicional
        const infoBox = svg.append('g')
            .attr('class', 'info-box')
            .attr('transform', `translate(${width - 150}, 0)`);

        infoBox.append('rect')
            .attr('width', 140)
            .attr('height', 60)
            .attr('fill', 'rgba(255, 255, 255, 0.9)')
            .attr('stroke', '#FB8500')
            .attr('stroke-width', 1)
            .attr('rx', 5);

        infoBox.append('text')
            .attr('x', 10)
            .attr('y', 20)
            .style('font-size', '11px')
            .style('fill', '#023047')
            .text('Crecimiento:');

        infoBox.append('text')
            .attr('x', 10)
            .attr('y', 35)
            .style('font-size', '11px')
            .style('fill', '#FB8500')
            .style('font-weight', 'bold')
            .text('+142% (2010-2023)');

        infoBox.append('text')
            .attr('x', 10)
            .attr('y', 50)
            .style('font-size', '10px')
            .style('fill', '#219EBC')
            .text('Vehículos por hogar: ↑67%');
    }

    // Inicializar cuando se llegue al step correspondiente
    function initializeVehicleChart() {
        const vehicleChartStep = document.querySelector('section[data-step="27"]');
        console.log('Buscando step 27:', vehicleChartStep);

        if (vehicleChartStep) {
            console.log('Step 27 encontrado, configurando observer');

            // Usar Scrollama para detectar cuando llegamos al step
            if (typeof scroller !== 'undefined' && scroller) {
                // Si Scrollama está disponible, usar sus eventos
                console.log('Usando Scrollama para inicializar gráfico de vehículos');
                // El gráfico se inicializará cuando Scrollama llegue al step 27
            } else {
                // Fallback con IntersectionObserver
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        console.log('IntersectionObserver - Step 27 visible:', entry.isIntersecting);
                        if (entry.isIntersecting && !chart) {
                            console.log('Inicializando gráfico de vehículos via IntersectionObserver');
                            loadData();
                            chart = true;
                        }
                    });
                }, { threshold: 0.5 });

                observer.observe(vehicleChartStep);
            }
        } else {
            console.error('No se encontró el step 27 para el gráfico de vehículos');
        }
    }

    // Función para inicializar manualmente (llamada desde el script principal)
    window.initVehicleChart = function() {
        if (!chart) {
            console.log('Inicializando gráfico de vehículos manualmente');
            loadData();
            chart = true;
        }
    };

    // Inicializar
    initializeVehicleChart();
});