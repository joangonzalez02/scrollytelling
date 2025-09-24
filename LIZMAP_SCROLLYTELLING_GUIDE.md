# Lizmap Scrollytelling Integration - Guía de Uso

## 📖 Descripción

Este sistema permite integrar Lizmap embebido con scrollytelling usando Scrollama, reutilizando un solo contenedor iframe y cambiando las capas dinámicamente según el step activo.

## 🏗️ Arquitectura del Sistema

### Archivos Principales

1. **`lizmap-config.js`** - Configuración de capas por step
2. **`lizmap-manager.js`** - Gestor del contenedor Lizmap reutilizable  
3. **`lizmap-scrollama-integration.js`** - Integración con Scrollama
4. **`test_qgis.html`** - Archivo de ejemplo funcional

## ⚙️ Configuración

### 1. Configurar las Capas por Step (`lizmap-config.js`)

```javascript
const lizmapLayerConfig = {
    baseConfig: {
        server: 'http://tu-servidor/lizmap/index.php/view/map',
        repository: 'tu-repositorio',
        project: 'tu-proyecto'
    },
    
    stepLayers: {
        0: { 
            layers: ['capa1', 'capa2'],
            center: [-86.85, 21.05],
            zoom: 10,
            description: 'Descripción del step'
        },
        // ... más steps
    }
};
```

### 2. Personalizar Comportamiento (`lizmap-scrollama-integration.js`)

```javascript
const lizmapStepsConfig = {
    // Steps donde Lizmap debe estar visible automáticamente
    visibleSteps: [1, 2, 3, 4, 5, 6, 7, 8],
    
    // Steps donde debe cambiar automáticamente
    autoChangeSteps: [1, 2, 3, 4, 5, 6, 7],
    
    // Botones manuales por step
    manualButtons: {
        2: "Ver datos demográficos",
        3: "Ver expansión territorial"
        // ... más botones
    }
};
```

## 🚀 Implementación

### HTML Básico

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/scrollama"></script>
    <script src="lizmap-config.js"></script>
    <script src="lizmap-manager.js"></script>
    <script src="lizmap-scrollama-integration.js"></script>
</head>
<body>
    <main id="scroller">
        <section class="step" data-step="0">
            <div class="step-content">
                <h1>Título</h1>
                <p>Contenido...</p>
            </div>
        </section>
        <!-- Más steps... -->
    </main>
</body>
</html>
```

### Inicialización JavaScript

```javascript
// El sistema se auto-inicializa, pero puedes acceder a:
window.lizmapScrollytellingIntegration = {
    manager: () => lizmapManager,
    showStep: (stepIndex) => lizmapManager.showForStep(stepIndex),
    hide: () => lizmapManager.hide(),
    getCurrentStep: getCurrentScrollamaStep
};
```

## 🎮 Uso

### Modos de Operación

1. **Automático**: Las capas cambian automáticamente al hacer scroll
2. **Manual**: Botones en cada step para mostrar mapas específicos  
3. **Controles Globales**: Panel flotante con controles generales

### Controles Disponibles

- **Mostrar Mapa del Step**: Abre Lizmap para el step actual
- **Mostrar/Ocultar Lizmap**: Toggle de visibilidad
- **Selector de Step**: Dropdown para ir a cualquier step
- **Escape**: Cierra el mapa (teclado)

## 🎨 Personalización

### Estilos CSS

El sistema incluye estilos responsivos que puedes personalizar:

```css
.lizmap-scrolly-container {
    /* Contenedor principal del mapa */
}

.lizmap-scrolly-iframe {
    /* iframe de Lizmap */
}

.lizmap-close-btn {
    /* Botón de cerrar */
}
```

### Configuración de URLs

```javascript
// Personalizar la generación de URLs
lizmapLayerConfig.generateLizmapUrl = function(stepConfig) {
    // Tu lógica personalizada
    return `${this.baseConfig.server}?custom_params=...`;
};
```

## 🔧 API Programática

### Métodos Principales

```javascript
const manager = window.lizmapScrollytellingIntegration.manager();

// Mostrar step específico
manager.showForStep(3);

// Ocultar
manager.hide();

// Cambiar step sin mostrar/ocultar
manager.changeToStep(5);

// Verificar visibilidad
console.log(manager.isVisible);
```

### Eventos Personalizados

```javascript
// Extender la función handleLizmapStepChange
function handleLizmapStepChange(response) {
    const stepIndex = response.index;
    
    // Tu lógica personalizada aquí
    if (stepIndex === 3) {
        // Hacer algo especial en el step 3
    }
}
```

## 📱 Responsive Design

El sistema incluye diseño responsivo automático:

- **Desktop**: Modal centrado (80vw x 70vh)
- **Mobile**: Casi pantalla completa (95vw x 80vh)
- **Controles**: Se adaptan a la pantalla

## 🚨 Limitaciones y Consideraciones

### Seguridad
- Las capturas de pantalla están limitadas por CORS
- Usar herramientas WMS/WMTS para exportar imágenes

### Performance  
- El iframe se recarga completamente al cambiar capas
- Considera caching en el servidor Lizmap

### Compatibilidad
- Requiere navegadores modernos (ES6+)
- Lizmap debe permitir embedding (X-Frame-Options)

## 🐛 Troubleshooting

### Problemas Comunes

**"Sistema Lizmap no está disponible"**
```javascript
// Verificar que los scripts estén cargados
console.log(typeof LizmapScrollytellingManager); // debe ser 'function'
console.log(typeof lizmapLayerConfig); // debe ser 'object'
```

**El mapa no se muestra**
```javascript
// Verificar configuración del server
console.log(lizmapLayerConfig.baseConfig.server);
// Verificar que el step tenga configuración
console.log(lizmapLayerConfig.stepLayers[stepIndex]);
```

**Scrollama no funciona**
```javascript
// Verificar que Scrollama esté cargado
console.log(typeof scrollama); // debe ser 'function'
```

## 🔄 Migración desde Sistema Anterior

Si tienes un sistema Lizmap existente:

1. Reemplaza las funciones `showLizmap()` y `hideLizmap()`
2. Actualiza los event handlers de Scrollama
3. Migra la configuración de capas al nuevo formato

## 💡 Ejemplos de Uso

### Ejemplo 1: Solo Steps Automáticos
```javascript
const lizmapStepsConfig = {
    visibleSteps: [2, 4, 6],
    autoChangeSteps: [2, 4, 6],
    manualButtons: {} // Sin botones manuales
};
```

### Ejemplo 2: Solo Botones Manuales
```javascript
const lizmapStepsConfig = {
    visibleSteps: [],
    autoChangeSteps: [],
    manualButtons: {
        1: "Ver mapa base",
        3: "Ver análisis detallado",
        5: "Ver proyecciones"
    }
};
```

### Ejemplo 3: Híbrido
```javascript
const lizmapStepsConfig = {
    visibleSteps: [1, 2, 3, 4, 5],
    autoChangeSteps: [1, 3, 5], // Solo algunos automáticos
    manualButtons: {
        2: "Ver datos opcionales",
        4: "Ver análisis especial"
    }
};
```

## 📞 Soporte

Para reportar issues o solicitar features, contacta al equipo de desarrollo o revisa la documentación técnica en los archivos del código fuente.