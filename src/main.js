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
        console.log('Inicializando Scrollama...');
        scroller
            .setup({
                step: '.step',
                offset: 0.5,
                progress: true,
                debug: false
            })
            .onStepProgress(response => {
                // Manejo de progreso de pasos para animaciones (opcional)
                // console.log('Progress step', response.index, response.progress);
            })
            .onStepEnter(response => {
                currentStep = response.index;
                console.log('Entrando al step:', currentStep);
                
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
                
                // Animación específica para step 29 (index 28)
                if (currentStep === 28) {
                    const step29 = response.element; // section[data-step="29"]
                    step29.classList.remove('animate-up', 'animate-down');
                    // direction: 'down' when entering while scrolling down; 'up' when entering while scrolling up
                    if (response.direction === 'down') {
                        step29.classList.add('animate-down');
                    } else {
                        step29.classList.add('animate-up');
                    }
                }

                // Animación popup para step 6 (index 5)
                if (currentStep === 5) {
                    const step6 = response.element; // section[data-step="6"]
                    step6.classList.remove('animate-up', 'animate-down');
                    if (response.direction === 'down') {
                        step6.classList.add('animate-down');
                    } else {
                        step6.classList.add('animate-up');
                    }
                }

                // Debug: imprimir información del step actual
                console.log('Step activo:', currentStep, 'elemento:', response.element.classList.toString());

                // Animar charts al entrar a sus steps
                if (currentStep === 26 && window.vehicleChart && typeof window.vehicleChart.enter === 'function') {
                    // Step 27 (index 26): parque vehicular
                    window.vehicleChart.enter();
                }
            })
            .onStepExit(response => {
                console.log('Saliendo del step:', response.index);
                response.element.classList.remove('is-active');
                response.element.classList.remove('active');

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

                // Reset animación popup para step 6 al salir
                if (response.index === 5) {
                    const step6 = response.element;
                    step6.classList.remove('animate-up', 'animate-down');
                    const img6 = step6.querySelector('.floating-image');
                    if (img6) {
                        img6.style.opacity = '0';
                        img6.style.transform = 'scale(0.85) translateY(0)';
                    }
                }
                
                // Al salir de steps con leyenda (4, 20, 24) forzar ocultado
                if (response.index === 3 || response.index === 19 || response.index === 23) {
                    console.log('Saliendo de step con leyenda (4/20/24), ocultando leyenda y panel de lustros');
                    try {
                        const legend = document.getElementById('map-legend');
                        if (legend) legend.style.display = 'none';
                        const panel = document.getElementById('map-lustro-control');
                        if (panel) panel.style.display = 'none';
                    } catch {}
                }
                
                // Si salimos de cualquier step de evolución urbana (7-17), ocultar las imágenes de fondo
                if (response.index >= 7 && response.index <= 17) {
                    // Si no estamos entrando a otro step de evolución urbana, ocultar todo
                    if (currentStep < 7 || currentStep > 17) {
                        setTimeout(() => {
                            console.log('Saliendo de steps de evolución urbana, ocultando imágenes');
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
                    console.log('Saliendo de un step con mapa, ocultando Mapbox');
                    hideMapVisuals(); // Función específica para ocultar elementos del mapa
                }

                // Si salimos del step del parque vehicular, ejecutar animación de salida
                if (response.index === 26 && window.vehicleChart && typeof window.vehicleChart.exit === 'function') {
                    window.vehicleChart.exit();
                }
            });
    }

    // Función para activar visualizaciones según el paso actual
    function activateStepVisuals(stepIndex) {
        console.log(`Activando visuales para step ${stepIndex}`);
        
        // Obtener el elemento del paso actual
        const currentStepElement = document.querySelector(`section[data-step="${stepIndex+1}"]`);
        if (!currentStepElement) {
            console.error(`No se encontró el elemento para step ${stepIndex+1}`);
            return;
        }
        
        // Detectar si este paso tiene un mapa
        const hasMap = currentStepElement.getAttribute('data-map') === 'true';
        
        if (hasMap) {
            console.log(`=== ACTIVANDO MAPA PARA STEP ${stepIndex+1} ===`);

            // Solo permitir leyendas en steps 4, 20, 24; ocultar por defecto
            try {
                const legend = document.getElementById('map-legend');
                if (legend) legend.style.display = 'none';
                const panel = document.getElementById('map-lustro-control');
                if (panel) panel.style.display = 'none';
            } catch {}
            
            // Forzar la restauración del estado del mapa (importante para cuando se oculta con el botón naranja)
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                console.log('🗺️ Forzando visibilidad del contenedor #map...');
                mapContainer.style.display = 'block';
                mapContainer.style.opacity = '1';
                mapContainer.style.visibility = 'visible';
                mapContainer.style.zIndex = '1000';
                mapContainer.classList.add('active');
                console.log('✅ Estilos aplicados a #map');
                console.log('Display:', mapContainer.style.display);
                console.log('Opacity:', mapContainer.style.opacity);
                console.log('Visibility:', mapContainer.style.visibility);
            } else {
                console.error('❌ No se encontró el contenedor #map');
            }
            
            // Configuración para mostrar el mapa (no bloqueamos el scroll del body)
            document.body.classList.add('showing-map');
            document.body.style.overflow = 'auto';
            
            // Extraer la capa y vista del mapa de los atributos data
            const mapLayer = currentStepElement.getAttribute('data-map-layer');
            const mapView = currentStepElement.getAttribute('data-map-view');
            console.log('📊 Datos del step:');
            console.log('- Map Layer:', mapLayer);
            console.log('- Map View:', mapView);
            
            // Activar el mapa Mapbox con la configuración adecuada
            if (window.mapboxHelper && typeof window.mapboxHelper.updateMapForStep === 'function') {
                console.log(`🚀 Llamando updateMapForStep(${stepIndex+1})...`);
                window.mapboxHelper.updateMapForStep(stepIndex+1);
            } else {
                console.error('❌ No se encontró window.mapboxHelper.updateMapForStep');
                console.log('window.mapboxHelper:', window.mapboxHelper);
            }
            
            // Mostrar el botón de emergencia para cerrar el mapa
            const emergencyBtn = document.getElementById('emergency-close-btn');
            if (emergencyBtn) {
                emergencyBtn.style.display = 'flex';
                console.log('✅ Botón de emergencia mostrado');
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
            
            // Si no estamos en steps de evolución urbana, ocultar contenedor de evolución
            if (!(stepIndex >= 7 && stepIndex <= 17)) {
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
        }
        
        if (stepIndex === 26) { // Gráfico de parque vehicular (step 27, índice 26)
            console.log('Activando gráfico de vehículos para el paso 27');
            if (window.initVehicleChart) {
                window.initVehicleChart();
            }
        } else if (stepIndex === 5) { // Step del gráfico de población (step 6, índice 5)
            console.log('Mostrando gráfico de población para el paso 6');
        }
        
        // Ajustar la visibilidad del mapa base según el paso
        const mapElem = document.getElementById('map');
        if (!mapElem) return;
        
        // El mapa solo se muestra cuando un step con data-map="true" está activo. En otros pasos se oculta.
        mapElem.style.opacity = hasMap ? '1' : '0';
        mapElem.style.visibility = hasMap ? 'visible' : 'hidden';
        mapElem.style.display = hasMap ? 'block' : 'none';
    }

    // Función para ocultar visualizaciones del mapa
    function hideMapVisuals() {
        console.log('Ejecutando hideMapVisuals - versión para Mapbox');
        
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
                    console.log('¡EMERGENCIA! Contenedor de mapa aún visible, aplicando medidas adicionales', container.id);
                    
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
        console.log('Inicializando imágenes de evolución urbana');
        
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
        
        console.log('Imágenes de evolución urbana inicializadas');
    }
    
    // Función para manejar los pasos específicos de evolución urbana
    function handleUrbanEvolutionStep(stepIndex) {
        // Mapeo de índices de pasos a años
        const stepYearMap = {
            7: 1975,
            8: 1980, 
            9: 1985,
            10: 1990,
            11: 1995,
            12: 2000,
            13: 2005,
            14: 2010,
            15: 2015,
            16: 2020,
            17: 2025
        };
        
        // Si no estamos en un step de evolución urbana, ocultar todo
        if (!Object.keys(stepYearMap).includes(String(stepIndex))) {
            console.log('No estamos en un step de evolución urbana, ocultando imágenes');
            document.querySelectorAll('.urban-bg-image').forEach(img => {
                img.classList.remove('active');
                img.style.opacity = '0';
                img.style.visibility = 'hidden';
            });
            return;
        }
        
        const targetYear = stepYearMap[stepIndex];
        console.log(`Activando evolución urbana para año ${targetYear}`);
        
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
                console.log(`Imagen de ${targetYear} activada`);
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
        initScrollama();
        
        // Configurar evento para cuando Mapbox esté listo (desde mapbox-integration.js)
        document.addEventListener('mapbox-ready', function() {
            console.log('Mapbox está listo, actualizando visuales para el step actual');
            if (currentStep > 0) {
                activateStepVisuals(currentStep);
            }
        });
    }
    
    // Iniciar todo sin depender del mapa de fondo
    initComponents();
    
    // Manejar redimensionamiento de ventana
    window.addEventListener('resize', () => {
        scroller.resize();
    });
});