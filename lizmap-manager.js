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
        this.currentUrl = null;
        this.transitionDuration = 1200; // Duración de transiciones en ms (más lenta)
        
        console.log('Configuración inicial:', {
            containerId: this.containerId,
            transitionDuration: this.transitionDuration
        });
        
        this.init();
        
        // Añadir método de emergencia para cerrar el mapa con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                console.log('Tecla Escape detectada - cerrando mapa de emergencia');
                this.forceHide();
            }
        });
        
        // Método global para forzar cierre en caso de emergencia
        window.forceLizmapClose = () => {
            this.forceHide();
        };
        
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
        
        // Añadir evento de carga para el iframe
        this.iframe.addEventListener('load', () => {
            console.log('=== IFRAME CARGADO EXITOSAMENTE ===');
            
            // Asegurarnos de que el contenedor sea visible
            if (this.container) {
                this.container.style.opacity = '1';
                this.container.style.visibility = 'visible';
                this.container.style.transform = 'translateY(0)';
                this.container.classList.remove('curtain-down');
                this.container.classList.add('curtain-up');
            }
            
            // Ocultar indicador de carga si existe
            const loading = this.container ? this.container.querySelector('.lizmap-loading') : null;
            if (loading) {
                loading.classList.add('hidden');
            }
        });
        this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock');
        this.iframe.style.pointerEvents = 'auto';
        this.iframe.style.userSelect = 'auto';
        this.iframe.style.touchAction = 'auto';
        
        // Crear botón de cierre más visible
        const closeButton = document.createElement('button');
        closeButton.className = 'lizmap-close-btn';
        closeButton.innerHTML = '×';
        closeButton.title = 'Cerrar mapa';
        closeButton.setAttribute('aria-label', 'Cerrar mapa');
        closeButton.style.display = 'flex'; // Asegurar que sea visible
        closeButton.style.position = 'absolute';
        closeButton.style.top = '20px';
        closeButton.style.right = '20px';
        closeButton.style.zIndex = '99999'; // Asegurar que esté sobre todo
        
        // Mejoramos el evento de clic para asegurar que funcione
        closeButton.addEventListener('click', (e) => {
            console.log('Botón de cierre pulsado');
            e.preventDefault(); // Prevenir comportamiento por defecto
            e.stopPropagation(); // Prevenir propagación del evento
            
            // Forzar cierre con método directo primero
            this.forceHide();
            
            // Como respaldo, intentar usar la función global si existe
            if (typeof window.hideMapVisuals === 'function') {
                try {
                    window.hideMapVisuals();
                } catch (err) {
                    console.error('Error al llamar hideMapVisuals:', err);
                }
            }
            
            return false; // Evitar cualquier otro comportamiento
        }, true); // Usamos captura para asegurarnos de capturar el evento
        
        // Crear indicador de carga
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'lizmap-loading';
        loadingIndicator.innerHTML = '<div class="spinner"></div><p>Cargando mapa Lizmap...</p><p style="font-size: 14px; color: #666;">Si no aparece, puede haber un problema de conectividad</p>';
        
        // Crear información del step
        const stepInfo = document.createElement('div');
        stepInfo.className = 'lizmap-step-info';
        
        // Crear div con mensaje y botón para abrir mapa
        const mapDiv = document.createElement('div');
        mapDiv.className = 'lizmap-map-message';
        mapDiv.innerHTML = `
            <p>El mapa interactivo se abrirá en una nueva ventana para evitar problemas de compatibilidad.</p>
            <button class="lizmap-open-map-btn">🗺️ Abrir Mapa Interactivo</button>
        `;
        
        // Event listener para el botón
        mapDiv.querySelector('.lizmap-open-map-btn').addEventListener('click', () => {
            if (this.currentUrl) {
                window.open(this.currentUrl, 'lizmap-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            }
        });
        
        // Ensamblar contenedor
        this.container.appendChild(closeButton);
        this.container.appendChild(loadingIndicator);
        this.container.appendChild(stepInfo);
        this.container.appendChild(mapDiv);
        
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
            
            // Modificamos el manejo de wheel events para permitir propagar al documento
            this.iframe.addEventListener('wheel', (e) => {
                // Detectamos la dirección del scroll
                const deltaY = e.deltaY;
                const scrollingDown = deltaY > 0;
                const scrollingUp = deltaY < 0;
                
                // Permitir que el evento se propague al documento para scroll entre steps
                console.log('Wheel event detectado en iframe:', scrollingDown ? 'bajando' : 'subiendo');
                
                // No bloqueamos el evento para permitir scroll entre pasos
                // Solo registramos para depuración
            });
        });
        
        // Agregar al DOM
        document.body.appendChild(this.container);
        
        // Modificamos el manejo de wheel events en el contenedor
        this.container.addEventListener('wheel', (e) => {
            // Ya no bloqueamos los eventos wheel para permitir scroll entre pasos
            console.log('Wheel event en contenedor Lizmap - permitido para scroll entre steps');
            
            // Detectamos si es un scroll significativo que podría indicar intento de cambiar de paso
            const significantScroll = Math.abs(e.deltaY) > 50;
            
            // Si es un scroll significativo hacia abajo y estamos cerca del borde inferior del mapa,
            // o un scroll significativo hacia arriba y estamos cerca del borde superior,
            // podría indicar intención de cambiar de paso - así que no bloqueamos
        }, { passive: true }); // Cambiamos a passive: true para mejorar el rendimiento
        
        console.log('Container creado y agregado al DOM:', this.container.id);
    }
    
    // Agregar estilos CSS
    addStyles() {
        const styleId = 'lizmap-scrolly-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Estilo base del contenedor */
            .lizmap-scrolly-container {
                width: 100% !important;
                background: white;
                transition: all 800ms cubic-bezier(0.4, 0, 0.2, 1) !important;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            
            /* Cuando está como overlay (fuera del flujo) */
            .lizmap-scrolly-container.overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                height: 100vh !important;
                z-index: 1000 !important;
                display: none;
                opacity: 0;
                transform: translateY(-100%);
                visibility: hidden;
                pointer-events: none;
            }
            
            .lizmap-scrolly-container.overlay.curtain-up {
                opacity: 1 !important;
                transform: translateY(0) !important;
                visibility: visible !important;
                background: white !important;
                pointer-events: none !important;
            }
            
            .lizmap-scrolly-container.overlay.curtain-down {
                opacity: 0 !important;
                transform: translateY(-100%) !important;
                visibility: hidden !important;
                transition: all 800ms cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            
            /* Cuando está integrado en un step (parte del flujo) */
            .step .lizmap-scrolly-container {
                position: relative !important;
                height: 600px !important;
                z-index: 1 !important;
                display: block !important;
                opacity: 1 !important;
                transform: none !important;
                visibility: visible !important;
                pointer-events: auto !important;
                margin: 20px 0 !important;
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
                position: absolute !important;
                top: 20px !important;
                right: 20px !important;
                width: 50px !important;
                height: 50px !important;
                border: 2px solid #FB8500 !important; /* Color naranja más visible */
                border-radius: 50% !important;
                background: rgba(255, 255, 255, 0.95) !important;
                color: #FB8500 !important; /* Color naranja */
                font-size: 28px !important;
                font-weight: bold !important;
                cursor: pointer !important;
                z-index: 99999 !important; /* Valor muy alto para estar por encima de todo */
                transition: all 0.2s ease !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
                pointer-events: auto !important; /* Botón siempre interactivo */
                opacity: 1 !important; /* Siempre visible */
                visibility: visible !important; /* Siempre visible */
            }
            
            .lizmap-scrolly-container.curtain-up .lizmap-close-btn {
                opacity: 1 !important;
                visibility: visible !important;
                display: flex !important;
            }
            
            .lizmap-close-btn:hover {
                background: #FB8500 !important;
                color: white !important;
                transform: scale(1.1) !important;
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
                /* Cuando está integrado en un step */
                .step .lizmap-scrolly-container {
                    height: 400px !important;
                    margin: 20px 0 !important;
                }
                
                /* Cuando está como overlay */
                .lizmap-scrolly-container.overlay {
                    height: 100vh !important;
                }
                
                .lizmap-step-info {
                    font-size: 12px;
                    padding: 8px 12px;
                }
            }
            }
        `;
        
        // Agregar estilos adicionales para el mensaje y botón
        style.textContent += `
            .lizmap-map-message {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                background: rgba(255, 255, 255, 0.95);
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                max-width: 300px;
                z-index: 10002;
            }
            
            .lizmap-open-map-btn {
                background: #4264fb;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
                margin-top: 10px;
            }
            
            .lizmap-open-map-btn:hover {
                background: #3651e6;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(66, 100, 251, 0.4);
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
    // Nuevo método para mostrar un mapa específico por capa y vista
    showMap(layerId, viewId) {
        console.log(`=== showMap(${layerId}, ${viewId}) ===`);
        
        if (!window.lizmapLayerConfig) {
            console.error('ERROR: lizmapLayerConfig no encontrado. Asegúrate de incluir lizmap-config.js');
            return;
        }
        
        console.log('lizmapLayerConfig encontrado:', window.lizmapLayerConfig);
        
        // Buscar en la configuración la capa y la vista especificadas
        // O usar una configuración por defecto
        let stepConfig = null;
        
        // Primero intentamos buscar una configuración existente que coincida
        for (const [stepKey, config] of Object.entries(window.lizmapLayerConfig.stepLayers)) {
            if (config.layers && config.layers.includes(layerId)) {
                console.log(`Encontrada configuración para capa ${layerId} en step ${stepKey}`);
                stepConfig = config;
                break;
            }
        }
        
        // Si no encontramos una configuración, creamos una por defecto
        if (!stepConfig) {
            console.log('No se encontró configuración para esta capa, creando por defecto');
            
            stepConfig = {
                layers: [layerId || 'baselayers'],
                center: [-86.84, 21.13],  // Coordenadas por defecto de Cancún
                zoom: 11,
                description: `Vista de capa ${layerId || 'principal'}`
            };
        }
        
        console.log('Usando configuración de mapa:', stepConfig);
        
        // Mostrar el mapa con esta configuración
        this.currentConfig = stepConfig;
        this.updateIframe(stepConfig);
        this.show();
    }
    
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
        
        // Encontrar el step correspondiente en el DOM
        const stepElement = document.querySelector(`.step[data-step="${stepNumber}"]`);
        if (stepElement) {
            console.log(`Encontrado step element para ${stepNumber}:`, stepElement);
            
            // Mover el contenedor del mapa dentro del step
            if (this.container && this.container.parentNode !== stepElement) {
                // Si ya está en otro lugar, removerlo primero
                if (this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
                // Insertar al inicio del step
                stepElement.insertBefore(this.container, stepElement.firstChild);
                console.log(`Contenedor movido dentro del step ${stepNumber}`);
            }
        } else {
            console.warn(`No se encontró el elemento step para ${stepNumber}`);
        }
        
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
                this.currentUrl = url;
                console.log('URL asignada al iframe');
                
                // Manejar el evento de error del iframe para intentar con URLs alternativas
                const originalIframeOnError = this.iframe.onerror;
                this.iframe.onerror = () => {
                    console.warn('Error al cargar el iframe con la URL primaria, probando alternativas...');
                    this.tryAlternativeUrls(stepConfig);
                    
                    // Restaurar el manejador de error original
                    this.iframe.onerror = originalIframeOnError;
                };
                
                // Timeout para detectar si el iframe no carga
                setTimeout(() => {
                    const loading = this.container.querySelector('.lizmap-loading');
                    if (loading && !loading.classList.contains('hidden')) {
                        console.warn('Iframe tardando mucho en cargar, probando alternativas...');
                        this.tryAlternativeUrls(stepConfig);
                    }
                }, 10000); // 10 segundos
            }
        } catch (error) {
            console.error('Error en updateIframe:', error);
            this.showError('Error al actualizar el mapa: ' + error.message);
        }
    }
    
    // Método para intentar con URLs alternativas si la principal no carga
    tryAlternativeUrls(stepConfig) {
        console.log('=== tryAlternativeUrls ===');
        
        const { server, repository, project } = window.lizmapLayerConfig.baseConfig;
        const layers = stepConfig.layers.join(',');
        const bbox = window.lizmapLayerConfig.calculateBbox(stepConfig.center, stepConfig.zoom);
        
        // Lista de formatos de URL alternativos para intentar
        const alternativeUrls = [
            // URL básica sin bbox
            `${server}?repository=${repository}&project=${project}`,
            
            // URL con bbox
            `${server}?repository=${repository}&project=${project}&bbox=${bbox}`,
            
            // URL del repositorio sin proyecto específico
            `${server}?repository=${repository}`,
            
            // URL base del servidor
            `${server}`
        ];
        
        console.log('Intentando con URLs alternativas:', alternativeUrls);
        
        // Intentar cada URL con un intervalo para no sobrecargar
        let attemptIndex = 0;
        const tryNextUrl = () => {
            if (attemptIndex < alternativeUrls.length) {
                const alternativeUrl = alternativeUrls[attemptIndex];
                console.log(`Intentando URL alternativa ${attemptIndex + 1}/${alternativeUrls.length}:`, alternativeUrl);
                
                if (this.iframe) {
                    this.iframe.src = alternativeUrl;
                }
                
                attemptIndex++;
                
                // Esperar un poco antes de intentar la siguiente URL
                setTimeout(tryNextUrl, 5000);
            } else {
                console.warn('Ninguna URL alternativa funcionó');
                this.showError('No se pudo cargar el mapa. Por favor, verifica la conexión al servidor Lizmap.');
            }
        };
        
        // Comenzar a intentar con URLs alternativas
        tryNextUrl();
    }
    
    // Mostrar el contenedor con efecto telón
    show() {
        console.log('=== Ejecutando show() ===');
        console.log('Container disponible:', this.container !== null);
        console.log('Container clases antes:', this.container ? this.container.className : 'N/A');
        
        this.isVisible = true;
        
        if (this.container) {
            // Determinar si está dentro de un step o como overlay
            const isInStep = this.container.closest('.step') !== null;
            
            if (isInStep) {
                // Está integrado en un step - mostrar normalmente
                console.log('Mostrando mapa integrado en step');
                this.container.style.display = 'block';
                this.container.style.opacity = '1';
                this.container.style.visibility = 'visible';
                this.container.classList.remove('curtain-down');
                
                // Mover al activeStep correspondiente
                if (this.currentStep) {
                    const stepElement = document.querySelector(`.step[data-step="${this.currentStep}"]`);
                    if (stepElement) {
                        console.log(`Haciendo scroll al step ${this.currentStep}`);
                        stepElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                }
            } else {
                // Está como overlay - aplicar animación de cortina
                console.log('Mostrando mapa como overlay');
                this.container.classList.add('overlay');
                this.container.style.display = 'block';
                
                // Aplicar efecto cortina bajando
                this.container.classList.remove('curtain-down');
                this.container.classList.add('curtain-up');
                
                // Restaurar estilos normales como respaldo
                setTimeout(() => {
                    this.container.style.opacity = '1';
                    this.container.style.transform = 'translateY(0)';
                    this.container.style.visibility = 'visible';
                    
                    // Asegurar que el botón de cierre esté visible
                    const closeBtn = this.container.querySelector('.lizmap-close-btn');
                    if (closeBtn) {
                        closeBtn.style.display = 'flex';
                        closeBtn.style.opacity = '1';
                        closeBtn.style.visibility = 'visible';
                        closeBtn.style.zIndex = '99999';
                    }
                }, 50);
            }
            
            // Forzar habilitación de interacciones después de un pequeño delay
            setTimeout(() => {
                this.enableInteractions();
            }, 300);
            
            console.log('Container clases después:', this.container.className);
            console.log('=== Lizmap mostrado ===');
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
    
    // Ocultar el contenedor con efecto telón - mejorado para asegurar ocultación
    hide() {
        console.log('=== Ejecutando hide() en LizmapScrollytellingManager ===');
        
        // Marcar como oculto inmediatamente
        this.isVisible = false;
        
        // Aplicar método directo de cierre de emergencia para garantizar que se cierre
        this.forceHide();
        
        // Si está disponible la función global hideMapVisuals y no estamos en recursión
        if (typeof window.hideMapVisuals === 'function' && !this._inHideCall) {
            console.log('Usando función global hideMapVisuals para ocultar el mapa');
            this._inHideCall = true; // Evitar recursión
            try {
                window.hideMapVisuals();
            } catch (err) {
                console.error('Error al llamar hideMapVisuals:', err);
            }
            this._inHideCall = false;
        }
        
        // Ocultar el botón de emergencia
        const emergencyBtn = document.getElementById('emergency-close-btn');
        if (emergencyBtn) {
            emergencyBtn.style.display = 'none';
        }
        
        console.log('Container clases antes:', this.container ? this.container.className : 'N/A');
        
        // IMPORTANTE: Restaurar interacciones normales inmediatamente
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        document.body.classList.remove('showing-map');
        
        if (this.container) {
            // PASO 1: Aplicar estilos críticos de inmediato para garantizar que el mapa no bloquee
            this.container.style.opacity = '0';
            this.container.style.visibility = 'hidden';
            this.container.style.pointerEvents = 'none';
            this.container.style.zIndex = '-1';
            
            // PASO 2: Aplicar clases para animación
            this.container.classList.remove('curtain-up');
            this.container.classList.add('curtain-down');
            
            // PASO 3: Completar el cierre con ocultamiento total
            setTimeout(() => {
                if (!this.isVisible) { // Verificar que seguimos queriendo ocultar
                    this.container.style.display = 'none';
                    
                    // Limpiar iframe para liberar recursos
                    if (this.iframe) {
                        try {
                            this.iframe.src = 'about:blank';
                            console.log('Iframe limpiado para liberar recursos');
                        } catch(e) {
                            console.error('Error al limpiar iframe:', e);
                        }
                    }
                }
            }, 200);
        }
        
        console.log('=== Lizmap ocultado exitosamente ===');
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
    
    // Forzar cierre en caso de emergencia - mejorado para garantizar efectividad
    forceHide() {
        console.log('=== CIERRE DE EMERGENCIA DEL MAPA ===');
        
        // Ocultar el botón de emergencia
        const emergencyBtn = document.getElementById('emergency-close-btn');
        if (emergencyBtn) {
            emergencyBtn.style.display = 'none';
        }
        
        // Establecer variables de estado inmediatamente
        this.isVisible = false;
        
        // Restaurar interacciones del documento INMEDIATAMENTE
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        document.body.classList.remove('showing-map');
        
        // Desactivar el mapa completamente
        if (this.container) {
            // Determinar si está dentro de un step o como overlay
            const isInStep = this.container.closest('.step') !== null;
            
            if (isInStep) {
                // Está integrado en un step - ocultar completamente
                console.log('Ocultando mapa integrado en step');
                this.container.style.cssText = `
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                    height: 0 !important;
                    overflow: hidden !important;
                `;
                
                // Remover del step y devolver al contenedor original
                const originalContainer = document.getElementById('lizmap-container');
                if (originalContainer && this.container.parentNode !== originalContainer) {
                    this.container.parentNode.removeChild(this.container);
                    originalContainer.appendChild(this.container);
                    console.log('Contenedor movido de vuelta al lugar original');
                }
            } else {
                // Está como overlay - aplicar animación de cortina
                console.log('Ocultando mapa como overlay');
                
                // PASO 1: Detener cualquier transición en curso para evitar retrasos
                this.container.style.transition = 'none';
                
                // PASO 2: Cierre total inmediato con máxima prioridad usando !important
                this.container.style.cssText = `
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                    z-index: -9999 !important;
                    transform: translateY(100%) !important;
                    transition: none !important;
                `;
                
                // PASO 3: Aplicar clases para consistencia
                this.container.classList.remove('curtain-up', 'overlay');
                this.container.classList.add('curtain-down');
            }
            
            // PASO 4: Vaciar contenido del iframe para detener cualquier carga
            if (this.iframe) {
                try {
                    // Detener cualquier carga/comunicación
                    this.iframe.src = 'about:blank';
                    // Inhabilitar el iframe
                    this.iframe.style.cssText = 'display: none !important; width: 0 !important; height: 0 !important;';
                    console.log('Iframe limpiado y detenido');
                } catch(e) {
                    console.error('Error al limpiar iframe:', e);
                }
            }
            
            // PASO 5: Forzar repintado del DOM
            void this.container.offsetHeight;
            
            console.log('Mapa cerrado forzadamente');
        }
        
        // Como respaldo, llamar a cualquier otra función de cierre
        setTimeout(() => {
            try {
                if (typeof window.hideMapVisuals === 'function' && !this._inHideCall) {
                    this._inHideCall = true;
                    window.hideMapVisuals();
                    this._inHideCall = false;
                }
            } catch(e) {
                console.error('Error al intentar métodos adicionales de cierre:', e);
            }
            
            // Restaurar la transición después de un tiempo
            if (this.container) {
                this.container.style.transition = '';
            }
        }, 100);
        
        // Mostrar mensaje en consola
        console.log('✓ Cierre de emergencia completado');
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