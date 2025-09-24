/**
 * Integración de Lizmap con Scrollama para scrollytelling
 * Este archivo extiende la funcionalidad existente de main.js
 */

// Variable global para el manager de Lizmap
let lizmapManager = null;

// Configuración de cuándo mostrar Lizmap en cada step
const lizmapStepsConfig = {
    // Steps donde Lizmap debe estar visible
    visibleSteps: [9, 11, 13, 15, 17, 19, 21], // Step 7 eliminado
    
    // Steps donde debe cambiar automáticamente
    autoChangeSteps: [9, 11, 13, 15, 17, 19], // Step 7 eliminado
    
    // Configuración de botones para mostrar Lizmap manualmente
    manualButtons: {
        6: "Ver crecimiento demográfico",
        8: "Ver expansión territorial", 
        10: "Ver distribución poblacional",
        12: "Ver impacto ambiental",
        14: "Ver desigualdad territorial",
        16: "Ver infraestructura vial",
        18: "Ver equipamiento urbano"
    }
};

// Inicializar el sistema Lizmap cuando se carga la página
function initializeLizmap() {
    console.log('=== Inicializando Lizmap ===');
    
    // Verificar que los archivos necesarios estén cargados
    if (typeof LizmapScrollytellingManager === 'undefined') {
        console.error('ERROR: LizmapScrollytellingManager no está disponible');
        console.log('Scripts cargados:', document.querySelectorAll('script[src]'));
        return;
    }
    
    if (typeof lizmapLayerConfig === 'undefined') {
        console.error('ERROR: lizmapLayerConfig no está disponible');
        return;
    }
    
    try {
        // Crear el manager
        lizmapManager = new LizmapScrollytellingManager();
        console.log('LizmapScrollytellingManager creado exitosamente');
        console.log('Manager:', lizmapManager);
        
        console.log('=== Sistema Lizmap inicializado correctamente ===');
    } catch (error) {
        console.error('ERROR creando LizmapScrollytellingManager:', error);
    }
}

// Función para agregar botones de Lizmap a los steps
function addLizmapButtonsToSteps() {
    Object.keys(lizmapStepsConfig.manualButtons).forEach(stepIndex => {
        const step = document.querySelector(`.step[data-step="${stepIndex}"]`);
        if (step) {
            const stepContent = step.querySelector('.step-content');
            if (stepContent) {
                // Crear botón
                const button = document.createElement('button');
                button.className = 'lizmap-trigger-btn';
                button.textContent = lizmapStepsConfig.manualButtons[stepIndex];
                button.onclick = () => {
                    if (lizmapManager) {
                        lizmapManager.showForStep(parseInt(stepIndex));
                    }
                };
                
                // Agregar estilos al botón
                button.style.cssText = `
                    background: #4264fb;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-top: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                `;
                
                button.addEventListener('mouseenter', () => {
                    button.style.background = '#3651e6';
                    button.style.transform = 'translateY(-2px)';
                    button.style.boxShadow = '0 4px 12px rgba(66, 100, 251, 0.4)';
                });
                
                button.addEventListener('mouseleave', () => {
                    button.style.background = '#4264fb';
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = 'none';
                });
                
                stepContent.appendChild(button);
            }
        }
    });
}

// Extender la función enhancedHandleStepEnter existente
function setupLizmapScrollamaIntegration() {
    // Guardar la función original
    const originalEnhancedHandleStepEnter = window.enhancedHandleStepEnter;
    
    if (!originalEnhancedHandleStepEnter) {
        console.warn('enhancedHandleStepEnter no encontrada, creando nueva función');
        return;
    }
    
    // Crear nueva función que incluye lógica de Lizmap
    window.enhancedHandleStepEnter = function(response) {
        // Ejecutar la lógica original primero
        originalEnhancedHandleStepEnter(response);
        
        // Agregar lógica de Lizmap
        handleLizmapStepChange(response);
    };
}

// Manejar cambios de step para Lizmap con transiciones automáticas
function handleLizmapStepChange(response) {
    if (!lizmapManager) return;
    
    const stepIndex = response.index;
    const isVisible = lizmapStepsConfig.visibleSteps.includes(stepIndex);
    const shouldAutoChange = lizmapStepsConfig.autoChangeSteps.includes(stepIndex);
    
    console.log(`Cambio de step a ${stepIndex}, visible: ${isVisible}, autoChange: ${shouldAutoChange}`);
    
    // Controlar la transición de telón del contenedor de Lizmap
    const lizmapContainer = document.getElementById('lizmap-scrolly-container');
    if (lizmapContainer) {
        if (isVisible) {
            lizmapContainer.classList.remove('curtain-down');
            lizmapContainer.classList.add('curtain-up');
        } else {
            lizmapContainer.classList.remove('curtain-up');
            lizmapContainer.classList.add('curtain-down');
        }
    }
    
    // Si el step actual debe mostrar Lizmap automáticamente
    if (shouldAutoChange) {
        setTimeout(() => {
            lizmapManager.showForStep(stepIndex);
        }, 300); // Delay para sincronizar con la animación del telón
    }
    // Si Lizmap está visible pero el step actual no debe mostrarlo, ocultarlo
    else if (lizmapManager.isVisible && !isVisible) {
        setTimeout(() => {
            lizmapManager.hide();
        }, 100);
    }
    // Si Lizmap está visible y el step cambia dentro de los steps visibles
    else if (lizmapManager.isVisible && isVisible) {
        setTimeout(() => {
            lizmapManager.changeToStep(stepIndex);
        }, 300);
    }
}

