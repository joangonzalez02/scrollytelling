// Script principal para la integración de Scrollama con las visualizaciones
document.addEventListener('DOMContentLoaded', function() {
    // El token y la inicialización de Mapbox ahora se manejan dentro de mapbox-integration.js bajo demanda
    
    // Ocultar el contenedor del mapa inicialmente
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.style.opacity = '0';
        mapContainer.style.visibility = 'hidden';
        mapContainer.style.display = 'none';
    }
    
    // Variables para Scrollama
    const scroller = scrollama();
    let subScroller = null; // para substeps discretos del step 4
    const USE_DISCRETE_SUBSTEPS = true;
    const POP_CHART_EARLY_PROGRESS = 0.38;  // retrasar aparición
    const POP_CHART_HIDE_THRESHOLD = 0.24;  // ocultar antes al volver hacia arriba
    const POP_CHART_HIDE_BOTTOM = 0.82;     // ocultar antes del final para no tapar Step 5
    let currentStep = 0;

    // Helpers para fijar/desfijar el chart usando position:fixed
    function showPopulationChart(sectionEl) {
        if (!sectionEl) return;
        const chartCont = sectionEl.querySelector && sectionEl.querySelector('.chart-container');
        if (!chartCont) return;
        if (!chartCont.classList.contains('visible')) {
            chartCont.classList.add('visible');
        }
        try { pinChart(sectionEl); } catch {}
    }

    function hidePopulationChart(sectionEl) {
        if (!sectionEl) return;
        const chartCont = sectionEl.querySelector && sectionEl.querySelector('.chart-container');
        if (!chartCont) return;
        if (chartCont.classList.contains('visible')) {
            chartCont.classList.remove('visible');
        }
        try { unpinChart(sectionEl); } catch {}
    }

    function pinChart(sectionEl) {
        if (!sectionEl) return;
        const chartCont = sectionEl.querySelector && sectionEl.querySelector('.chart-container');
        if (!chartCont) return;
        if (chartCont.dataset.pinned === 'true') return;

        // Crear placeholder para evitar colapso del layout
        const rect = chartCont.getBoundingClientRect();
        const placeholder = document.createElement('div');
        placeholder.className = 'chart-placeholder';
        placeholder.style.width = rect.width + 'px';
        // Hacemos el placeholder más alto que el chart para dar espacio de scroll
        // y evitar que Scrollama marque salida al fijar el elemento.
        const extra = Math.max(80, Math.round(window.innerHeight * 0.2)); // añadir 20% de viewport (mínimo 80px)
        placeholder.style.height = (rect.height + extra) + 'px';
        placeholder.style.display = getComputedStyle(chartCont).display || 'block';
        chartCont.parentNode.insertBefore(placeholder, chartCont);

        // Si el módulo del chart expone el selector, moverlo dentro del chart fijo
        try {
            if (window.populationChart && typeof window.populationChart.attachSelectorTo === 'function') {
                const sel = window.populationChart.getSelectorElement && window.populationChart.getSelectorElement();
                if (sel) {
                    // mover al chartCont (fijo) para que quede visible y encima
                    window.populationChart.attachSelectorTo(chartCont);
                    // Posicionar el selector como absoluto dentro del chart fijo
                    sel.style.position = 'absolute';
                    sel.style.top = '8px';
                    sel.style.left = '50%';
                    sel.style.transform = 'translateX(-50%)';
                    sel.style.zIndex = '10060';
                    sel.style.pointerEvents = 'auto';
                    sel.style.background = sel.style.background || 'transparent';
                    sel.style.padding = sel.style.padding || '6px 0 12px 0';
                    sel.style.width = sel.style.width || 'auto';
                }
            }
        } catch (e) { console.warn('pinChart: could not move selector to chartCont', e); }

        // Aplicar estilos fijos al chart: centrar verticalmente en el viewport
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 800;
        const chartH = rect.height || 500;
        const centeredTop = Math.round((viewportH - chartH) / 2);
        const topPx = Math.max(Math.round(viewportH * 0.02), centeredTop);
        const targetWidth = Math.min(rect.width, Math.round(window.innerWidth * 0.92));
        chartCont.style.position = 'fixed';
        chartCont.style.top = topPx + 'px';
        chartCont.style.left = '50%';
        chartCont.style.transform = 'translateX(-50%)';
        chartCont.style.width = targetWidth + 'px';
        chartCont.style.maxWidth = '92%';
        chartCont.style.zIndex = '10050';
        chartCont.style.transition = 'transform 200ms ease, box-shadow 200ms ease, width 120ms ease';
        chartCont.style.boxShadow = '0 20px 40px rgba(2,48,71,0.12)';
        chartCont.dataset.pinned = 'true';
        // Mantener pointer-events en el chart para que el selector funcione correctamente
        console.log('[pinChart] pinned chart, placeholder height:', placeholder.style.height);
    }

    function unpinChart(sectionEl) {
        if (!sectionEl) return;
        const chartCont = sectionEl.querySelector && sectionEl.querySelector('.chart-container');
        if (!chartCont) return;
        if (chartCont.dataset.pinned !== 'true') return;

        // Antes de remover placeholder, devolver el selector a su lugar original
        try {
            if (window.populationChart && typeof window.populationChart.attachSelectorTo === 'function') {
                window.populationChart.attachSelectorTo(null);
            }
        } catch (e) { console.warn('unpinChart: could not restore selector to original', e); }

        // Remover placeholder
        const placeholder = chartCont.parentNode && chartCont.parentNode.querySelector && chartCont.parentNode.querySelector('.chart-placeholder');
        if (placeholder) {
            placeholder.remove();
            console.log('[unpinChart] removed placeholder');
        }

        // Limpiar estilos inline
        chartCont.style.position = '';
        chartCont.style.top = '';
        chartCont.style.left = '';
        chartCont.style.transform = '';
        chartCont.style.width = '';
        chartCont.style.zIndex = '';
        chartCont.style.transition = '';
        chartCont.style.boxShadow = '';
        chartCont.style.pointerEvents = '';
        delete chartCont.dataset.pinned;
        console.log('[unpinChart] unpinned chart');
    }

    // Configurar Scrollama
    function initScrollama() {
        scroller
            .setup({
                step: '.step',
                offset: 0.5,
                progress: true,
                debug: false
            })
            .onStepEnter(response => {
                console.log('[scroller] onStepEnter', response.index, response.element && response.element.getAttribute && response.element.getAttribute('data-step'));
                currentStep = response.index;
                
                // Seguridad: ocultar leyenda/panel salvo que luego un step de mapa permitido los muestre
                try {
                    const legend = document.getElementById('map-legend');
                    if (legend) legend.style.display = 'none';
                    const panel = document.getElementById('map-lustro-control');
                    if (panel) panel.style.display = 'none';
                } catch {}

                // Activar elementos visuales específicos para cada paso
                activateStepVisuals(currentStep);
                
                // Agregar clase activa al paso actual
                document.querySelectorAll('.step').forEach(el => {
                    el.classList.remove('is-active');
                    el.classList.remove('active');
                });
                response.element.classList.add('is-active');
                response.element.classList.add('active');
                // Animación de typing para el título del step 1
                try {
                    if (response.index === 0) {
                        startTypingStep1(response.element);
                    }
                } catch (e) { console.warn('Error aplicando typing secuencial en step 1:', e); }
                
                // Animación específica para step 29
                if (currentStep === 28) {
                    const step29 = response.element;
                    step29.classList.remove('animate-up', 'animate-down');
                    // direction: 'down' when entering while scrolling down; 'up' when entering while scrolling up
                    if (response.direction === 'down') {
                        step29.classList.add('animate-down');
                    } else {
                        step29.classList.add('animate-up');
                    }
                }

                if (currentStep === 4) {
                    const step5 = response.element;
                    try { step5.classList.remove('animate-up', 'animate-down'); } catch {}
                    const img5 = step5.querySelector && step5.querySelector('.floating-image');
                    if (img5) {
                        // Asegurar que no hay transform residual al entrar
                        img5.style.transform = '';
                    }
                }

                // Animar charts al entrar a sus steps
                if (currentStep === 26 && window.vehicleChart && typeof window.vehicleChart.enter === 'function') {
                    // Nuevo Step 25 (index 24): parque vehicular
                    window.vehicleChart.enter();
                }

                if (response.index === 3) {
                }

                // Si entramos a cualquier otro paso, ocultar/desfijar la gráfica de Step 4 si quedó visible
                if (response.index !== 3) {
                    try {
                        const step4 = document.querySelector('section[data-step="4"]');
                        if (step4) {
                            const chartCont = step4.querySelector('.chart-container');
                            if (chartCont && chartCont.classList.contains('visible')) {
                                chartCont.classList.remove('visible');
                            }
                            if (chartCont && chartCont.dataset.pinned === 'true') {
                                unpinChart(step4);
                            }
                        }
                    } catch {}
                }
            })
            .onStepExit(response => {
                console.log('[scroller] onStepExit', response.index, response.element && response.element.getAttribute && response.element.getAttribute('data-step'));
                response.element.classList.remove('is-active');
                response.element.classList.remove('active');
                // Si salimos del step 1, cancelar timers y limpiar clases relacionadas al typing
                try {
                    if (response.index === 0) {
                        clearTypingStep1(response.element);
                    }
                } catch (e) { console.warn('Error limpiando typing al salir de step 1:', e); }

                // Reset de animaciones para step 29 al salir, para que pueda reanimarse al re-entrar
                if (response.index === 28) {
                    const step29 = response.element;
                    // Forzar reflow para reiniciar animaciones si fuese necesario
                    step29.classList.remove('animate-up', 'animate-down');
                    const left = step29.querySelector('.consequence-image-left');
                    const right = step29.querySelector('.consequence-image-right');
                    if (left && right) {
                        left.style.opacity = '0';
                        right.style.opacity = '0';
                        left.style.transform = 'scale(0.9) translateX(-40px)';
                        right.style.transform = 'scale(0.9) translateX(40px)';
                    }
                }

                // Step 5: limpiar cualquier estilo inline al salir
                if (response.index === 4) {
                    const step5 = response.element;
                    try { step5.classList.remove('animate-up', 'animate-down'); } catch {}
                    const img5 = step5.querySelector && step5.querySelector('.floating-image');
                    if (img5) {
                        // Dejar que el fade por scroll gestione opacidad; no aplicar transform
                        img5.style.opacity = '0';
                        img5.style.transform = '';
                    }
                }
                
                // Al salir de steps con leyenda (19, 25) forzar ocultado
                if (response.index === 18 || response.index === 24) {
                    try {
                        const legend = document.getElementById('map-legend');
                        if (legend) legend.style.display = 'none';
                        const panel = document.getElementById('map-lustro-control');
                        if (panel) panel.style.display = 'none';
                    } catch {}
                }
                
                // Al salir de steps de pérdida forestal (21-23 -> índices 20-22), ocultar fondo si corresponde
                if (response.index >= 20 && response.index <= 22) {
                    if (currentStep < 20 || currentStep > 22) {
                        setTimeout(() => {
                            const forestBg = document.getElementById('forest-loss-background');
                            if (forestBg) {
                                forestBg.style.display = 'none';
                                forestBg.style.visibility = 'hidden';
                                forestBg.style.opacity = '0';
                            }
                            document.querySelectorAll('.forest-bg-frame').forEach(frame => {
                                frame.classList.remove('active');
                                frame.style.opacity = '0';
                                frame.style.visibility = 'hidden';
                                frame.style.display = 'none';
                            });
                        }, 200);
                    }
                }
                
                // Si salimos de cualquier step de evolución urbana (6-16), ocultar las imágenes de fondo
                if (response.index >= 6 && response.index <= 16) {
                    // Si no estamos entrando a otro step de evolución urbana, ocultar todo
                    if (currentStep < 6 || currentStep > 16) {
                        setTimeout(() => {
                            const evolutionBg = document.getElementById('urban-evolution-background');
                            if (evolutionBg) {
                                evolutionBg.style.display = 'none';
                                evolutionBg.style.visibility = 'hidden';
                                evolutionBg.style.opacity = '0';
                            }
                            
                            document.querySelectorAll('.urban-bg-image').forEach(img => {
                                img.classList.remove('active');
                                img.style.opacity = '0';
                                img.style.visibility = 'hidden';
                            });
                        }, 200); // Pequeño delay para transición suave
                    }
                }
                
                // Verificar si el step que estamos abandonando tenía un mapa
                const exitingElement = response.element;
                if (exitingElement && exitingElement.getAttribute('data-map') === 'true') {
                    hideMapVisuals(); // Función específica para ocultar elementos del mapa
                }

                // Si salimos del step del parque vehicular (nuevo índice 26), ejecutar animación de salida
                if (response.index === 26 && window.vehicleChart && typeof window.vehicleChart.exit === 'function') {
                    window.vehicleChart.exit();
                }

                // Si salimos del step de población (step 4 -> índice 3), unpin y limpiar
                if (response.index === 3) {
                    try {
                        console.log('[scroller] exiting population step - unpinning');
                        // Ocultar el chart
                        const chartCont = response.element.querySelector('.chart-container');
                        if (chartCont) {
                            chartCont.classList.remove('visible');
                        }
                        // Restaurar selector a su padre original y eliminar contenedor fijo
                        try {
                            if (window.populationChart && typeof window.populationChart.attachSelectorTo === 'function') {
                                window.populationChart.attachSelectorTo(null);
                            }
                            const floating = document.getElementById('floating-population-selector');
                            if (floating) {
                                floating.remove();
                            }
                        } catch (e) { console.warn('exit step: could not restore selector', e); }

                        unpinChart(response.element);
                    } catch (e) { /* silent */ }
                }
            });

        // Manejo de progreso dentro de steps (Step 4: usar umbrales para visibilidad)
        scroller.onStepProgress(response => {
            const p = response.progress;
            // Con substeps activos, controlamos visibilidad por umbrales
            if (response.index === 3 && USE_DISCRETE_SUBSTEPS) {
                const step4 = response.element;
                const chartCont = step4.querySelector && step4.querySelector('.chart-container');
                if (!chartCont) return;

                const activeSub = document.querySelector('.step[data-step="4"] .substep.is-active');
                // Siempre ocultar cerca del final para no tapar el Step 5
                if (p >= POP_CHART_HIDE_BOTTOM) {
                    hidePopulationChart(step4);
                } else if (activeSub) {
                    // Si hay un substep activo, mantener visible independientemente del umbral inicial
                    showPopulationChart(step4);
                } else if (p < POP_CHART_EARLY_PROGRESS) {
                    // Sin substep activo y muy arriba: oculto para no tapar texto
                    hidePopulationChart(step4);
                } else {
                    showPopulationChart(step4);
                }
                return;
            }
            
            if (response.index === 3 && !USE_DISCRETE_SUBSTEPS) {
                
                // Mostrar el chart solo cuando el progreso sea mayor a 0.3
                const chartCont = response.element.querySelector('.chart-container');
                if (p >= 0.3) {
                    if (!chartCont.classList.contains('visible')) {
                        chartCont.classList.add('visible');
                        // Pin el chart
                        pinChart(response.element);
                        // Crear el floating selector
                        try {
                            const floatingId = 'floating-population-selector';
                            let floating = document.getElementById(floatingId);
                            if (!floating) {
                                floating = document.createElement('div');
                                floating.id = floatingId;
                                document.body.appendChild(floating);
                                // Estilos: fijo, centrado horizontalmente, justo arriba del chart
                                const topPx = Math.round(window.innerHeight * 0.14) - 8;
                                Object.assign(floating.style, {
                                    position: 'fixed',
                                    top: (topPx) + 'px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: '10070',
                                    pointerEvents: 'auto',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.95)',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    backdropFilter: 'blur(8px)',
                                    transition: 'all 0.3s ease',
                                    width: 'auto'
                                });
                            }

                            if (window.populationChart && typeof window.populationChart.attachSelectorTo === 'function') {
                                window.populationChart.attachSelectorTo(floating);
                            }
                        } catch (e) { console.warn('progress: could not create floating selector', e); }
                    }
                    
                    // Cambiar el tipo basado en el progreso (ajustado para el rango 0.3-1.0)
                    const adjustedP = (p - 0.3) / 0.7; // Normalizar a 0-1 en el rango visible
                    let type = 'benito';
                    if (adjustedP < 0.25) type = 'benito';
                    else if (adjustedP < 0.5) type = 'qroo';
                    else if (adjustedP < 0.75) type = 'mexico';
                    else type = 'mundo';

                    console.log('[onStepProgress] setting type to:', type);
                    if (window.populationChart && typeof window.populationChart.setDataType === 'function') {
                        window.populationChart.setDataType(type);
                    } else {
                        console.log('[onStepProgress] window.populationChart.setDataType not available');
                    }
                } else {
                    // Si progreso < 0.3, ocultar el chart si está visible
                    if (chartCont.classList.contains('visible')) {
                        chartCont.classList.remove('visible');
                        // Unpin y limpiar
                        try {
                            unpinChart(response.element);
                            if (window.populationChart && typeof window.populationChart.attachSelectorTo === 'function') {
                                window.populationChart.attachSelectorTo(null);
                            }
                            const floating = document.getElementById('floating-population-selector');
                            if (floating) {
                                floating.remove();
                            }
                        } catch (e) { /* silent */ }
                    }
                }
            }

            // ===== Progreso de escena para cámara Mapbox (scene progress) =====
            // Vincula el progreso continuo del scroll a movimientos de cámara en pasos largos con mapa.
            // Step 19 (index 18) y step 25 (index 24).
            try {
                // Solo si el mapa está visible en el DOM
                const mapEl = document.getElementById('map');
                const isMapVisible = mapEl && mapEl.style.display !== 'none' && mapEl.style.visibility !== 'hidden' && mapEl.style.opacity !== '0';
                if (isMapVisible && window.mapboxHelper && typeof window.mapboxHelper.setCameraProgress === 'function') {
                    // Step 19
                    if (response.index === 18) {
                        const prog = Math.max(0, Math.min(1, p));
                        window.mapboxHelper.setCameraProgress('step-19', prog);
                    }
                    // Step 25
                    if (response.index === 24) {
                        const prog = Math.max(0, Math.min(1, p));
                        window.mapboxHelper.setCameraProgress('step-25', prog);
                    }
                    // Step 31: dimensiones caminar (index 30)
                    if (response.index === 30) {
                        const prog = Math.max(0, Math.min(1, p));
                        // Animar cámara con jumpTo por frame
                        window.mapboxHelper.setCameraProgress('step-31', prog);
                        // Actualizar opacidad por umbral si existe el campo 'total'
                        if (typeof window.mapboxHelper.updateDimensionesOpacity === 'function') {
                            window.mapboxHelper.updateDimensionesOpacity(prog);
                        }
                    }
                }
            } catch (e) { /* silent */ }
        });

        // Sub-scroller para substeps discretos de Step 4
        if (USE_DISCRETE_SUBSTEPS) {
            try {
                subScroller = scrollama();
                subScroller
                    .setup({
                        step: '.step[data-step="4"] .substep',
                        // Offset más profundo para estabilizar la activación de substeps
                        // y reducir saltos cuando el usuario hace scroll rápido
                        offset: 0.55,
                        debug: false
                    })
                    .onStepEnter(sres => {
                        // Marcar activo y cambiar tipo; mostrar la gráfica al entrar a cualquier substep
                        sres.element.classList.add('is-active');
                        const type = sres.element && sres.element.getAttribute('data-chart');
                        if (type && window.populationChart && typeof window.populationChart.setDataType === 'function') {
                            window.populationChart.setDataType(type);
                        }
                        const step4 = document.querySelector('section[data-step="4"]');
                        showPopulationChart(step4);
                    })
                    .onStepExit(sres => {
                        // Ocultar al salir del primer substep hacia arriba o del último hacia abajo
                        const subs = Array.from(document.querySelectorAll('.step[data-step="4"] .substep'));
                        const idx = subs.indexOf(sres.element);
                        const lastIdx = subs.length - 1;
                        const step4 = document.querySelector('section[data-step="4"]');
                        sres.element.classList.remove('is-active');
                        if ((idx === 0 && sres.direction === 'up') || (idx === lastIdx && sres.direction === 'down')) {
                            hidePopulationChart(step4);
                        }
                    });
            } catch (e) {
                console.warn('No se pudo inicializar subScroller para substeps del Step 4:', e);
            }
        }
    }

    // Función para activar visualizaciones según el paso actual
    function activateStepVisuals(stepIndex) {
        
        // Obtener el elemento del paso actual
        const currentStepElement = document.querySelector(`section[data-step="${stepIndex+1}"]`);
        if (!currentStepElement) {
            console.error(`No se encontró el elemento para step ${stepIndex+1}`);
            return;
        }
        
        // Detectar si este paso tiene un mapa
        const hasMap = currentStepElement.getAttribute('data-map') === 'true';
        
        if (hasMap) {

            // Solo permitir leyendas en steps 19 y 23; ocultar por defecto
            try {
                const legend = document.getElementById('map-legend');
                if (legend) legend.style.display = 'none';
                const panel = document.getElementById('map-lustro-control');
                if (panel) panel.style.display = 'none';
            } catch {}
            
            // Forzar la restauración del estado del mapa (importante para cuando se oculta con el botón naranja)
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                mapContainer.style.display = 'block';
                mapContainer.style.opacity = '1';
                mapContainer.style.visibility = 'visible';
                mapContainer.style.zIndex = '1000';
                mapContainer.classList.add('active');
            } else {
                console.error('❌ No se encontró el contenedor #map');
            }
            
            // Configuración para mostrar el mapa (no bloqueamos el scroll del body)
            document.body.classList.add('showing-map');
            document.body.style.overflow = 'auto';
            
            // Extraer la capa y vista del mapa de los atributos data
            const mapLayer = currentStepElement.getAttribute('data-map-layer');
            const mapView = currentStepElement.getAttribute('data-map-view');
            
            // Activar el mapa Mapbox con la configuración adecuada
            if (window.mapboxHelper && typeof window.mapboxHelper.updateMapForStep === 'function') {
                window.mapboxHelper.updateMapForStep(stepIndex+1);
            } else {
                console.error('❌ No se encontró window.mapboxHelper.updateMapForStep');
            }
            
            // Mostrar el botón de emergencia para cerrar el mapa
            const emergencyBtn = document.getElementById('emergency-close-btn');
            if (emergencyBtn) {
                emergencyBtn.style.display = 'flex';
            }
            
            // Sin mapas embebidos: no realizar acciones adicionales
        } else {
            // Restaurar el scroll normal del body si no estamos en un step con mapa
            document.body.style.overflow = 'auto';
            document.body.classList.remove('showing-map');
            
            // Ocultar el botón de emergencia
            const emergencyBtn = document.getElementById('emergency-close-btn');
            if (emergencyBtn) {
                emergencyBtn.style.display = 'none';
            }
            
            // NUEVO: Para steps sin mapa, ocultar leyenda y panel de lustros por seguridad
            const legend = document.getElementById('map-legend');
            if (legend) legend.style.display = 'none';
            const panel = document.getElementById('map-lustro-control');
            if (panel) panel.style.display = 'none';
            
            // Si no estamos en steps de evolución urbana (6-16), ocultar contenedor de evolución
            if (!(stepIndex >= 6 && stepIndex <= 16)) {
                // Ocultar el contenedor de fondo para evolución urbana si no estamos en un step de evolución
                const evolutionBg = document.getElementById('urban-evolution-background');
                if (evolutionBg) {
                    evolutionBg.style.display = 'none';
                    evolutionBg.style.visibility = 'hidden';
                    evolutionBg.style.opacity = '0';
                    
                    // Ocultar todas las imágenes de evolución urbana
                    document.querySelectorAll('.urban-bg-image').forEach(img => {
                        img.classList.remove('active');
                        img.style.opacity = '0';
                        img.style.visibility = 'hidden';
                    });
                }
            } else {
                // Es un step de evolución urbana
                const evolutionBg = document.getElementById('urban-evolution-background');
                if (evolutionBg) {
                    evolutionBg.style.display = 'block';
                    evolutionBg.style.visibility = 'visible';
                    evolutionBg.style.opacity = '1';
                }
                handleUrbanEvolutionStep(stepIndex);
            }

            // Serie de pérdida forestal (steps 21–23 => índices 20–22)
            if (stepIndex >= 20 && stepIndex <= 22) {
                const forestBg = document.getElementById('forest-loss-background');
                if (forestBg) {
                    forestBg.style.display = 'block';
                    forestBg.style.visibility = 'visible';
                    forestBg.style.opacity = '1';
                }
                handleForestLossStep(stepIndex);
            } else {
                const forestBg = document.getElementById('forest-loss-background');
                if (forestBg) {
                    forestBg.style.display = 'none';
                    forestBg.style.visibility = 'hidden';
                    forestBg.style.opacity = '0';
                    document.querySelectorAll('.forest-bg-frame').forEach(frame => {
                        frame.classList.remove('active');
                        frame.style.opacity = '0';
                        frame.style.visibility = 'hidden';
                        frame.style.display = 'none';
                    });
                }
            }
        }
        
        // Elementos fijos del `step 2`
        const fixedBehindEls = document.querySelectorAll('section[data-step="2"] .fixed-behind');
        if (stepIndex === 1) {
            fixedBehindEls.forEach(el => {
                el.style.display = '';
                el.style.opacity = '';
                el.style.visibility = '';
                el.style.pointerEvents = 'none';
            });
        } else {
            fixedBehindEls.forEach(el => {
                el.style.opacity = '0';
                el.style.visibility = 'hidden';
                el.style.display = 'none';
                el.style.pointerEvents = 'none';
            });
        }

        // Ajustar la visibilidad del mapa base según el paso
        const mapElem = document.getElementById('map');
        if (!mapElem) return;
        
        // El mapa solo se muestra cuando un step con data-map="true" está activo. En otros pasos se oculta.
        mapElem.style.opacity = hasMap ? '1' : '0';
        mapElem.style.visibility = hasMap ? 'visible' : 'hidden';
        mapElem.style.display = hasMap ? 'block' : 'none';
    }

    // Helpers para animación typing en step 1
    function clearTypingStep1(element) {
        if (!element) return;
        try {
            const timers = element._typingTimers || [];
            timers.forEach(t => {
                try { clearTimeout(t); } catch(e){}
                try { clearInterval(t); } catch(e){}
            });
            element._typingTimers = [];
            // Restaurar texto completo y quitar clases e inline styles de las líneas
            const allLines = element.querySelectorAll('.line, .sline');
            allLines.forEach(ln => {
                if (ln.dataset && ln.dataset.fulltext) ln.textContent = ln.dataset.fulltext;
                ln.classList.remove('reveal');
                ln.classList.remove('typing');
                ln.style.animation = '';
            });
        } catch (e) { console.warn('Error clearing typing timers:', e); }
    }

    // Calcula la velocidad de typing dinámicamente basada en el tamaño de pantalla actual
    function calculateTypingSpeed() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // En pantallas pequeñas, escribir más rápido
        if (width <= 375) return 35;      // Dispositivos muy pequeños
        if (width <= 480) return 40;      // Móviles pequeños
        if (width <= 768) return 45;      // Móviles grandes / tablets pequeños
        if (width <= 1024) return 50;     // Tablets
        if (width <= 1200) return 55;     // Escritorio pequeño
        return 60;                         // Escritorio grande
    }

    // Inicia la animación typing en el elemento del step 1 (secuencial, cancelable)
    function startTypingStep1(element) {
        if (!element) return;
        try {
            // limpiar cualquier animación previa
            clearTypingStep1(element);

            const isMobile = window.matchMedia('(max-width: 767px)').matches;
            const lines = isMobile
                ? Array.from(element.querySelectorAll('.title-sm .sline'))
                : Array.from(element.querySelectorAll('.title-lg .line'));

            // Guardar texto original en data-fulltext y vaciar el contenido para escribir desde cero
            lines.forEach(ln => {
                const full = (ln.textContent || '').trim();
                ln.dataset.fulltext = full;
                ln.textContent = '';
            });

            // Si por alguna razón las líneas vienen vacías, restaurar inmediatamente
            const hasAnyText = lines.some(ln => (ln.dataset && ln.dataset.fulltext && ln.dataset.fulltext.length));
            if (!hasAnyText) {
                console.warn('startTypingStep1: no se detectó texto en las líneas, restaurando por seguridad');
                lines.forEach(ln => { if (ln.dataset && ln.dataset.fulltext) ln.textContent = ln.dataset.fulltext; });
                return;
            }

            // Calcular velocidad dinámicamente
            const perCharMs = calculateTypingSpeed();

            element._typingTimers = [];

            const typeLine = (ln, fullText, speed) => {
                return new Promise(resolve => {
                    ln.classList.add('typing');
                    let i = 0;
                    const intervalId = setInterval(() => {
                        i += 1;
                        ln.textContent = fullText.slice(0, i);
                        if (i >= fullText.length) {
                            clearInterval(intervalId);
                            setTimeout(() => {
                                ln.classList.remove('typing');
                            }, 80);
                            resolve();
                        }
                    }, speed);
                    element._typingTimers.push(intervalId);
                });
            };

            // ejecutar secuencialmente
            (async () => {
                for (let idx = 0; idx < lines.length; idx++) {
                    const ln = lines[idx];
                    const full = ln.dataset.fulltext || '';
                    // Pequeño delay entre líneas
                    if (idx > 0) await new Promise(r => {
                        const t = setTimeout(r, 200);
                        element._typingTimers.push(t);
                    });
                    await typeLine(ln, full, perCharMs);
                }
            })();
        } catch (e) {
            console.warn('Error en startTypingStep1:', e);
        }
    }

    // Función para ocultar visualizaciones del mapa
    function hideMapVisuals() {
        
        // Eliminar la clase del body
        document.body.classList.remove('showing-map');
        
        // Restaurar scroll inmediatamente
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        
        // Ocultar el botón de emergencia si existe
        const emergencyBtn = document.getElementById('emergency-close-btn');
        if (emergencyBtn) {
            emergencyBtn.style.display = 'none';
        }
        
        // Ocultar mapbox usando la función helper
        if (window.mapboxHelper && typeof window.mapboxHelper.hideMapOverlay === 'function') {
            window.mapboxHelper.hideMapOverlay();
        }
        
        // No hay mapas embebidos que ocultar
        
        // Ocultar también el mapa de fondo si está visible
        const backgroundMap = document.getElementById('map');
        if (backgroundMap) {
            backgroundMap.style.display = 'none';
            backgroundMap.style.opacity = '0';
            backgroundMap.style.visibility = 'hidden';
        }
        
        // Método adicional de emergencia con verificación extra
        setTimeout(() => {
            // Verificar si #map está visible
            document.querySelectorAll('#map').forEach(container => {
                if (container && (
                    window.getComputedStyle(container).display !== 'none' ||
                    window.getComputedStyle(container).opacity > 0 ||
                    window.getComputedStyle(container).visibility === 'visible'
                )) {                    
                    // Forzar ocultación
                    container.style.display = 'none';
                    container.style.opacity = '0';
                    container.style.visibility = 'hidden';
                    container.style.zIndex = '-9999';
                }
            });
        }, 500); // Verificación final después de medio segundo
    }
    
    // Función para inicializar las imágenes de evolución urbana
    function initUrbanEvolutionImages() {        
        // Años disponibles para la evolución urbana
        const years = [1975, 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025];
        
        // Crear elementos para cada año
        const container = document.getElementById('urban-evolution-background');
        
        if (container) {
            // Asegurarnos de que el contenedor comienza oculto
            container.style.display = 'none';
            container.style.visibility = 'hidden';
            container.style.opacity = '0';
            
            // Limpiar cualquier contenido previo
            container.innerHTML = '';
            
        years.forEach(year => {
            const img = document.createElement('img');
            // No cargar aún: usar data-src y cargar bajo demanda por step
            img.setAttribute('data-src', `assets/${year}.jpg`);
                img.className = 'urban-bg-image';
                img.id = `urban-bg-${year}`;
                img.alt = `Cancún ${year}`;
                img.style.position = 'absolute';
                img.style.top = '0';
                img.style.left = '0';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.opacity = '0';
                img.style.visibility = 'hidden';
                img.style.display = 'none'; // Añadido para garantizar que estén ocultas
                img.style.transition = 'opacity 0.8s ease-in-out, visibility 0.8s ease-in-out';
                
                container.appendChild(img);
            });
        } else {
            console.error('No se encontró el contenedor para imágenes de evolución urbana');
        }
        
    }
    
    // Inicializar la serie de pérdida de cobertura forestal
    function initForestLossImages() {
        const years = [2000, 2010, 2020];
        const container = document.getElementById('forest-loss-background');

        container.style.display = 'none';
        container.style.visibility = 'hidden';
        container.style.opacity = '0';
        container.innerHTML = '';

        years.forEach(year => {
            const frame = document.createElement('div');
            frame.className = 'forest-bg-frame';
            frame.id = `forest-frame-${year}`;
            frame.style.position = 'absolute';
            frame.style.inset = '0';
            frame.style.opacity = '0';
            frame.style.visibility = 'hidden';
            frame.style.display = 'none';
            frame.style.zIndex = '1';
            frame.style.transition = 'opacity 0.8s ease-in-out, visibility 0.8s ease-in-out';

            const blur = document.createElement('div');
            blur.className = 'forest-blur-layer';
            blur.style.position = 'absolute';
            blur.style.inset = '0';
            blur.style.backgroundSize = 'cover';
            blur.style.backgroundPosition = 'center';
            blur.style.filter = 'blur(20px) brightness(0.9)';
            blur.style.transform = 'scale(1.05)';
            blur.style.willChange = 'transform, filter';
            blur.setAttribute('data-bg', `assets/perdida-forestal-${year}.jpeg`);

            const img = document.createElement('img');
            img.className = 'forest-main-image';
            img.setAttribute('data-src', `assets/perdida-forestal-${year}.jpeg`);
            img.alt = `Pérdida de cobertura forestal ${year}`;
            img.style.position = 'absolute';
            img.style.top = '50%';
            img.style.left = '50%';
            img.style.transform = 'translate(-50%, -50%)';
            img.style.height = '100vh';
            img.style.maxHeight = '100vh';
            img.style.width = 'auto';
            img.style.maxWidth = '90vw';
            img.style.objectFit = 'contain';
            img.style.borderRadius = '12px';
            img.style.boxShadow = '0 16px 40px rgba(0,0,0,0.35)';
            img.style.opacity = '1';

            frame.appendChild(blur);
            frame.appendChild(img);
            container.appendChild(frame);
        });
    }

    function handleForestLossStep(stepIndex) {
        const map = {20: 2000, 21: 2010, 22: 2020};
        const year = map[stepIndex];
        if (!year) return;


        const activeFrames = Array.from(document.querySelectorAll('.forest-bg-frame.active'));

        const frame = document.getElementById(`forest-frame-${year}`);
        if (frame) {
            // Elevar el nuevo por encima
            frame.style.zIndex = '2';
            const img = frame.querySelector('.forest-main-image');
            if (img && !img.getAttribute('src')) {
                const src = img.getAttribute('data-src');
                if (src) img.setAttribute('src', src);
            }
            const blur = frame.querySelector('.forest-blur-layer');
            if (blur && !blur.style.backgroundImage) {
                const bg = blur.getAttribute('data-bg');
                if (bg) blur.style.backgroundImage = `url('${bg}')`;
            }
            requestAnimationFrame(() => {
                frame.classList.add('active');
                frame.style.display = 'block';
                frame.style.visibility = 'visible';
                frame.style.opacity = '1';
            });

            // Preload siguiente
            const nextMap = {2000: 2010, 2010: 2020};
            const next = nextMap[year];
            if (next) {
                const nf = document.getElementById(`forest-frame-${next}`);
                if (nf) {
                    const nimg = nf.querySelector('.forest-main-image');
                    if (nimg && !nimg.getAttribute('src')) {
                        const nsrc = nimg.getAttribute('data-src');
                        if (nsrc) nimg.setAttribute('src', nsrc);
                    }
                    const nblur = nf.querySelector('.forest-blur-layer');
                    if (nblur && !nblur.style.backgroundImage) {
                        const nbg = nblur.getAttribute('data-bg');
                        if (nbg) nblur.style.backgroundImage = `url('${nbg}')`;
                    }
                }
            }

            // Desvanecer los anteriores y ocultarlos después de la transición
            activeFrames.forEach(prev => {
                if (prev === frame) return;
                prev.style.zIndex = '1';
                prev.style.opacity = '0';
                prev.style.visibility = 'hidden';
                setTimeout(() => {
                    prev.classList.remove('active');
                    prev.style.display = 'none';
                }, 700);
            });
        }
    }
    
    // Función para manejar los pasos específicos de evolución urbana
    function handleUrbanEvolutionStep(stepIndex) {
        // Mapeo de índices de pasos a años
        const stepYearMap = {
            6: 1975,
            7: 1980, 
            8: 1985,
            9: 1990,
            10: 1995,
            11: 2000,
            12: 2005,
            13: 2010,
            14: 2015,
            15: 2020,
            16: 2025
        };
        
        // Si no estamos en un step de evolución urbana, ocultar todo
        if (!Object.keys(stepYearMap).includes(String(stepIndex))) {
            document.querySelectorAll('.urban-bg-image').forEach(img => {
                img.classList.remove('active');
                img.style.opacity = '0';
                img.style.visibility = 'hidden';
            });
            return;
        }
        
        const targetYear = stepYearMap[stepIndex];
        
        // Ocultar todas las imágenes primero
        document.querySelectorAll('.urban-bg-image').forEach(img => {
            img.classList.remove('active');
            img.style.opacity = '0';
            img.style.visibility = 'hidden';
        });
        
        // Mostrar la imagen correspondiente al año actual
        const targetImage = document.getElementById(`urban-bg-${targetYear}`);
        if (targetImage) {
            // Cargar la imagen si aún no tiene src
            if (!targetImage.getAttribute('src')) {
                const src = targetImage.getAttribute('data-src');
                if (src) targetImage.setAttribute('src', src);
            }
            requestAnimationFrame(() => {
                targetImage.classList.add('active');
                targetImage.style.opacity = '1';
                targetImage.style.visibility = 'visible';
                targetImage.style.display = 'block'; // Asegurar que la imagen esté visible
            });
            // Pre-cargar la siguiente imagen para transición suave
            const nextMap = {1975:1980,1980:1985,1985:1990,1990:1995,1995:2000,2000:2005,2005:2010,2010:2015,2015:2020,2020:2025};
            const nextYear = nextMap[targetYear];
            if (nextYear) {
                const nextImg = document.getElementById(`urban-bg-${nextYear}`);
                if (nextImg && !nextImg.getAttribute('src')) {
                    const nsrc = nextImg.getAttribute('data-src');
                    if (nsrc) nextImg.setAttribute('src', nsrc);
                }
            }
        } else {
            console.error(`No se encontró la imagen para el año ${targetYear}`);
        }
    }

    // Hacer accesible globalmente la función hideMapVisuals
    window.hideMapVisuals = hideMapVisuals;

    // Inicialización
    function initComponents() {
        // Inicializar componentes sin depender del mapa de fondo
        initUrbanEvolutionImages();
        initForestLossImages();
        initScrollama();
        
        // Configurar evento para cuando Mapbox esté listo (desde mapbox-integration.js)
        document.addEventListener('mapbox-ready', function() {
            if (currentStep > 0) {
                activateStepVisuals(currentStep);
            }
        });
    }
    
    // Iniciar todo sin depender del mapa de fondo
    initComponents();
    // Si el step 1 ya está en el centro de la vista al cargar, arrancar typing inmediatamente
    try {
        const step1 = document.querySelector('section[data-step="1"]');
        if (step1) {
            const rect = step1.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;
            const centerY = vh * 0.5;
            if (rect.top <= centerY && rect.bottom >= centerY) {
                // Asegurar que la clase is-active está presente para que el CSS del caret funcione
                step1.classList.add('is-active');
                startTypingStep1(step1);
            }
        }
    } catch (e) { console.warn('Error comprobando step1 en carga inicial:', e); }
    
    // Manejar redimensionamiento de ventana
    window.addEventListener('resize', () => {
        scroller.resize();
        if (subScroller) {
            try { subScroller.resize(); } catch {}
        }
        // Recalcular posición vertical si el chart está pineado
        try {
            const step4 = document.querySelector('section[data-step="4"]');
            if (step4) {
                const chartCont = step4.querySelector('.chart-container');
                if (chartCont && chartCont.dataset.pinned === 'true') {
                    // Simular un unpin/pin rápido para recalcular top
                    unpinChart(step4);
                    pinChart(step4);
                }
            }
        } catch {}
    });
});