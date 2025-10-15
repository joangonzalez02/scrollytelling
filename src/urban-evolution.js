// Script para manejar la visualización de evolución urbana
document.addEventListener('DOMContentLoaded', function() {
    // Configuración de las imágenes de evolución urbana
    const urbanEvolutionImages = [
        { year: 1975, image: null }, // Placeholder, se usará un color de fondo en lugar de imagen
        { year: 1980, image: null },
        { year: 1985, image: null },
        { year: 1990, image: null },
        { year: 1995, image: null },
        { year: 2000, image: null },
        { year: 2005, image: null },
        { year: 2010, image: null },
        { year: 2015, image: null },
        { year: 2020, image: null },
        { year: 2025, image: null }
    ];
    
    // Función para inicializar la visualización de evolución urbana
    function initUrbanEvolution() {
        const container = document.getElementById('urbanEvolutionContainer');
        if (!container) return;
        
        container.innerHTML = ''; // Limpiar el contenedor
        
        // Crear un div para cada imagen/año
        urbanEvolutionImages.forEach((item, index) => {
            const div = document.createElement('div');
            div.classList.add('urban-evolution-image');
            div.id = `urban-evolution-${item.year}`;
            
            // Si hay una imagen, usarla como fondo
            if (item.image) {
                div.style.backgroundImage = `url('${item.image}')`;
            } else {
                // Si no hay imagen, usar un color de fondo que represente la evolución
                // Más oscuro para los primeros años, más claro para los recientes
                const brightness = 20 + (index * 5); // Aumentar el brillo gradualmente
                div.style.backgroundColor = `rgba(2, 48, 71, ${1 - index * 0.06})`; // Disminuir la opacidad gradualmente
                
                // Añadir una etiqueta con el año para mejor visualización
                const yearLabel = document.createElement('div');
                yearLabel.style.position = 'absolute';
                yearLabel.style.top = '50%';
                yearLabel.style.left = '50%';
                yearLabel.style.transform = 'translate(-50%, -50%)';
                yearLabel.style.color = 'white';
                yearLabel.style.fontSize = '3rem';
                yearLabel.style.fontWeight = 'bold';
                yearLabel.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
                yearLabel.innerText = item.year;
                
                div.appendChild(yearLabel);
            }
            
            container.appendChild(div);
        });
    }
    
    // Función para actualizar la visualización según el progreso del scroll
    function updateUrbanEvolutionByScroll(progress) {
        const container = document.getElementById('urbanEvolutionContainer');
        if (!container) return;
        
        const totalImages = urbanEvolutionImages.length;
        
        // Calcular qué imagen mostrar según el progreso
        const imageIndex = Math.min(Math.floor(progress * totalImages), totalImages - 1);
        
        // Activar solo la imagen correspondiente
        document.querySelectorAll('.urban-evolution-image').forEach((el, i) => {
            if (i === imageIndex) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }
    
    // Observar cuando la sección de evolución urbana entra en la vista
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                initUrbanEvolution();
            }
        });
    }, { threshold: 0.2 });
    
    // Observar el contenedor
    const container = document.getElementById('urbanEvolutionContainer');
    if (container) {
        observer.observe(container);
    }
    
    // Exportar funciones para ser usadas por el script principal de scrollama
    window.urbanEvolution = {
        init: initUrbanEvolution,
        update: updateUrbanEvolutionByScroll
    };
});