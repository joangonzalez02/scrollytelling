// Script principal para la integración de Scrollama con las visualizaciones
document.addEventListener('DOMContentLoaded', function() {
    // Configuración del mapa base
    mapboxgl.accessToken = 'pk.eyJ1IjoibWVsbm90dGUiLCJhIjoiY21mNzhsc3FmMGtieTJrcTFtZ2FsZmNjMCJ9.z321w5lq62mb-7OQ4T8C0g';
    
    const mapboxMap = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-86.85, 21.05],
        zoom: 11
    });

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
                // Manejo de progreso de pasos para animaciones
                handleStepProgress(response.index, response.progress);
            })
            .onStepEnter(response => {
                currentStep = response.index;
                console.log('Entrando al step:', currentStep);
                
                // Activar elementos visuales específicos para cada paso
                activateStepVisuals(currentStep);
                
                // Agregar clase activa al paso actual
                document.querySelectorAll('.step').forEach(el => {
                    el.classList.remove('is-active');
                });
                response.element.classList.add('is-active');
                
                // Debug: imprimir información del step actual
                console.log('Step activo:', currentStep, 'elemento:', response.element.classList.toString());
            })
            .onStepExit(response => {
                console.log('Saliendo del step:', response.index);
                response.element.classList.remove('is-active');
                
                // Si salimos del último step de evolución urbana, ocultar las imágenes de fondo
                if (response.index === 17) { // Solo al salir del último step (2025)
                    setTimeout(() => {
                        document.querySelectorAll('.urban-bg-image').forEach(img => {
                            img.classList.remove('active');
                        });
                    }, 200); // Pequeño delay para transición suave
                }
                
                // Verificar si el step que estamos abandonando tenía un mapa
                const exitingElement = response.element;
                if (exitingElement && exitingElement.getAttribute('data-map') === 'true') {
                    console.log('Saliendo de un step con mapa, ocultando Lizmap');
                    hideMapVisuals(); // Función específica para ocultar elementos del mapa
                }
            });
    }

    // Función para manejar la progresión de los pasos
    function handleStepProgress(stepIndex, progress) {
        // Las imágenes de evolución urbana ahora se muestran automáticamente con scrollama
        // No necesitamos lógica especial aquí
    }
    

    
    // Activar elementos visuales específicos para cada paso
    function activateStepVisuals(stepIndex) {
        // Desactivar todos los visuales primero
        hideAllVisuals();
        
        // Obtener el elemento del paso actual
        const currentStepElement = document.querySelectorAll('.step')[stepIndex];
        
        // Verificar si el paso actual tiene un mapa asociado
        if (currentStepElement && currentStepElement.getAttribute('data-map') === 'true') {
            console.log('Activando mapa para el paso:', stepIndex);
            
            // Añadir clase al body para manejar estilos específicos de mapas
            document.body.classList.add('showing-map');
            
            // Extraer la capa y vista del mapa de los atributos data
            const mapLayer = currentStepElement.getAttribute('data-map-layer');
            const mapView = currentStepElement.getAttribute('data-map-view');
            
            // Activar el mapa Lizmap con la configuración adecuada
            if (window.LizmapScrollyManager) {
                console.log(`Mostrando mapa con capa ${mapLayer} y vista ${mapView}`);
                window.LizmapScrollyManager.showMap(mapLayer, mapView);
            } else if (lizmapManager) {
                console.log(`Usando lizmapManager directo con capa ${mapLayer} y vista ${mapView}`);
                lizmapManager.showMap(mapLayer, mapView);
            } else {
                console.error('No se encontró ningún gestor de Lizmap disponible');
            }
            
            // Asegurarnos de que el contenedor Lizmap sea visible
            const lizmapContainer = document.querySelector('.lizmap-scrolly-container');
            if (lizmapContainer) {
                // Primero establecer los estilos básicos
                lizmapContainer.style.zIndex = '2';
                lizmapContainer.style.display = 'block';
                
                // Luego aplicar las clases de animación
                setTimeout(() => {
                    lizmapContainer.classList.remove('curtain-down');
                    lizmapContainer.classList.add('curtain-up');
                    lizmapContainer.style.opacity = '1';
                    lizmapContainer.style.visibility = 'visible';
                    console.log('Contenedor Lizmap activado');
                }, 10);
            } else {
                console.error('No se encontró el contenedor Lizmap');
            }
        } else if (stepIndex >= 7 && stepIndex <= 17) { // Steps de evolución urbana (1975-2025)
            handleUrbanEvolutionStep(stepIndex);
        } else if (stepIndex === 26) { // Gráfico de parque vehicular (step 27, índice 26)
            console.log('Activando gráfico de vehículos para el paso 27');
            if (window.initVehicleChart) {
                window.initVehicleChart();
            } else {
                console.error('Función initVehicleChart no encontrada');
            }
        } else {
            // Para otros pasos, mostrar el mapa base si es necesario
            // o simplemente mantener el contenido de texto
            console.log('Paso sin mapa específico:', stepIndex);
        }
    }
    
    // Ocultar todos los elementos visuales
    function hideAllVisuals() {
        // Función para ocultar elementos visuales cuando cambiamos de sección
        document.getElementById('map').style.opacity = 0;
        document.getElementById('map').style.visibility = 'hidden';
        
        // Ocultar el contenedor Lizmap
        hideMapVisuals();
        
        // Detener cualquier animación de evolución urbana
        if (window.urbanEvolution && window.urbanEvolution.reset) {
            window.urbanEvolution.reset();
        }
    }
    
    // Función específica para ocultar el mapa Lizmap - versión mejorada
    function hideMapVisuals() {
        console.log('Ejecutando hideMapVisuals - versión mejorada');
        
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
        
        const lizmapContainer = document.querySelector('.lizmap-scrolly-container');
        if (lizmapContainer) {
            console.log('Ocultando contenedor Lizmap');
            
            // PASO 0: Detener cualquier transición en curso
            lizmapContainer.style.transition = 'none';
            
            // PASO 1: Aplicar cierre inmediato con máxima prioridad usando !important
            lizmapContainer.style.cssText = `
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
                z-index: -9999 !important;
                transform: translateY(100%) !important;
                transition: none !important;
            `;
            
            // PASO 2: Aplicar clases para consistencia
            lizmapContainer.classList.remove('curtain-up');
            lizmapContainer.classList.add('curtain-down');
            
            // PASO 3: Forzar repintado del DOM
            void lizmapContainer.offsetHeight;
            
            // PASO 4: Detener iframe
            const iframe = lizmapContainer.querySelector('iframe');
            if (iframe) {
                try {
                    iframe.src = 'about:blank';
                    iframe.style.cssText = 'display: none !important; width: 0 !important; height: 0 !important;';
                } catch(e) {
                    console.error('Error al limpiar iframe:', e);
                }
            }
            
            console.log('Contenedor Lizmap ocultado inmediatamente con máxima prioridad');
            
            // PASO 5: Si hay gestores de Lizmap disponibles, usar sus métodos de cierre
            setTimeout(() => {
                // Restaurar transición después de aplicar cambios inmediatos
                lizmapContainer.style.transition = '';
                
                // Intentar todos los métodos de cierre disponibles
                if (window.LizmapScrollyManager && typeof window.LizmapScrollyManager.forceHide === 'function') {
                    try {
                        window.LizmapScrollyManager.forceHide();
                    } catch(e) {
                        console.error('Error al llamar a LizmapScrollyManager.forceHide():', e);
                    }
                } 
                
                if (window.lizmapManager && typeof window.lizmapManager.forceHide === 'function') {
                    try {
                        window.lizmapManager.forceHide();
                    } catch(e) {
                        console.error('Error al llamar a lizmapManager.forceHide():', e);
                    }
                }
            }, 10); // Tiempo muy corto para ejecución casi inmediata
        } else {
            console.warn('No se encontró el contenedor Lizmap para ocultar');
        }
        
        // Método adicional de emergencia con verificación extra
        setTimeout(() => {
            // Verificar múltiples condiciones para detectar si el mapa sigue visible de algún modo
            const container = document.querySelector('.lizmap-scrolly-container');
            if (container && (
                window.getComputedStyle(container).display !== 'none' ||
                window.getComputedStyle(container).opacity > 0 ||
                window.getComputedStyle(container).visibility === 'visible' ||
                parseInt(window.getComputedStyle(container).zIndex) > 0
            )) {
                console.log('¡EMERGENCIA FINAL! Mapa aún visible después de todos los intentos, aplicando medidas extremas');
                
                // Último recurso: alterar el DOM directamente
                try {
                    // Eliminar completamente el iframe para detener cualquier actividad
                    const iframe = container.querySelector('iframe');
                    if (iframe) iframe.remove();
                    
                    // Aplicar estilos extremos en el contenedor
                    container.style.cssText = `
                        display: none !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                        pointer-events: none !important;
                        z-index: -9999 !important;
                        position: absolute !important;
                        width: 0 !important;
                        height: 0 !important;
                        overflow: hidden !important;
                        clip: rect(0, 0, 0, 0) !important;
                        transform: translateY(-9999px) !important;
                    `;
                    
                    // Eliminar todas las clases y establecer solo la clase base
                    container.className = 'lizmap-scrolly-container';
                    
                    console.log('Medidas extremas de ocultación aplicadas');
                } catch(e) {
                    console.error('Error en medidas extremas:', e);
                }
            }
        }, 500); // Verificación final después de medio segundo
    }
    
    // Función para inicializar las imágenes de evolución urbana
    function initUrbanEvolutionImages() {
        console.log('Inicializando imágenes de evolución urbana');
        
        const container = document.getElementById('urban-evolution-background');
        if (!container) {
            console.error('No se encontró el contenedor urban-evolution-background');
            return;
        }
        
        // Limpiar el contenedor
        container.innerHTML = '';
        
        // Crear imágenes de fondo para cada año
        const years = [1975, 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025];
        
        years.forEach((year, index) => {
            const bgDiv = document.createElement('div');
            bgDiv.className = 'urban-bg-image';
            bgDiv.setAttribute('data-year', year);
            bgDiv.style.backgroundImage = `url('assets/${year}.jpg')`;
            
            // Activar la primera imagen por defecto para evitar flash inicial
            if (index === 0) {
                bgDiv.classList.add('active');
                console.log(`Imagen inicial activada para ${year}`);
            }
            
            container.appendChild(bgDiv);
            console.log(`Imagen de fondo creada para ${year}`);
        });
    }

    // Función para manejar los steps de evolución urbana
    function handleUrbanEvolutionStep(stepIndex) {
        console.log('Step de evolución urbana activo:', stepIndex);
        
        // Mapeo de índices de step a años
        const yearsByStepIndex = {
            7: 1975,   // Step 8
            8: 1980,   // Step 9
            9: 1985,   // Step 10
            10: 1990,  // Step 11
            11: 1995,  // Step 12
            12: 2000,  // Step 13
            13: 2005,  // Step 14
            14: 2010,  // Step 15
            15: 2015,  // Step 16
            16: 2020,  // Step 17
            17: 2025   // Step 18
        };
        
        const targetYear = yearsByStepIndex[stepIndex];
        if (!targetYear) {
            console.log('No hay año mapeado para el step index:', stepIndex);
            return;
        }
        
        console.log(`Activando imagen del año: ${targetYear}`);
        
        // Activar la nueva imagen PRIMERO
        const targetImage = document.querySelector(`.urban-bg-image[data-year="${targetYear}"]`);
        if (targetImage) {
            targetImage.classList.add('active');
            console.log(`Imagen del año ${targetYear} activada`);
            
            // Esperar un frame antes de ocultar las otras imágenes para evitar flash
            requestAnimationFrame(() => {
                // Ocultar todas las otras imágenes de fondo
                document.querySelectorAll('.urban-bg-image').forEach(img => {
                    if (img !== targetImage) {
                        img.classList.remove('active');
                    }
                });
            });
        } else {
            console.error(`No se encontró la imagen para el año ${targetYear}`);
        }
    }

    // Hacer accesible globalmente la función hideMapVisuals
    window.hideMapVisuals = hideMapVisuals;

    // Inicialización
    mapboxMap.on('load', () => {
        mapboxMap.addControl(new mapboxgl.NavigationControl());
        
        // Inicializar Lizmap con mejor manejo de errores y verificaciones adicionales
        try {
            // Verificamos si existe la función inicializeLizmap (definida en lizmap-scrollama-integration.js)
            if (typeof initializeLizmap === 'function') {
                console.log('Inicializando Lizmap desde cancun-main.js...');
                
                // Verificar dependencias críticas primero
                if (typeof LizmapScrollytellingManager === 'undefined') {
                    console.error('ERROR: LizmapScrollytellingManager no está disponible, cargando script');
                    // Intentar cargar el script de nuevo si no está disponible
                    const script = document.createElement('script');
                    script.src = 'lizmap-manager.js';
                    script.onload = function() {
                        console.log('lizmap-manager.js recargado, intentando inicializar de nuevo');
                        if (typeof LizmapScrollytellingManager !== 'undefined') {
                            initializeLizmap();
                            window.LizmapScrollyManager = lizmapManager;
                        }
                    };
                    document.head.appendChild(script);
                } else {
                    // Si todo está bien, inicializar normalmente
                    initializeLizmap();
                    
                    // Guardar la referencia global para usarla en los pasos
                    window.LizmapScrollyManager = lizmapManager;
                    console.log('LizmapScrollyManager configurado:', window.LizmapScrollyManager);
                }
            } else {
                console.warn('No se encontró la función initializeLizmap, intentando cargar script');
                // Intentar cargar el script de integración si no está disponible
                const script = document.createElement('script');
                script.src = 'lizmap-scrollama-integration.js';
                script.onload = function() {
                    console.log('lizmap-scrollama-integration.js cargado, intentando inicializar');
                    if (typeof initializeLizmap === 'function') {
                        initializeLizmap();
                        window.LizmapScrollyManager = lizmapManager;
                    }
                };
                document.head.appendChild(script);
            }
        } catch (error) {
            console.error('Error al inicializar Lizmap:', error);
            // Intento de recuperación final
            setTimeout(() => {
                console.log('Intentando recuperación de Lizmap después de error...');
                if (typeof LizmapScrollytellingManager !== 'undefined') {
                    try {
                        lizmapManager = new LizmapScrollytellingManager();
                        window.LizmapScrollyManager = lizmapManager;
                        console.log('Recuperación de Lizmap exitosa');
                    } catch (e) {
                        console.error('Falló la recuperación de emergencia:', e);
                    }
                }
            }, 1000);
        }
        
        // Añadir evento para cerrar el mapa al hacer clic fuera de él
        document.addEventListener('click', (e) => {
            const lizmapContainer = document.querySelector('.lizmap-scrolly-container');
            
            // Si el mapa está visible y el clic fue fuera del mapa y fuera del botón de cerrar
            if (lizmapContainer && 
                !lizmapContainer.classList.contains('curtain-down') && 
                !e.target.closest('.lizmap-scrolly-iframe') &&
                !e.target.closest('.lizmap-close-btn') &&
                !e.target.closest('.step[data-map="true"]')) {
                console.log('Clic fuera del mapa, cerrando');
                hideMapVisuals();
            }
        });
        
        // Inicializar Scrollama
        initScrollama();
        
        // Inicializar imágenes de evolución urbana
        initUrbanEvolutionImages();
        
        // Inicializar evento para ajustar tamaño
        window.addEventListener('resize', () => {
            scroller.resize();
        });
    });
});