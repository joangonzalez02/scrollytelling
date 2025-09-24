/**
 * Sistema de gestión de Lizmap embebido para scrollytelling
 * Permite reutilizar un contenedor iframe cambiando las capas según el step activo
 */

class LizmapScrollytellingManager {
    constructor(containerId = 'lizmap-scrolly-container') {
        console.log('=== Creando LizmapScrollytellingManager ===');
        this.containerId = containerId;
        this.container = null;
        this.iframe = null;
        this.currentStep = -1;
        this.isVisible = false;
        this.transitionDuration = 1200; // Duración de transiciones en ms (más lenta)
        
        console.log('Configuración inicial:', {
            containerId: this.containerId,
            transitionDuration: this.transitionDuration
        });
        
        this.init();
        console.log('=== LizmapScrollytellingManager creado ===');
    }
    
    // Inicializar el contenedor Lizmap
    init() {
        this.createContainer();
        this.addEventListeners();
        this.initializeAsHidden();
    }
    
    // Crear el contenedor HTML
    createContainer() {
        // Eliminar contenedor existente si existe
        const existing = document.getElementById(this.containerId);
        if (existing) {
            existing.remove();
        }
        
        // Crear nuevo contenedor
        this.container = document.createElement('div');
        this.container.id = this.containerId;
        this.container.className = 'lizmap-scrolly-container';
        
        // Crear iframe
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'lizmap-scrolly-iframe';
        this.iframe.setAttribute('allowfullscreen', '');
        this.iframe.setAttribute('loading', 'lazy');
        this.iframe.setAttribute('allow', 'fullscreen; geolocation; microphone; camera');
        this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock');
        this.iframe.style.pointerEvents = 'auto';
        this.iframe.style.userSelect = 'auto';
        this.iframe.style.touchAction = 'auto';
        
        // Crear botón de cierre
        const closeButton = document.createElement('button');
        closeButton.className = 'lizmap-close-btn';
        closeButton.innerHTML = '×';
        closeButton.onclick = () => this.hide();
        
        // Crear indicador de carga
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'lizmap-loading';
        loadingIndicator.innerHTML = '<div class="spinner"></div><p>Cargando mapa Lizmap...</p><p style="font-size: 14px; color: #666;">Si no aparece, puede haber un problema de conectividad</p>';
        
        // Crear información del step
        const stepInfo = document.createElement('div');
        stepInfo.className = 'lizmap-step-info';
        
        // Ensamblar contenedor
        this.container.appendChild(closeButton);
        this.container.appendChild(loadingIndicator);
        this.container.appendChild(stepInfo);
        this.container.appendChild(this.iframe);
        
        // Agregar estilos
        this.addStyles();
        
        // Agregar event listener para el iframe
        this.iframe.addEventListener('load', () => {
            console.log('Iframe cargado - habilitando interacciones');
            this.iframe.style.pointerEvents = 'auto';
            this.iframe.style.userSelect = 'auto';
            this.iframe.style.touchAction = 'pan-x pan-y';
            
            // Debug: agregar event listener para clics
            this.iframe.addEventListener('click', (e) => {
                console.log('Click detectado en iframe:', e);
            });
            
            this.iframe.addEventListener('mousedown', (e) => {
                console.log('Mouse down detectado en iframe:', e);
            });
            
            // Bloquear wheel events en el iframe para evitar zoom con scroll
            this.iframe.addEventListener('wheel', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Wheel event bloqueado en iframe para preservar scroll del documento');
                return false;
            }, { passive: false });
        });
        
        // Agregar al DOM
        document.body.appendChild(this.container);
        
        // Bloquear wheel events en el contenedor para preservar scroll
        this.container.addEventListener('wheel', (e) => {
            // Solo bloquear si el target es el iframe
            if (e.target === this.iframe || this.iframe.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Wheel event bloqueado en contenedor Lizmap');
                return false;
            }
        }, { passive: false });
        
