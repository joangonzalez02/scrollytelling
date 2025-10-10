// Configuración para el gráfico de población de Cancún
document.addEventListener('DOMContentLoaded', function() {
    // Variables para almacenar datos y estado
    let populationData = [];
    let currentDataType = 'benito'; // benito, mexico, mundo, qroo
    let chart = null;
    
    // Función para cargar datos
    function loadData() {
        // Función para parsear números con puntos como separadores de miles
        function parseNumber(str) {
            if (!str || str.trim() === '') return null;
            // Remover todos los puntos (separadores de miles) y convertir a número
            const cleanStr = str.replace(/\./g, '');
            const num = +cleanStr;
            return isNaN(num) ? null : num;
        }
        
        // Evitar caché del navegador/CDN en GitHub Pages para ver cambios recientes
        // Usamos nombre de archivo sin acentos para máxima compatibilidad
        // Nota: d3.csv en v7 acepta como segundo argumento EITHER un row-mapper (function)
        // o las opciones de fetch (init). No usar 3 argumentos.
        // Evitar usar segundo argumento (init) para máxima compatibilidad en GitHub Pages
        d3.csv(`public/data/poblacion-valores.csv?v=${Date.now()}`)
            .then(function(csvData) {
                populationData = csvData.map(d => {
                    return {
                        year: +d.Año,
                        benitoJuarez: parseNumber(d['Población Benito Juárez']),
                        mexico: parseNumber(d['Poblacion México']),
                        mundo: parseNumber(d['Poblacion Mundo']),
                        qrooTotal: parseNumber(d['Población Todo de Quintana Roo']),
                        qrooResto: parseNumber(d['Población Resto de Quintana Roo'])
                    };
                }).filter(d => d.year && !isNaN(d.year) && d.year <= 2020);
                
                // Calcular crecimiento para cada conjunto de datos
                populationData.forEach((d, i) => {
                    // Inicializar valores de crecimiento a null
                    d.growthBenito = null;
                    d.growthMexico = null;
                    d.growthMundo = null;
                    d.growthQRooTotal = null;
                    
                    if (i > 0) {
                        // Benito Juárez
                        if (d.benitoJuarez !== null && populationData[i-1].benitoJuarez !== null) {
                            d.growthBenito = Number(((d.benitoJuarez - populationData[i-1].benitoJuarez) / populationData[i-1].benitoJuarez * 100).toFixed(1));
                        }
                        // México
                        if (d.mexico !== null && populationData[i-1].mexico !== null) {
                            d.growthMexico = Number(((d.mexico - populationData[i-1].mexico) / populationData[i-1].mexico * 100).toFixed(1));
                        }
                        // Mundo
                        if (d.mundo !== null && populationData[i-1].mundo !== null) {
                            d.growthMundo = Number(((d.mundo - populationData[i-1].mundo) / populationData[i-1].mundo * 100).toFixed(1));
                        }
                        // Quintana Roo Total
                        if (d.qrooTotal !== null && populationData[i-1].qrooTotal !== null) {
                            d.growthQRooTotal = Number(((d.qrooTotal - populationData[i-1].qrooTotal) / populationData[i-1].qrooTotal * 100).toFixed(1));
                        }
                    }
                    
                    // Para fines de depuración, imprimimos el crecimiento calculado para el primer elemento
                    if (i === 1) {
                        console.log('Ejemplo de crecimiento calculado para ' + d.year + ':', {
                            benito: d.growthBenito,
                            mexico: d.growthMexico,
                            mundo: d.growthMundo,
                            qroo: d.growthQRooTotal
                        });
                    }
                });
                
                console.log('Datos cargados:', populationData);
                console.log('Datos México disponibles:', populationData.filter(d => d.mexico !== null).length);
                console.log('Datos Mundo disponibles:', populationData.filter(d => d.mundo !== null).length);
                console.log('Datos Benito Juárez disponibles:', populationData.filter(d => d.benitoJuarez !== null).length);
                
                // Mostrar algunos valores de ejemplo para verificar el parsing
                const mexicoSample = populationData.filter(d => d.mexico !== null).slice(0, 3);
                const mundoSample = populationData.filter(d => d.mundo !== null).slice(0, 3);
                console.log('Muestra México:', mexicoSample);
                console.log('Muestra Mundo:', mundoSample);
                
                // Crear selector de datos
                createDataSelector();
                
                // Crear gráfico inicial
                createChart('benito');
            })
            .catch(function(error) {
                console.error("Error cargando los datos:", error);
            });
    }
    
    // Función para crear el selector de datos
    function createDataSelector() {
        const container = document.querySelector('#populationGrowthChart');
        if (!container) return;
        
        // Crear el contenedor del selector
        const selectorDiv = document.createElement('div');
        selectorDiv.className = 'data-selector';
        selectorDiv.style.marginBottom = '15px';
        selectorDiv.style.textAlign = 'center';
        
        // Opciones disponibles
        const options = [
            { value: 'benito', label: 'Benito Juárez' },
            { value: 'qroo', label: 'Quintana Roo' },
            { value: 'mexico', label: 'México' },
            { value: 'mundo', label: 'Mundo' }
        ];
        
        // Crear los botones de radio
        options.forEach(option => {
            const label = document.createElement('label');
            label.style.marginRight = '20px';
            label.style.cursor = 'pointer';
            label.style.fontWeight = option.value === 'benito' ? '700' : '600';
            label.style.color = option.value === 'benito' ? '#FB8500' : '#023047';
            label.style.transition = 'color 0.3s ease';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'population-data';
            radio.value = option.value;
            radio.checked = option.value === 'benito';
            radio.style.marginRight = '5px';
            radio.addEventListener('change', function() {
                if (this.checked) {
                    currentDataType = this.value;
                    updateChart(currentDataType);
                    
                    // Actualizar estilos de labels
                    const allLabels = selectorDiv.querySelectorAll('label');
                    allLabels.forEach(l => {
                        const r = l.querySelector('input');
                        l.style.color = r.checked ? '#FB8500' : '#023047';
                        l.style.fontWeight = r.checked ? '700' : '600';
                    });
                }
            });
            
            // Eventos hover
            label.addEventListener('mouseenter', function() {
                if (!radio.checked) this.style.color = '#219EBC';
            });
            
            label.addEventListener('mouseleave', function() {
                if (!radio.checked) this.style.color = '#023047';
            });
            
            label.appendChild(radio);
            label.appendChild(document.createTextNode(option.label));
            selectorDiv.appendChild(label);
        });
        
        // Agregar el selector antes del gráfico
        container.prepend(selectorDiv);
    }
    
    // Función para crear el gráfico
    function createChart(dataType) {
        // Limpiar el contenedor
        const container = document.querySelector('#populationGrowthChart');
        if (!container) return;
        
        // Eliminar SVG existente si hay
        d3.select('#populationGrowthChart svg').remove();
        
        // Configuración del gráfico - dimensiones base para el viewBox
        const baseWidth = 800;
        const baseHeight = 400;
        const margin = { top: 40, right: 60, bottom: 80, left: 100 };
        
        // Dimensiones internas del área de dibujo
        const width = baseWidth - margin.left - margin.right;
        const height = baseHeight - margin.top - margin.bottom;
        
        // Crear SVG responsive con viewBox
        const svg = d3.select('#populationGrowthChart')
            .append('svg')
            .attr('viewBox', `0 0 ${baseWidth} ${baseHeight}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '100%')
            .style('height', '100%')
            .style('max-width', '100%')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
            
        // Definir gradiente para las barras con ID único para evitar conflictos
        const gradientId = `bar-gradient-${dataType}-${Date.now()}`;
        
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', gradientId)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');
            
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', getColorByType(dataType, 'start'));
            
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', getColorByType(dataType, 'end'));
        
        // Obtener los datos según el tipo seleccionado
        const data = populationData.filter(d => {
            switch(dataType) {
                case 'benito': return d.benitoJuarez !== null && !isNaN(d.benitoJuarez);
                case 'mexico': return d.mexico !== null && !isNaN(d.mexico);
                case 'mundo': return d.mundo !== null && !isNaN(d.mundo);
                case 'qroo': return d.qrooTotal !== null && !isNaN(d.qrooTotal);
                default: return d.benitoJuarez !== null && !isNaN(d.benitoJuarez);
            }
        });
        
        console.log(`Datos filtrados para ${dataType}:`, data.length, 'registros');
        console.log('Primeros 3 registros:', data.slice(0, 3));
        
        // Función para obtener el valor según el tipo
        const getValue = (d) => {
            switch(dataType) {
                case 'benito': return d.benitoJuarez;
                case 'mexico': return d.mexico;
                case 'mundo': return d.mundo;
                case 'qroo': return d.qrooTotal;
                default: return d.benitoJuarez;
            }
        };
        
        // Función para obtener el crecimiento según el tipo
        const getGrowth = (d) => {
            switch(dataType) {
                case 'benito': return d.growthBenito;
                case 'mexico': return d.growthMexico;
                case 'mundo': return d.growthMundo;
                case 'qroo': return d.growthQRooTotal;
                default: return d.growthBenito;
            }
        };
        
        // Escalas
        const x = d3.scaleBand()
            .domain(data.map(d => d.year))
            .range([0, width])
            .padding(0.3);
            
        // Escalas ajustadas por tipo de datos para mejor visualización
        let yDomain;
        const maxValue = d3.max(data, d => getValue(d));
        
        if (dataType === 'mundo') {
            // Para datos mundiales (miles de millones), usar escala más suave
            yDomain = [0, maxValue * 1.05];
        } else if (dataType === 'mexico') {
            // Para datos de México (millones), usar escala moderada
            yDomain = [0, maxValue * 1.08];
        } else {
            // Para datos locales (Benito Juárez, Q.Roo), usar escala más dramática
            yDomain = [0, maxValue * 1.15];
        }
        
        const y = d3.scaleLinear()
            .domain(yDomain)
            .nice()
            .range([height, 0]);
            
        // Ejes
        svg.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickFormat(d => d.toString()))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .attr('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em');
            
        svg.append('g')
            .attr('class', 'axis y-axis')
            .call(d3.axisLeft(y)
                .tickFormat(d => {
                    if (dataType === 'mundo' && d > 1000000000) {
                        return d3.format('.1f')(d/1000000000);
                    } else if (d > 1000000) {
                        return d3.format('.1f')(d/1000000) + ' M';
                    } else if (d > 1000) {
                        return d3.format('.1f')(d/1000) + ' K';
                    } else {
                        return d3.format(',')(d);
                    }
                }));
            
        // Título
        svg.append('text')
            .attr('class', 'title')
            .attr('x', width / 2)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .attr('fill', '#023047')
            .attr('font-weight', 'bold')
            .attr('font-size', '16px')
            .text(getTitleByType(dataType));
            
        // Etiquetas de ejes
        svg.append('text')
            .attr('transform', `translate(${width/2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .attr('fill', '#023047')
            .text('Año');
            
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 15)
            .attr('x', -height / 2)
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .attr('fill', '#023047')
            .text('Población');
            
        // Función para formatear números mejorada
        const formatNumber = num => {
            if (dataType === 'mundo' && num >= 1000000000) {
                return `${(num/1000000000).toFixed(1)}`;
            } else if (dataType === 'mexico' && num >= 1000000) {
                return `${(num/1000000).toFixed(1)} millones`;
            } else if (num >= 1000000) {
                return `${(num/1000000).toFixed(2)} millones`;
            } else if (num >= 1000) {
                return `${(num/1000).toFixed(0)} mil`;
            } else {
                return new Intl.NumberFormat('es-MX').format(num);
            }
        };
        
        // Tooltip - Crear siempre uno nuevo para este gráfico específico
        // Eliminar tooltip existente si hay
        const existingTooltip = document.getElementById('population-chart-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
    // Crear un nuevo tooltip específico para este gráfico (mismo estilo que vehicle-chart)
    const tooltipDiv = document.createElement('div');
    tooltipDiv.id = 'population-chart-tooltip';
    tooltipDiv.className = 'vehicle-tooltip';
    tooltipDiv.style.position = 'fixed';
    tooltipDiv.style.padding = '12px 16px';
    tooltipDiv.style.background = 'rgba(2, 48, 71, 0.95)'; // Azul oscuro
    tooltipDiv.style.borderRadius = '8px';
    tooltipDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    tooltipDiv.style.pointerEvents = 'none';
    tooltipDiv.style.opacity = '0';
    tooltipDiv.style.zIndex = '99999';
    tooltipDiv.style.fontSize = '14px';
    tooltipDiv.style.fontWeight = '500';
    tooltipDiv.style.color = 'white';
    tooltipDiv.style.maxWidth = '220px';
    tooltipDiv.style.transition = 'opacity 0.2s ease';
        
        // Agregar el tooltip al body para que esté siempre visible
        document.body.appendChild(tooltipDiv);
        
        // Seleccionar el tooltip con d3
        const tooltip = d3.select('#population-chart-tooltip');
        
        console.log('Tooltip creado:', tooltip.node());
        
        // Crear barras con animación
        svg.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.year))
            .attr('width', x.bandwidth())
            .attr('y', height)
            .attr('height', 0)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('fill', `url(#${gradientId})`) // Aplicar el gradiente
            .on('mouseover', function(event, d) {
                // Destacar barra
                d3.select(this)
                    .transition()
                    .duration(300)
                    .attr('opacity', 0.9)
                    .attr('stroke-width', 2)
                    .style('fill', `url(#${gradientId})`); // Asegurarnos de aplicar el gradiente
                
                // Mostrar tooltip
                let tooltipContent = `
                    <div><strong>Año ${d.year}</strong></div>
                    <div>Población: <span style="color: #8ECAE6; font-weight:700">${formatNumber(getValue(d))}</span></div>
                `;
                
                // Añadir datos de crecimiento solo si están disponibles
                const growth = getGrowth(d);
                
                // Mostrar incremento solo cuando hay datos disponibles
                if (growth !== null && !isNaN(growth)) {
                    // Mostrar signo + solo para valores positivos, para negativos ya incluye el signo -
                    const signPrefix = growth > 0 ? '+' : '';
                    let color = '#e5e7eb'; // neutro (gris claro) para 0%
                    if (growth > 0) color = '#2ECC71'; // verde revertido
                    else if (growth < 0) color = '#E63946'; // rojo
                    tooltipContent += `
                        <div>Incremento: <span style="color:${color}; font-weight:700">${signPrefix}${growth}%</span></div>
                    `;
                }
                // Eliminamos la condición que mostraba "Sin datos"
                
                // Posición del tooltip
                const xPosition = event.clientX - 100;
                const yPosition = event.clientY - 110;
                
                // Mostrar tooltip
                tooltip
                    .html(tooltipContent)
                    .style('left', xPosition + 'px')
                    .style('top', yPosition + 'px')
                    .style('opacity', 1)
                    .style('display', 'block'); // Asegurarse de que sea visible
                
                console.log('Tooltip mostrado en:', xPosition, yPosition, 'Contenido:', tooltipContent);
            })
            .on('mouseout', function() {
                // Restaurar barra
                d3.select(this)
                    .transition()
                    .duration(300)
                    .attr('opacity', 1)
                    .attr('stroke-width', 1)
                    .style('fill', `url(#${gradientId})`);
                
                // Ocultar tooltip
                tooltip
                    .style('opacity', 0)
                    .style('display', 'none'); // Ocultar completamente
            })
            .on('mousemove', function(event) {
                // Mover tooltip con el cursor
                const xPosition = event.clientX - 100;
                const yPosition = event.clientY - 110;
                
                tooltip
                    .style('left', xPosition + 'px')
                    .style('top', yPosition + 'px');
            })
            .transition()
            .delay((d, i) => i * 150)
            .duration(1000)
            .attr('y', d => y(getValue(d)))
            .attr('height', d => height - y(getValue(d)))
            .ease(d3.easeBounceOut)
            // Asegurarnos que después de la animación también tenga el estilo correcto
            .style('fill', `url(#${gradientId})`);
        
        // Etiquetas de valores
        svg.selectAll('.value-label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'value-label')
            .attr('x', d => x(d.year) + x.bandwidth() / 2)
            .attr('y', height)
            .attr('opacity', 0)
            .text(d => {
                // Formato abreviado para valores grandes
                if (dataType === 'mundo' && getValue(d) > 1000000000) {
                    return `${(getValue(d)/1000000000).toFixed(1)}`;
                } else if (getValue(d) > 1000000) {
                    return `${(getValue(d)/1000000).toFixed(1)}M`;
                } else if (getValue(d) > 1000) {
                    return `${(getValue(d)/1000).toFixed(0)}K`;
                } else {
                    return getValue(d);
                }
            })
            .transition()
            .delay((d, i) => i * 150 + 700)
            .duration(700)
            .attr('y', d => y(getValue(d)) - 10)
            .attr('opacity', 1);
            
        // Si es Benito Juárez, agregar anotación destacando el crecimiento extraordinario
        if (dataType === 'benito' && width > 500) {
            const annotations = [{
                note: {
                    title: "Crecimiento Extraordinario",
                    label: "441.6% de incremento en los 70s",
                    wrap: 150
                },
                connector: {
                    end: "arrow",
                    type: "curve",
                    curvature: 0.5
                },
                x: x(1980) + x.bandwidth() / 2,
                y: y(37190) - 30,
                dy: -30,
                dx: -30
            }];
            
            const makeAnnotations = d3.annotation()
                .type(d3.annotationLabel)
                .annotations(annotations);
                
            svg.append('g')
                .attr('class', 'annotation-group')
                .attr('opacity', 0)
                .call(makeAnnotations)
                .transition()
                .delay(1500)
                .duration(800)
                .attr('opacity', 1);
        }
        
        chart = svg; // Guardar referencia al gráfico
    }
    
    // Función para actualizar el gráfico
    function updateChart(dataType) {
        createChart(dataType);
    }
    
    // Función para obtener colores según el tipo de datos - Paleta oficial del proyecto
    function getColorByType(type, position) {
        const colors = {
            'benito': { start: '#FB8500', end: '#FFB703' },    // Naranja principal
            'qroo': { start: '#219EBC', end: '#8ECAE6' },      // Azul medio a claro
            'mexico': { start: '#023047', end: '#219EBC' },    // Azul oscuro a medio
            'mundo': { start: '#8ECAE6', end: '#023047' }      // Azul claro a oscuro
        };
        
        return colors[type][position];
    }
    
    // Función para obtener el título según el tipo de datos
    function getTitleByType(type) {
        const titles = {
            'benito': 'Crecimiento Poblacional de Cancún (1970-2020)',
            'qroo': 'Crecimiento Poblacional de Quintana Roo (1970-2020)',
            'mexico': 'Crecimiento Poblacional de México (1910-2020) - en millones',
            'mundo': 'Crecimiento Poblacional Mundial (1910-2020) - en miles de millones'
        };
        
        return titles[type];
    }
    
    // Observar el contenedor del gráfico para inicializarlo cuando sea visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && populationData.length === 0) {
                loadData(); // Cargar datos solo la primera vez
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    // Observar el contenedor del gráfico
    const chartContainer = document.querySelector('#populationGrowthChart');
    if (chartContainer) {
        observer.observe(chartContainer);
    }
    
    // Ajustar el tamaño del gráfico cuando cambia el tamaño de la ventana
    window.addEventListener('resize', () => {
        if (populationData.length > 0) {
            createChart(currentDataType);
        }
    });
});