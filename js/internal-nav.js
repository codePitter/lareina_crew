// Script para marcar navegación interna
// Este script debe incluirse en TODAS las páginas que tengan enlaces a index.html

document.addEventListener('DOMContentLoaded', function() {
    // Encontrar todos los enlaces que apuntan a index.html
    const indexLinks = document.querySelectorAll('a[href="index.html"], button[onclick*="index.html"]');
    
    indexLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Marcar que la navegación viene desde una página interna
            sessionStorage.setItem('fromInternalNav', 'true');
        });
    });
    
    // También manejar los clicks en botones del menú que usan window.location
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const onclick = item.getAttribute('onclick');
        if (onclick && onclick.includes('index.html')) {
            item.addEventListener('click', function() {
                sessionStorage.setItem('fromInternalNav', 'true');
            });
        }
    });
});
