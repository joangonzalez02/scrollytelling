# SCROLLAMA - Rama de pruebas
# Guía de uso: Scrollytelling Lizmap

Esta página implementa un sistema de scrollytelling interactivo para explorar el crecimiento urbano y demográfico de Benito Juárez, Cancún, usando mapas y visualizaciones dinámicas.

## ¿Cómo funciona?

- Al abrir la página, verás una narrativa dividida en "steps" o secciones.
- Al hacer scroll, cada sección activa una visualización diferente en el mapa (Lizmap) y muestra datos relevantes.
- El mapa se integra con Scrollama y D3.js para transiciones suaves y visualizaciones interactivas.

## Principales funcionalidades

- **Transiciones de mapa:** El mapa aparece y desaparece con animaciones tipo telón según el paso activo.
- **Visualizaciones por step:** Cada sección activa diferentes capas y zoom en el mapa, mostrando información histórica, demográfica y territorial.
- **Datos simulados:** Se utilizan datos simulados para mostrar polígonos, líneas y clusters de población.
- **Integración Lizmap:** El mapa se conecta a un servidor Lizmap para mostrar capas GIS reales.

## ¿Cómo probar?

1. Abre `index.html` en tu navegador.
2. Haz scroll para avanzar por la narrativa y observa cómo cambia el mapa y las visualizaciones.
3. Revisa los archivos `main.js`, `lizmap-config.js` y `lizmap-scrollama-integration.js` para entender la lógica y configuración.

## Estructura de archivos clave

- `index.html`: Página principal y estructura de la narrativa.
- `main.js`: Lógica de visualización y datos simulados.
- `lizmap-config.js`: Configuración de capas y conexión Lizmap.
- `lizmap-scrollama-integration.js`: Integración entre Scrollama y Lizmap.
- `style.css`: Estilos y animaciones.

## Notas
- Esta rama es experimental y puede contener cambios inestables.
- El sistema está pensado para facilitar la exploración visual y narrativa de datos espaciales.

---
