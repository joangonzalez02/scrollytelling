// Gráfico combinado (barras + línea) con doble eje Y para Parque Vehicular
// - Barras: Vehículos totales (eje Y izquierdo)
// - Línea: Autos por vivienda (eje Y derecho)
// Datos desde: public/data/parque-vehicular.csv

document.addEventListener('DOMContentLoaded', function () {
    const TARGET_ID = 'vehicleGrowthChart';
    const DATA_URL = 'public/data/parque-vehicular.csv';

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
        const el = document.getElementById(TARGET_ID);
        const rect = el.getBoundingClientRect();
        // Márgenes amplios para ejes y leyenda
        const margin = { top: 64, right: 78, bottom: 66, left: 106 };
        const width = Math.max(800, rect.width);
        const height = Math.max(520, rect.height);
        return { width, height, margin, innerW: width - margin.left - margin.right, innerH: height - margin.top - margin.bottom };
    }

    function formatK(n) {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
        if (n >= 100) return (n / 1_000).toFixed(1) + 'k'; // Forzar formato k para valores >= 100
        return String(n);
    }

    function computeFontSizes(width) {
        // Escalar tipografías con el ancho, con límites
        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
        return {
            axis: clamp(width * 0.015, 12, 18),
            title: clamp(width * 0.026, 18, 28),
            labels: clamp(width * 0.016, 12, 18),
            legend: clamp(width * 0.015, 12, 18)
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
        const font = computeFontSizes(dims.width);

        const svg = target.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${dims.width} ${dims.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

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

        // Escalas
        const years = state.data.map(d => d.year);
        const x = d3.scaleBand()
            .domain(years)
            .range([0, dims.innerW])
            .padding(0.4);

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
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${dims.innerH})`)
            .call(xAxis)
            .selectAll('text')
            .style('font-size', `${font.axis}px`)
            .style('fill', '#023047')
            .attr('transform', 'rotate(-45)')
            .attr('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em');

        g.append('g')
            .attr('class', 'y-axis-left')
            .call(yAxisLeft)
            .selectAll('text')
            .style('font-size', `${font.axis}px`)
            .style('fill', '#023047');

        g.append('g')
            .attr('class', 'y-axis-right')
            .attr('transform', `translate(${dims.innerW},0)`)
            .call(yAxisRight)
            .selectAll('text')
            .style('font-size', `${font.axis}px`)
            .style('fill', '#023047');

        // Grid horizontal
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yLeft).tickSize(-dims.innerW).tickFormat(''))
            .selectAll('line')
            .attr('stroke', palette.grid);

        // Barras (vehículos)
        const barWidth = x.bandwidth();
        const bars = g.selectAll('.veh-bar')
            .data(state.data, d => d.year)
            .enter()
            .append('rect')
            .attr('class', 'veh-bar')
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
            .attr('d', line);

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
            .on('mouseover', function(event, d) {
                // Destacar punto
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', Math.max(6, x.bandwidth() * 0.3))
                    .attr('stroke-width', 2);
                
                // Mostrar tooltip
                let tooltipContent = `
                    <div><strong>Año ${d.year}</strong></div>
                    <div>Autos/vivienda: <span style="color: ${palette.accent}">${d.vehiclesPerHousehold.toFixed(2)}</span></div>
                `;
                
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
                // Restaurar punto
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', Math.max(3, x.bandwidth() * 0.2))
                    .attr('stroke-width', 1.5);
                
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

        // Título
        g.append('text')
            .attr('x', dims.innerW / 2)
            .attr('y', -24)
            .attr('text-anchor', 'middle')
            .style('font-size', `${font.title}px`)
            .style('font-weight', '700')
            .style('fill', palette.text)
            .text('Crecimiento del Parque Vehicular y Autos por vivienda en Cancún, 2010–2023');

        // Leyenda (arriba-izquierda, bajo el título)
        const legend = g.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(0, 4)');

        const legendItems = [
            { color: palette.primary, type: 'rect', label: 'Parque vehicular (total)' },
            { color: palette.accent, type: 'line', label: 'Autos por vivienda' }
        ];

        let lx = 0;
        const lg = legend.selectAll('.legend-item')
            .data(legendItems)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => {
                const tx = lx;
                const itemW = 18 + 6 + (d.label.length * (font.legend * 0.6));
                lx += itemW + 18;
                return `translate(${tx}, 0)`;
            });

        lg.each(function (d) {
            const gItem = d3.select(this);
            if (d.type === 'rect') {
                gItem.append('rect')
                    .attr('x', 0)
                    .attr('y', -font.legend + 4)
                    .attr('width', 18)
                    .attr('height', 12)
                    .attr('fill', d.color)
                    .attr('rx', 2);
            } else {
                gItem.append('line')
                    .attr('x1', 0)
                    .attr('y1', -font.legend / 2 + 2)
                    .attr('x2', 18)
                    .attr('y2', -font.legend / 2 + 2)
                    .attr('stroke', d.color)
                    .attr('stroke-width', 3);
            }
            gItem.append('text')
                .attr('x', 24)
                .attr('y', 0)
                .attr('dominant-baseline', 'ideographic')
                .style('font-size', `${font.legend}px`)
                .style('fill', palette.text)
                .text(d.label);
        });

        // Etiquetas de ejes (responsivas basadas en dimensiones)
        svg.append('text')
            .attr('x', dims.margin.left + dims.innerW / 2)
            .attr('y', dims.margin.top + dims.innerH + dims.margin.bottom - 10)
            .style('text-anchor', 'middle')
            .attr('fill', '#023047')
            .text('Año');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 20)
            .attr('x', -(dims.margin.top + dims.innerH / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .attr('fill', '#023047')
            .text('Vehículos (total)');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', dims.margin.left + dims.innerW + 50)
            .attr('x', -(dims.margin.top + dims.innerH / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .attr('fill', '#023047')
            .text('Autos por vivienda');

        // Hover con tooltip
        bars
            .on('mouseover', function(event, d) {
                // Destacar barra
                d3.select(this)
                    .transition()
                    .duration(300)
                    .attr('opacity', 0.9)
                    .attr('stroke', palette.primary)
                    .attr('stroke-width', 2);
                
                // Mostrar tooltip
                let tooltipContent = `
                    <div><strong>Año ${d.year}</strong></div>
                    <div>Vehículos: <span style="color: #8ECAE6">${d3.format(',')(d.vehicles)}</span></div>
                `;
                
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
            .on('mouseout', function() {
                // Restaurar barra
                d3.select(this)
                    .transition()
                    .duration(300)
                    .attr('opacity', 1)
                    .attr('stroke', 'none')
                    .attr('stroke-width', 0);
                
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
                .attr('r', Math.max(3, barWidth * 0.2));

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
                .attr('r', Math.max(3, barWidth * 0.2));
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
        d3.csv(DATA_URL, parseCsvRow).then(rows => {
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
                .attr('r', Math.max(3, scales.x.bandwidth() * 0.2));
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