// Función para manejar transiciones de mapa automáticas
function handleMapTransitions(stepIndex, isVisible) {
    // Las transiciones del mapa base de Mapbox se manejan desde index_fixed.html
    // Esta función se mantiene para compatibilidad pero las transiciones de Lizmap
    // ahora se manejan directamente en el LizmapScrollytellingManager
    console.log(`Transición de mapa para step ${stepIndex}, visible: ${isVisible}`);
}

// Función auxiliar para obtener el step actual de Scrollama
function getCurrentScrollamaStep() {
    // Buscar el step actualmente visible
    const activeStep = document.querySelector('.step.is-active');
    if (activeStep) {
        return parseInt(activeStep.getAttribute('data-step'));
    }
    return 0; // Default al primer step
}

// Función principal de inicialización
function initializeLizmapScrollytelling() {
    console.log('=== Iniciando inicialización de Lizmap ===');
    console.log('Estado del DOM:', document.readyState);
    
    // Agregar event listener global para prevenir scroll en Lizmap
    document.addEventListener('wheel', (e) => {
        const lizmapContainer = document.getElementById('lizmap-scrolly-container');
        if (lizmapContainer && lizmapContainer.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Scroll bloqueado en contenedor Lizmap');
        }
    }, { passive: false });
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        console.log('DOM aún cargando, esperando...');
        document.addEventListener('DOMContentLoaded', initializeLizmapScrollytelling);
        return;
    }
    
    // Esperar un poco más para asegurar que todo esté cargado
    setTimeout(() => {
        try {
            console.log('Verificando dependencias...');
            console.log('LizmapScrollytellingManager disponible:', typeof LizmapScrollytellingManager !== 'undefined');
            console.log('lizmapLayerConfig disponible:', typeof lizmapLayerConfig !== 'undefined');
            
            // Inicializar sistema Lizmap
            initializeLizmap();
            
            // Sistema completamente automático - no se necesitan botones manuales
            
            // Configurar integración con Scrollama
            setupLizmapScrollamaIntegration();
            
            // Inicializar estado del mapa (oculto por defecto)
            handleMapTransitions(0, false);
            
            console.log('=== Integración Lizmap-Scrollama completada ===');
            console.log('lizmapManager creado:', lizmapManager !== null);
            
        } catch (error) {
            console.error('=== Error inicializando Lizmap scrollytelling ===', error);
        }
    }, 1000);
}

// Auto-inicializar cuando se carga el script
initializeLizmapScrollytelling();

// Exportar funciones útiles para el sistema automático
if (typeof window !== 'undefined') {
    window.lizmapScrollytellingIntegration = {
        manager: () => lizmapManager,
        showStep: (stepIndex) => {
            console.log(`=== showStep llamado para step ${stepIndex} ===`);
            console.log('lizmapManager disponible:', lizmapManager !== null);
            if (lizmapManager) {
                console.log('Ejecutando handleMapTransitions...');
                handleMapTransitions(stepIndex, true);
                console.log('Ejecutando lizmapManager.showForStep...');
                setTimeout(() => {
                    try {
                        lizmapManager.showForStep(stepIndex);
                        console.log(`Step ${stepIndex} mostrado exitosamente`);
                    } catch (error) {
                        console.error(`Error mostrando step ${stepIndex}:`, error);
                    }
                }, 200);
            } else {
                console.error('ERROR: lizmapManager no está disponible para showStep');
            }
        },
        hide: () => {
            console.log('=== hide llamado ===');
            console.log('lizmapManager disponible:', lizmapManager !== null);
            if (lizmapManager) {
                handleMapTransitions(0, false);
                lizmapManager.hide();
                console.log('Lizmap ocultado exitosamente');
            } else {
                console.error('ERROR: lizmapManager no está disponible para hide');
            }
        },
        getCurrentStep: getCurrentScrollamaStep
    };
    
    console.log('=== window.lizmapScrollytellingIntegration exportado ===');
}