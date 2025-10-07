// Gráfico combinado (barras + línea) con doble eje Y para Parque Vehicular
// - Barras: Vehículos totales (eje Y izquierdo)
// - Línea: Autos por vivienda (eje Y derecho)
// Datos desde: /public/data/parque-vehicular.csv

document.addEventListener('DOMContentLoaded', function () {
    const TARGET_ID = 'vehicleGrowthChart';
    const DATA_URL = '/public/data/parque-vehicular.csv';

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
        resizeObserver: null
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
        const margin = { top: 64, right: 68, bottom: 56, left: 96 };
        const width = Math.max(600, rect.width);
        const height = Math.max(420, rect.height);
        return { width, height, margin, innerW: width - margin.left - margin.right, innerH: height - margin.top - margin.bottom };
    }

    function formatK(n) {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
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

    function render() {
        const target = d3.select(`#${TARGET_ID}`);
        if (target.empty() || !state.data.length) return;

        // Limpiar
        target.html('');

        const dims = getContainerDims();
        const font = computeFontSizes(dims.width);

        const svg = target.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${dims.width} ${dims.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const g = svg.append('g')
            .attr('transform', `translate(${dims.margin.left},${dims.margin.top})`);

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
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${dims.innerH})`)
            .call(xAxis)
            .selectAll('text')
            .style('font-size', `${font.axis}px`)
            .style('fill', palette.text);

        g.append('g')
            .attr('class', 'y-axis-left')
            .call(yAxisLeft)
            .selectAll('text')
            .style('font-size', `${font.axis}px`)
            .style('fill', palette.text);

        g.append('g')
            .attr('class', 'y-axis-right')
            .attr('transform', `translate(${dims.innerW},0)`)
            .call(yAxisRight)
            .selectAll('text')
            .style('font-size', `${font.axis}px`)
            .style('fill', palette.text);

        // Grid horizontal
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yLeft).tickSize(-dims.innerW).tickFormat(''))
            .selectAll('line')
            .attr('stroke', palette.grid);

        // Barras (vehículos)
        const barWidth = x.bandwidth() * 0.6;
        const bars = g.selectAll('.veh-bar')
            .data(state.data, d => d.year)
            .enter()
            .append('rect')
            .attr('class', 'veh-bar')
            .attr('x', d => x(d.year) + (x.bandwidth() - barWidth) / 2)
            .attr('y', dims.innerH)
            .attr('width', barWidth)
            .attr('height', 0)
            .attr('fill', palette.primary)
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
            .text(d => d3.format(',')(d.vehicles));

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
            .attr('stroke-width', 1.5);

        // Título
        g.append('text')
            .attr('x', 0)
            .attr('y', -24)
            .attr('text-anchor', 'start')
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

        // Etiquetas de ejes
        g.append('text')
            .attr('x', dims.innerW / 2)
            .attr('y', dims.innerH + 40)
            .attr('text-anchor', 'middle')
            .style('font-size', `${font.axis}px`)
            .style('fill', palette.text)
            .text('Año');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -dims.innerH / 2)
            .attr('y', -64)
            .attr('text-anchor', 'middle')
            .style('font-size', `${font.axis}px`)
            .style('fill', palette.text)
            .text('Vehículos (total)');

        g.append('text')
            .attr('transform', `translate(${dims.innerW + 48}, ${dims.innerH / 2}) rotate(90)`) 
            .attr('text-anchor', 'middle')
            .style('font-size', `${font.axis}px`)
            .style('fill', palette.text)
            .text('Autos por vivienda');

        // Tooltip (busca el hermano .tooltip dentro del contenedor padre)
        const parent = document.getElementById(TARGET_ID).parentNode;
        const tooltip = d3.select(parent).select('.tooltip');

        const showBarTip = (event, d) => {
            tooltip
                .style('opacity', 1)
                .html(`<div><strong>Año:</strong> ${d.year}</div>
                             <div><strong>Vehículos:</strong> ${d3.format(',')(d.vehicles)}</div>`)
                .style('left', `${event.pageX + 12}px`)
                .style('top', `${event.pageY - 28}px`);
        };
        const showPointTip = (event, d) => {
            tooltip
                .style('opacity', 1)
                .html(`<div><strong>Año:</strong> ${d.year}</div>
                             <div><strong>Autos por vivienda:</strong> ${d.vehiclesPerHousehold.toFixed(2)}</div>`) 
                .style('left', `${event.pageX + 12}px`)
                .style('top', `${event.pageY - 28}px`);
        };
        const hideTip = () => tooltip.style('opacity', 0);

        bars.on('mousemove', showBarTip).on('mouseenter', showBarTip).on('mouseleave', hideTip);
        points.on('mousemove', showPointTip).on('mouseenter', showPointTip).on('mouseleave', hideTip);

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
});