        console.log('Container creado y agregado al DOM:', this.container.id);
    }
    
    // Agregar estilos CSS
    addStyles() {
        const styleId = 'lizmap-scrolly-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .lizmap-scrolly-container {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: white;
                z-index: 10000 !important;
                transition: all 800ms cubic-bezier(0.4, 0, 0.2, 1) !important;
                transform-origin: top center;
                /* Estado inicial: oculto arriba (como cortina) */
                opacity: 0;
                transform: translateY(-100%);
                visibility: hidden;
                pointer-events: none; /* No bloquea el scroll del documento */
            }
            
            .lizmap-scrolly-container.curtain-up {
                opacity: 1 !important;
                transform: translateY(0) !important; /* Cortina baja y se muestra */
                visibility: visible !important;
                background: white !important;
                pointer-events: none !important; /* Contenedor no bloquea scroll */
            }
            
            .lizmap-scrolly-container.curtain-down {
                opacity: 0 !important;
                transform: translateY(-100%) !important; /* Cortina sube y se oculta */
                visibility: hidden !important;
                transition: all 800ms cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            
            .lizmap-scrolly-iframe {
                width: 100%;
                height: 100%;
                border: none;
                pointer-events: auto !important;
                user-select: auto !important;
                touch-action: pan-x pan-y !important; /* Solo pan, no zoom */
            }
            
            .lizmap-scrolly-container.curtain-up .lizmap-scrolly-iframe {
                pointer-events: auto !important;
                user-select: auto !important;
                touch-action: pan-x pan-y !important; /* Solo pan, no zoom */
            }
            
            /* Deshabilitar zoom con rueda del mouse en el iframe */
            .lizmap-scrolly-iframe {
                overflow: hidden !important;
            }
            
            .lizmap-close-btn {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 40px;
                height: 40px;
                border: none;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.9);
                color: #333;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                z-index: 10001;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                pointer-events: auto !important; /* Botón siempre interactivo */
            }
            
            .lizmap-close-btn:hover {
                background: #ff4444;
                color: white;
                transform: scale(1.1);
            }
            
            .lizmap-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                z-index: 10000;
                background: rgba(255, 255, 255, 0.95);
                padding: 20px;
                border-radius: 8px;
                transition: opacity 0.3s ease;
            }
            
            .lizmap-loading.hidden {
                opacity: 0;
                pointer-events: none;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #4264fb;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .lizmap-step-info {
                position: absolute;
                bottom: 15px;
                left: 15px;
                right: 15px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                z-index: 10001;
                font-size: 14px;
                transform: translateY(100%);
                transition: transform 0.3s ease;
            }
            
            .lizmap-step-info.visible {
                transform: translateY(0);
            }
            
            /* Overlay para el fondo */
            .lizmap-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 9998;
                opacity: 0;
                visibility: hidden;
                transition: all ${this.transitionDuration}ms ease;
            }
            
            .lizmap-overlay.visible {
                opacity: 1;
                visibility: visible;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .lizmap-scrolly-container {
                    width: 95vw;
                    height: 80vh;
                }
                
                .lizmap-step-info {
                    font-size: 12px;
                    padding: 8px 12px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Agregar event listeners
    addEventListeners() {
        // Escape key para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
        
        // Tecla ESC para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
        
        // Evento de carga del iframe
        this.iframe.addEventListener('load', () => {
            console.log('Iframe cargado exitosamente');
            this.hideLoading();
            this.showStepInfo();
        });
        
        // Evento de error del iframe
        this.iframe.addEventListener('error', (e) => {
            console.error('Error cargando iframe:', e);
            this.showError('Error cargando el mapa. Verifica la conectividad.');
        });
    }
    
    // Mostrar el contenedor Lizmap para un step específico
    showForStep(stepNumber) {
        console.log(`=== showForStep ${stepNumber} ===`);
        
        if (!window.lizmapLayerConfig) {
            console.error('ERROR: lizmapLayerConfig no encontrado. Asegúrate de incluir lizmap-config.js');
            return;
        }
        
        console.log('lizmapLayerConfig encontrado:', window.lizmapLayerConfig);
        
        const stepConfig = window.lizmapLayerConfig.stepLayers[stepNumber];
        if (!stepConfig) {
            console.warn(`WARN: No hay configuración para el step ${stepNumber}`);
            console.log('Steps disponibles:', Object.keys(window.lizmapLayerConfig.stepLayers));
            return;
        }
        
        console.log(`Configuración para step ${stepNumber}:`, stepConfig);
        
        this.currentStep = stepNumber;
        this.updateIframe(stepConfig);
        this.show();
        
        console.log(`=== Step ${stepNumber} procesado ===`);
    }
    
    // Actualizar el contenido del iframe
    updateIframe(stepConfig) {
        console.log('=== updateIframe ===');
        console.log('stepConfig:', stepConfig);
        
        this.showLoading();
        
        try {
            const url = window.lizmapLayerConfig.generateLizmapUrl(stepConfig);
            console.log('URL generada:', url);
            
            if (this.iframe) {
                this.iframe.src = url;
                console.log('URL asignada al iframe');
                
                // Timeout para detectar si el iframe no carga
                setTimeout(() => {
                    const loading = this.container.querySelector('.lizmap-loading');
                    if (loading && !loading.classList.contains('hidden')) {
                        console.warn('Iframe tardando mucho en cargar, mostrando advertencia');
                        this.showError('El mapa está tardando en cargar. Puede haber un problema de conectividad.');
                    }
                }, 10000); // 10 segundos
                
            } else {
                console.error('ERROR: iframe no disponible');
            }
            
            // Actualizar información del step
            const stepInfo = this.container.querySelector('.lizmap-step-info');
            if (stepInfo) {
                stepInfo.innerHTML = `
                    <strong>${stepConfig.description}</strong>
                    <br><small>Capas: ${stepConfig.layers.join(', ')}</small>
                `;
                console.log('Información del step actualizada');
            } else {
                console.error('ERROR: stepInfo no encontrado');
            }
        } catch (error) {
            console.error('ERROR en updateIframe:', error);
        }
    }
    
    // Mostrar el contenedor con efecto telón
    show() {
        console.log('=== Ejecutando show() ===');
        console.log('Container disponible:', this.container !== null);
        console.log('Container clases antes:', this.container ? this.container.className : 'N/A');
        
        this.isVisible = true;
        
        if (this.container) {
            // Aplicar efecto cortina bajando (desde arriba hacia abajo)
            this.container.classList.remove('curtain-down');
            this.container.classList.add('curtain-up');
            
            // Restaurar estilos normales como respaldo
            setTimeout(() => {
                this.container.style.opacity = '1';
                this.container.style.transform = 'translateY(0)';
                this.container.style.visibility = 'visible';
            }, 50);
            
            // Forzar habilitación de interacciones después de un pequeño delay
            setTimeout(() => {
                this.enableInteractions();
            }, 300);
            
            console.log('Container clases después:', this.container.className);
            console.log('=== Lizmap mostrado con cortina bajando ===');
        } else {
            console.error('ERROR: Container no disponible en show()');
        }
    }
    
    // Función para habilitar explícitamente las interacciones del mapa
    enableInteractions() {
        if (this.container && this.iframe) {
            console.log('Habilitando interacciones del mapa (manteniendo scroll)...');
            
            // Asegurar z-index alto
            this.container.style.zIndex = '10000';
            
            // El contenedor NO debe capturar eventos (permite scroll)
            this.container.style.pointerEvents = 'none';
            
            // Solo el iframe captura eventos de mapa
            this.iframe.style.pointerEvents = 'auto';
            this.iframe.style.userSelect = 'auto';
            this.iframe.style.touchAction = 'pan-x pan-y zoom-inout';
            this.iframe.style.zIndex = '10001';
            
            // Agregar atributos adicionales si no están
            if (!this.iframe.hasAttribute('allow')) {
                this.iframe.setAttribute('allow', 'fullscreen; geolocation; microphone; camera');
            }
            
            // Asegurar que el scroll siempre funcione
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            
            console.log('✓ Mapa interactivo - Scroll habilitado');
        }
    }
    
    // Ocultar el contenedor con efecto telón
    hide() {
        console.log('=== Ejecutando hide() ===');
        console.log('Container clases antes:', this.container ? this.container.className : 'N/A');
        
        this.isVisible = false;
        
        if (this.container) {
            // Aplicar efecto cortina subiendo (desde abajo hacia arriba)
            this.container.classList.remove('curtain-up');
            this.container.classList.add('curtain-down');
            
            // Forzar estilos como respaldo
            setTimeout(() => {
                this.container.style.opacity = '0';
                this.container.style.transform = 'translateY(-100%)';
                this.container.style.visibility = 'hidden';
            }, 50);
            
            console.log('Container clases después:', this.container.className);
            console.log('=== Lizmap ocultándose con cortina subiendo ===');
        }
        
        // Restaurar interacciones normales
        this.disableInteractions();
    }
    
    // Función para deshabilitar y restaurar estado normal
    disableInteractions() {
        // El scroll siempre debe estar habilitado para el scrollytelling
        document.body.style.overflow = 'auto';
        
        // Los steps mantienen eventos para scroll
        document.querySelectorAll('.step').forEach(step => {
            step.style.pointerEvents = 'auto';
        });
        
        console.log('✓ Estado normal mantenido para scrollytelling');
    }
    
    // Inicializar el contenedor como oculto (cortina arriba)
    initializeAsHidden() {
        if (this.container) {
            this.container.classList.add('curtain-down');
            // Forzar estado inicial de cortina arriba
            this.container.style.opacity = '0';
            this.container.style.transform = 'translateY(-100%)';
            this.container.style.visibility = 'hidden';
            console.log('Contenedor Lizmap inicializado como cortina arriba');
            console.log('Clases del contenedor:', this.container.className);
        } else {
            console.error('ERROR: Container no disponible en initializeAsHidden');
        }
    }
    
    // Mostrar indicador de carga
    showLoading() {
        const loading = this.container.querySelector('.lizmap-loading');
        if (loading) loading.classList.remove('hidden');
    }
    
    // Ocultar indicador de carga
    hideLoading() {
        const loading = this.container.querySelector('.lizmap-loading');
        if (loading) {
            setTimeout(() => loading.classList.add('hidden'), 500);
        }
    }
    
    // Mostrar información del step
    showStepInfo() {
        const stepInfo = this.container.querySelector('.lizmap-step-info');
        if (stepInfo) {
            setTimeout(() => stepInfo.classList.add('visible'), 1000);
        }
    }
    
    // Establecer opacidad gradual para transiciones suaves
    setOpacity(opacity) {
        if (this.container) {
            this.container.style.opacity = Math.max(0, Math.min(1, opacity));
            
            // Escala gradual para efecto más suave
            const scale = 0.9 + (0.1 * opacity);
            const translateY = (1 - opacity) * 20;
            this.container.style.transform = `translateY(${translateY}px) scale(${scale})`;
            
            console.log(`Opacidad del contenedor ajustada a: ${opacity}, escala: ${scale}`);
        }
    }
    
    // Mostrar error
    showError(message) {
        const loading = this.container.querySelector('.lizmap-loading');
        if (loading) {
            loading.innerHTML = `<div style="color: red; font-size: 18px;">⚠ ${message}</div>`;
            loading.classList.remove('hidden');
        }
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            this.hide();
        }, 5000);
    }
    
    // Cambiar a un step específico sin mostrar/ocultar
    changeToStep(stepNumber) {
        if (!this.isVisible) return;
        
        const stepConfig = window.lizmapLayerConfig.stepLayers[stepNumber];
        if (stepConfig && stepNumber !== this.currentStep) {
            this.currentStep = stepNumber;
            this.updateIframe(stepConfig);
        }
    }
    
    // Destruir el manager
    destroy() {
        if (this.container) {
            this.container.remove();
        }
        const overlay = document.querySelector('.lizmap-overlay');
        if (overlay) overlay.remove();
        
        const styles = document.getElementById('lizmap-scrolly-styles');
        if (styles) styles.remove();
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.LizmapScrollytellingManager = LizmapScrollytellingManager;
}