// Gráfico combinado (barras + línea) con doble eje Y para Parque Vehicular
// - Barras: Vehículos totales (eje Y izquierdo)
// - Línea: Autos por vivienda (eje Y derecho)
// Datos desde: public/data/parque-vehicular.csv

document.addEventListener('DOMContentLoaded', function () {
    const TARGET_ID = 'vehicleGrowthChart';
    // Agregar parámetro de caché-busting para evitar datos obsoletos en GitHub Pages
    const DATA_URL = `public/data/parque-vehicular.csv?v=${Date.now()}`;

    // Alinear estilos del contenedor con el gráfico de población (reutilizar .chart-container)
    const container = document.getElementById(TARGET_ID);
    if (container && container.parentElement) {
        const parent = container.parentElement;
        // No cambiar clases ni forzar estilos; dejar que .chart-container controle el layout
        // Asegurar que el contenedor interno ocupe todo el tamaño disponible
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
    }

    const palette = {
        primary: '#219EBC', // Barras (vehículos)
        accent: '#FB8500',  // Línea (autos/vivienda)
        text: '#023047',
        grid: 'rgba(2,48,71,0.08)'
    };

    const state = {
        data: [],
        hasDrawn: false,
        hasLoaded: false,
        resizeObserver: null,
        refs: {
            g: null,
            bars: null,
            labels: null,
            path: null,
            points: null,
            overlay: null,
            dims: null,
            scales: null
        },
        tooltip: null
    };

    function normalizeKey(str) {
        return String(str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // quitar acentos
            .replace(/[^a-z0-9_]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function parseCsvRow(row) {
        // Soportar variaciones y mojibake en encabezados (e.g., "A??o")
        const originalKeys = Object.keys(row);
        const map = {};
        for (const k of originalKeys) {
            map[normalizeKey(k)] = row[k];
        }

        // Año: preferir claves conocidas; si no existen, usar el primer valor de la fila como fallback
        let year = +map['ano'] || +map['anio'] || +map['year'];
        if (!year) {
            // Fallback por posición (primera columna) ante mojibake tipo "A??o"
            const firstVal = row[originalKeys[0]];
            year = +firstVal;
        }

        // Vehículos totales: preferir claves conocidas; fallback por heurística o segunda columna
        let vehicles = +map['vehiculos_totales'] || +map['vehiculos'] || +map['total'];
        if (!vehicles) {
            // Buscar alguna clave que contenga 'vehicul' y no 'por_vivienda'
            const vehKey = Object.keys(map).find(k => k.includes('vehicul') && !k.includes('por_vivienda'));
            if (vehKey) {
                vehicles = +map[vehKey];
            } else if (originalKeys.length > 1) {
                // Fallback por posición: segunda columna
                vehicles = +row[originalKeys[1]];
            }
        }

        // Autos por vivienda (puede venir vacío)
        const vphRaw = map['vehiculos_por_vivienda'] || map['autos_por_vivienda'] || map['vph'];
        const vehiclesPerHousehold = vphRaw === undefined || vphRaw === '' ? null : +vphRaw;

        return { year, vehicles, vehiclesPerHousehold };
    }

    function getContainerDims() {
        // Usar viewBox fijo para responsividad, como population chart
        const el = document.getElementById(TARGET_ID);
        const containerRect = el ? el.getBoundingClientRect() : null;
        const containerWidth = containerRect ? containerRect.width : 1000;
        
        const baseWidth = 1000;  // Más ancho que antes para mejor aprovechamiento del espacio
        const baseHeight = 400;
        
        // Márgenes simétricos y responsivos
        let leftRightMargin;
        if (containerWidth <= 480) {
            leftRightMargin = 80;  // Móviles - márgenes más pequeños
        } else if (containerWidth <= 768) {
            leftRightMargin = 100; // Tablets - márgenes intermedios
        } else {
            leftRightMargin = 120; // Desktop - márgenes amplios
        }
        
        const margin = { 
            top: 40, 
            right: leftRightMargin, 
            bottom: 80, 
            left: leftRightMargin 
        };
        
        // Dimensiones internas del área de dibujo
        const width = baseWidth - margin.left - margin.right;
        const height = baseHeight - margin.top - margin.bottom;
        
        return { 
            width: baseWidth, 
            height: baseHeight, 
            margin, 
            innerW: width, 
            innerH: height 
        };
    }

    function formatK(n) {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
        if (n >= 100) return (n / 1_000).toFixed(1) + 'k'; // Forzar formato k para valores >= 100
        return String(n);
    }

    function computeFontSizes() {
        // Fuentes fijas y responsive a través de CSS
        return {
            axis: 14,
            title: 18,
            labels: 14,
            legend: 14
        };
    }

    function ensureTooltip() {
        // Remove previous instance if any
        d3.select('body').select('.vehicle-tooltip').remove();
        
        // Create tooltip
        state.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'vehicle-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(2, 48, 71, 0.95)')
            .style('color', 'white')
            .style('padding', '12px 16px')
            .style('border-radius', '8px')
            .style('font-size', '14px')
            .style('font-weight', '500')
            .style('line-height', '1.4')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
            .style('transition', 'opacity 0.2s ease')
            .style('z-index', '1000')
            .style('max-width', '200px');
    }

    function render() {
        const target = d3.select(`#${TARGET_ID}`);
        if (target.empty() || !state.data.length) return;

        // Limpiar
        target.html('');
        
        // Inicializar tooltip
        ensureTooltip();

        const dims = getContainerDims();
        const font = computeFontSizes();

        const svg = target.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${dims.width} ${dims.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '100%')
            .style('height', '100%')
            .style('max-width', '100%');

        const g = svg.append('g')
            .attr('transform', `translate(${dims.margin.left},${dims.margin.top})`);

        // Gradiente para las barras (similar a población)
        const gradientId = `veh-bar-gradient-${Date.now()}`;
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', gradientId)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', palette.primary);
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#8ECAE6');

        // Calcular incrementos respecto al dato anterior
        let prevVehicles = null;
        let prevVPH = null;
        state.data.forEach(d => {
            // Crecimiento de vehículos vs registro inmediato anterior
            if (prevVehicles != null && d.vehicles != null && d.vehicles > 0) {
                d.growthVehicles = ((d.vehicles - prevVehicles) / prevVehicles) * 100;
            } else {
                d.growthVehicles = null;
            }
            prevVehicles = d.vehicles;

            // Crecimiento de VPH vs último VPH no nulo anterior
            if (d.vehiclesPerHousehold != null && !isNaN(d.vehiclesPerHousehold)) {
                if (prevVPH != null && prevVPH > 0) {
                    d.growthVPH = ((d.vehiclesPerHousehold - prevVPH) / prevVPH) * 100;
                } else {
                    d.growthVPH = null;
                }
                prevVPH = d.vehiclesPerHousehold;
            } else {
                d.growthVPH = null;
            }
        });

        // Escalas
        const years = state.data.map(d => d.year);
        const x = d3.scaleBand()
            .domain(years)
            .range([0, dims.innerW])
            .padding(0.2);

        const yLeft = d3.scaleLinear()
            .domain([0, d3.max(state.data, d => d.vehicles) * 1.1]).nice()
            .range([dims.innerH, 0]);

        const maxVph = d3.max(state.data, d => d.vehiclesPerHousehold || 0) || 1;
        const yRight = d3.scaleLinear()
            .domain([0, maxVph * 1.15]).nice()
            .range([dims.innerH, 0]);

        // Ejes
        const xAxis = d3.axisBottom(x)
            .tickValues(years.filter((y, i) => years.length > 10 ? i % 1 === 0 : true))
            .tickFormat(d3.format('d'));

        const yAxisLeft = d3.axisLeft(yLeft).ticks(6).tickFormat(d => formatK(d));
        const yAxisRight = d3.axisRight(yRight).ticks(5);

        g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${dims.innerH})`)
            .call(xAxis)
            .selectAll('text')
            .style('font-size', `${font.axis}px`)
            .style('fill', '#555')
            .style('text-shadow', 'none')
            .attr('transform', 'rotate(-45)')
            .attr('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em');
        // Desactivar eventos en eje X para evitar interferencia con hover de barras
        g.select('.x-axis').style('pointer-events', 'none');

        g.append('g')
            .attr('class', 'axis y-axis-left')
            .call(yAxisLeft)
            .selectAll('text')
            .style('font-size', `${font.axis}px`)
            .style('fill', '#555')
            .style('text-shadow', 'none');
        // Desactivar eventos en eje Y izquierdo
        g.select('.y-axis-left').style('pointer-events', 'none');

        g.append('g')
            .attr('class', 'axis y-axis-right')
            .attr('transform', `translate(${dims.innerW},0)`)
            .call(yAxisRight)
            .selectAll('text')
            .style('font-size', `${font.axis}px`)
            .style('fill', '#555')
            .style('text-shadow', 'none');
        // Desactivar eventos en eje Y derecho
        g.select('.y-axis-right').style('pointer-events', 'none');

        // Grid horizontal
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yLeft).tickSize(-dims.innerW).tickFormat(''))
            .selectAll('line')
            .attr('stroke', palette.grid);

        // Colores de ejes (líneas y path) similares a population (forzar inline style)
        const axisStroke = 'rgba(120, 120, 120, 0.2)';
        ['.x-axis', '.y-axis-left', '.y-axis-right'].forEach(sel => {
            g.select(sel).selectAll('path, line').style('stroke', axisStroke);
        });

        // Barras (vehículos) - dibujar antes pero mantenerlas por encima en z-order usando order()
        const barWidth = x.bandwidth();
        const bars = g.selectAll('.veh-bar')
            .data(state.data, d => d.year)
            .enter()
            .append('rect')
            .attr('class', 'veh-bar')
            .style('pointer-events', 'all')
            .attr('x', d => x(d.year))
            .attr('y', dims.innerH)
            .attr('width', barWidth)
            .attr('height', 0)
            .attr('fill', `url(#${gradientId})`)
            .attr('rx', Math.max(2, barWidth * 0.08));

        // Etiquetas de valores de barras
        const valueLabels = g.selectAll('.value-label')
            .data(state.data, d => d.year)
            .enter()
            .append('text')
            .attr('class', 'value-label')
            .attr('x', d => x(d.year) + x.bandwidth() / 2)
            .attr('y', d => yLeft(d.vehicles) - 8)
            .attr('text-anchor', 'middle')
            .style('font-size', `${font.labels}px`)
            .style('fill', palette.text)
            .style('text-shadow', 'none')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .text(d => formatK(d.vehicles));

        // Línea (autos por vivienda)
        const defined = d => d.vehiclesPerHousehold != null && !isNaN(d.vehiclesPerHousehold);
        const line = d3.line()
            .defined(defined)
            .x(d => x(d.year) + x.bandwidth() / 2)
            .y(d => yRight(d.vehiclesPerHousehold))
            .curve(d3.curveMonotoneX);

        const path = g.append('path')
            .datum(state.data.filter(defined))
            .attr('class', 'vph-line')
            .attr('fill', 'none')
            .attr('stroke', palette.accent)
            .attr('stroke-width', 3)
            .attr('d', line)
            .style('pointer-events', 'none');

        // Puntos de la línea
        const points = g.selectAll('.vph-point')
            .data(state.data.filter(defined))
            .enter()
            .append('circle')
            .attr('class', 'vph-point')
            .attr('cx', d => x(d.year) + x.bandwidth() / 2)
            .attr('cy', d => yRight(d.vehiclesPerHousehold))
            .attr('r', 0)
            .attr('fill', palette.accent)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .style('pointer-events', 'auto')
            .on('mouseover', function(event, d) {
                // Solo mostrar tooltip (sin cambiar tamaño para evitar flicker visual)
                let tooltipContent = `
                    <div><strong>Año ${d.year}</strong></div>
                    <div>Autos/vivienda: <span style="color: ${palette.accent}">${d.vehiclesPerHousehold.toFixed(2)}</span></div>
                `;
                if (d.growthVPH != null && !isNaN(d.growthVPH)) {
                    const signPrefix = d.growthVPH > 0 ? '+' : '';
                    let color = '#e5e7eb';
                    if (d.growthVPH > 0) color = '#2ECC71';
                    else if (d.growthVPH < 0) color = '#E63946';
                    tooltipContent += `<div>Incremento: <span style="color:${color}">${signPrefix}${d.growthVPH.toFixed(1)}%</span></div>`;
                }
                
                if (d.vehicles) {
                    tooltipContent += `<div>Vehículos totales: <span style="color: #8ECAE6">${formatK(d.vehicles)}</span></div>`;
                }
                
                // Posición del tooltip
                const xPosition = event.pageX - 100;
                const yPosition = event.pageY - 120;
                
                state.tooltip
                    .html(tooltipContent)
                    .style('left', xPosition + 'px')
                    .style('top', yPosition + 'px')
                    .style('opacity', 1);
            })
            .on('mouseout', function() {
                // Ocultar tooltip
                state.tooltip.style('opacity', 0);
            })
            .on('mousemove', function(event) {
                // Mover tooltip con el cursor
                const xPosition = event.pageX - 100;
                const yPosition = event.pageY - 120;
                
                state.tooltip
                    .style('left', xPosition + 'px')
                    .style('top', yPosition + 'px');
            });

        // Asegurar orden: línea sobre barras, puntos sobre línea
        path.raise();
        points.raise();

        // Título
        g.append('text')
            .attr('x', dims.innerW / 2)
            .attr('y', -24)
            .attr('text-anchor', 'middle')
            .style('font-size', `${font.title}px`)
            .style('font-weight', '700')
            .style('fill', palette.text)
            .style('text-shadow', 'none')
            .text('Crecimiento del Parque Vehicular y Autos por vivienda en Cancún, 2010–2023');

        // Leyenda (arriba-izquierda, bajo el título)
        // Leyenda responsiva (tamaños basados en ancho disponible)
        const legend = g.append('g')
            .attr('class', 'legend')
            .style('pointer-events', 'none');

        const legendItems = [
            { color: palette.primary, type: 'rect', label: 'Parque vehicular (total)' },
            { color: palette.accent, type: 'line', label: 'Autos por vivienda' }
        ];

        const legendSize = dims.innerW < 480 ? 12 : (dims.innerW < 768 ? 13 : 14);
        const legendRectW = Math.round(legendSize * 1.3);
        const legendRectH = Math.round(legendSize * 0.85);
        const legendIconGap = Math.round(legendSize * 0.5);
        const legendRightShift = Math.round(Math.min(16, dims.innerW * 0.02));

        legend.attr('transform', `translate(${legendRightShift}, ${6})`);

        const rowGap = Math.round(legendSize * 0.4) + 6;
        const lg = legend.selectAll('.legend-item')
            .data(legendItems)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * (legendSize + rowGap)})`);

        lg.each(function (d) {
            const gItem = d3.select(this);
            if (d.type === 'rect') {
                gItem.append('rect')
                    .attr('x', 0)
                    .attr('y', -Math.round(legendRectH / 2)) // centrar respecto al texto
                    .attr('width', legendRectW)
                    .attr('height', legendRectH)
                    .attr('fill', `url(#${gradientId})`) // usar el mismo gradiente de las barras
                    .attr('rx', 2);
            } else {
                gItem.append('line')
                    .attr('x1', 0)
                    .attr('y1', 0)
                    .attr('x2', legendRectW)
                    .attr('y2', 0)
                    .attr('stroke', d.color)
                    .attr('stroke-width', 3)
                    .attr('stroke-linecap', 'round')
                    .attr('transform', 'rotate(0)');
            }
            gItem.append('text')
                .attr('x', legendRectW + legendIconGap)
                .attr('y', 0)
                .attr('dominant-baseline', 'central')  // Mejor centrado vertical
                .style('font-size', `${legendSize}px`)
                .style('fill', '#555')
                .style('text-shadow', 'none')  // Eliminar sombra
                .text(d.label);
        });

        // Etiquetas de ejes (responsivas basadas en dimensiones)
        svg.append('text')
            .attr('x', dims.margin.left + dims.innerW / 2)
            .attr('y', dims.margin.top + dims.innerH + dims.margin.bottom - 10)
            .style('text-anchor', 'middle')
            .attr('fill', '#023047')
            .style('text-shadow', 'none')
            .text('Año');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 20)
            .attr('x', -(dims.margin.top + dims.innerH / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .attr('fill', '#023047')
            .style('text-shadow', 'none')
            .text('Vehículos (total)');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', dims.margin.left + dims.innerW + 40)
            .attr('x', -(dims.margin.top + dims.innerH / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .attr('fill', '#023047')
            .style('text-shadow', 'none')
            .text('Autos por vivienda');

        // Hover con tooltip
        bars
            .on('mouseenter', function(event, d) {
                // Destacar barra
                d3.select(this)
                    .raise()
                    .transition()
                    .duration(300)
                    .attr('opacity', 0.6);
                
                // Mostrar tooltip
                let tooltipContent = `
                    <div><strong>Año ${d.year}</strong></div>
                    <div>Vehículos: <span style="color: #8ECAE6">${d3.format(',')(d.vehicles)}</span></div>
                `;
                if (d.growthVehicles != null && !isNaN(d.growthVehicles)) {
                    const signPrefix = d.growthVehicles > 0 ? '+' : '';
                    let color = '#e5e7eb';
                    if (d.growthVehicles > 0) color = '#2ECC71';
                    else if (d.growthVehicles < 0) color = '#E63946';
                    tooltipContent += `<div>Incremento: <span style="color:${color}">${signPrefix}${d.growthVehicles.toFixed(1)}%</span></div>`;
                }
                
                if (d.vehiclesPerHousehold != null) {
                    tooltipContent += `<div>Autos/vivienda: <span style="color: ${palette.accent}">${d.vehiclesPerHousehold.toFixed(2)}</span></div>`;
                }
                
                // Posición del tooltip
                const xPosition = event.pageX - 100;
                const yPosition = event.pageY - 120;
                
                state.tooltip
                    .html(tooltipContent)
                    .style('left', xPosition + 'px')
                    .style('top', yPosition + 'px')
                    .style('opacity', 1);
            })
            .on('mouseleave', function() {
                // Restaurar barra
                d3.select(this)
                    .transition()
                    .duration(300)
                    .attr('opacity', 1);
                
                // Ocultar tooltip
                state.tooltip.style('opacity', 0);
            })
            .on('mousemove', function(event) {
                // Mover tooltip con el cursor
                const xPosition = event.pageX - 100;
                const yPosition = event.pageY - 120;
                
                state.tooltip
                    .style('left', xPosition + 'px')
                    .style('top', yPosition + 'px');
            });

        // Overlay para hover sobre la línea completa (no solo puntos)
        // Insertarla al principio para que quede detrás de barras y puntos
        const overlay = g.insert('rect', ':first-child')
            .attr('class', 'hover-overlay')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', dims.innerW)
            .attr('height', dims.innerH)
            .style('fill', 'transparent')
            .style('pointer-events', 'none');

        // Animaciones de entrada (solo primera vez)
        if (!state.hasDrawn) {
            const t = g.transition().duration(900).ease(d3.easeCubicOut);
            bars.transition(t)
                .attr('y', d => yLeft(d.vehicles))
                .attr('height', d => dims.innerH - yLeft(d.vehicles));

            // Label aparece luego de barras
            valueLabels.transition().delay(700).duration(400)
                .style('opacity', 1)
                .attr('y', d => yLeft(d.vehicles) - 8);

            // Línea dibujada con trazo animado
            const totalLen = path.node().getTotalLength();
            path
                .attr('stroke-dasharray', `${totalLen} ${totalLen}`)
                .attr('stroke-dashoffset', totalLen)
                .transition().delay(350).duration(900).ease(d3.easeCubicOut)
                .attr('stroke-dashoffset', 0);

            // Puntos emergen
            points.transition().delay(900).duration(400)
                .attr('r', Math.min(5, Math.max(3, barWidth * 0.2)));

            state.hasDrawn = true;
        } else {
            // Actualización sin animaciones fuertes (en redimensionamiento)
            bars
                .attr('y', d => yLeft(d.vehicles))
                .attr('height', d => dims.innerH - yLeft(d.vehicles));
            valueLabels
                .style('opacity', 1)
                .attr('y', d => yLeft(d.vehicles) - 8)
                .style('font-size', `${font.labels}px`);
            points
                .attr('r', Math.min(5, Math.max(3, barWidth * 0.2)));
        }

        // Guardar referencias para enter/exit animations
        state.refs = {
            g, bars, labels: valueLabels, path, points, overlay,
            dims,
            scales: { x, yLeft, yRight }
        };
    }

    function initResizeObserver() {
        const el = document.getElementById(TARGET_ID);
        if (!el) return;
        if (state.resizeObserver) return;
        state.resizeObserver = new ResizeObserver(() => {
            if (state.hasLoaded) {
                render();
            }
        });
        state.resizeObserver.observe(el);
    }

    function loadData() {
        if (state.hasLoaded) {
            render();
            return;
        }
        // d3.csv signature: (url, init?) or (url, rowMapper?)
        // Usamos opciones de fetch como segundo argumento y luego mapeamos manualmente.
        d3.csv(DATA_URL, { cache: 'no-store' }).then(rawRows => {
            const rows = rawRows.map(parseCsvRow);
            state.data = rows
                .filter(d => d.year && d.vehicles)
                .sort((a, b) => d3.ascending(a.year, b.year));
            state.hasLoaded = true;
            initResizeObserver();
            render();
        }).catch(err => {
            console.error('Error cargando CSV, usando datos vacíos:', err);
            state.data = [];
            state.hasLoaded = true;
            initResizeObserver();
            render();
        });
    }

    // Exponer para ser llamado desde Scrollama (main.js en step 27)
    window.initVehicleChart = function () {
        loadData();
    };

    // API pública para animaciones en enter/exit del step
    window.vehicleChart = {
        enter: function() {
            if (!state.hasLoaded) { loadData(); return; }
            const r = state.refs;
            if (!r || !r.g) return;
            const { g, bars, labels, path, points, dims, scales } = r;
            // Re-animar barras
            const t = g.transition().duration(800).ease(d3.easeCubicOut);
            bars
                .attr('y', dims.innerH)
                .attr('height', 0)
                .transition(t)
                .attr('y', d => scales.yLeft(d.vehicles))
                .attr('height', d => dims.innerH - scales.yLeft(d.vehicles));
            labels.style('opacity', 0)
                .attr('y', d => scales.yLeft(d.vehicles) - 8)
                .transition().delay(600).duration(350)
                .style('opacity', 1);
            // Redibujar línea
            const totalLen = path.node().getTotalLength();
            path
                .attr('stroke-dasharray', `${totalLen} ${totalLen}`)
                .attr('stroke-dashoffset', totalLen)
                .transition().delay(250).duration(900).ease(d3.easeCubicOut)
                .attr('stroke-dashoffset', 0);
            points
                .attr('r', 0)
                .transition().delay(950).duration(350)
                .attr('r', Math.min(5, Math.max(3, scales.x.bandwidth() * 0.2)));
        },
        exit: function() {
            const r = state.refs;
            if (!r || !r.g) return;
            const { g, bars, labels, path, points, dims, scales } = r;
            const t = g.transition().duration(500).ease(d3.easeCubicIn);
            bars.transition(t)
                .attr('y', dims.innerH)
                .attr('height', 0);
            labels.transition(t).style('opacity', 0);
            const totalLen = path.node().getTotalLength();
            path.transition(t)
                .attr('stroke-dasharray', `${totalLen} ${totalLen}`)
                .attr('stroke-dashoffset', totalLen);
            points.transition(t).attr('r', 0);
                // Tooltip no usado en esta gráfica
            // Marcar como no dibujado para reanimar en la siguiente entrada
            state.hasDrawn = false;
        }
    };
});