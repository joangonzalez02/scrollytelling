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
    
    // Eliminado: no se crea un segundo mapa. Se usa únicamente el mapa principal definido en mapbox-integration.js

    // Variables para Scrollama
    const scroller = scrollama();
    let currentStep = 0;

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

                // Animación popup para step 5 
                if (currentStep === 4) {
                    const step6 = response.element;
                    step6.classList.remove('animate-up', 'animate-down');
                    if (response.direction === 'down') {
                        step6.classList.add('animate-down');
                    } else {
                        step6.classList.add('animate-up');
                    }
                }

                // Animar charts al entrar a sus steps
                if (currentStep === 26 && window.vehicleChart && typeof window.vehicleChart.enter === 'function') {
                    // Nuevo Step 25 (index 24): parque vehicular
                    window.vehicleChart.enter();
                }
            })
            .onStepExit(response => {
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

                // Reset animación popup para step 5 al salir
                if (response.index === 4) {
                    const step6 = response.element;
                    step6.classList.remove('animate-up', 'animate-down');
                    const img6 = step6.querySelector('.floating-image');
                    if (img6) {
                        img6.style.opacity = '0';
                        img6.style.transform = 'scale(0.85) translateY(0)';
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
            });
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
    });
});