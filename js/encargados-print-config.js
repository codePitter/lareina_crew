// ========== FUNCIÓN DE IMPRESIÓN SEMANAL PARA ENCARGADOS ==========

// Función principal de impresión
async function printSchedule() {
    // Guardar el día actual
    const currentDayTab = document.querySelector('.day-tab.active');
    const currentDay = currentDayTab ? parseInt(currentDayTab.dataset.day) : 0;

    // Crear contenedor temporal para todos los días
    const printContainer = document.createElement('div');
    printContainer.id = 'weekly-print-container';
    printContainer.style.display = 'none';

    // Recopilar horarios de todos los días
    for (let day = 0; day < 7; day++) {
        // Cambiar al día
        const dayTab = document.querySelector(`.day-tab[data-day="${day}"]`);
        if (dayTab) {
            dayTab.click();
        }

        // Esperar a que se carguen los datos
        await new Promise(resolve => setTimeout(resolve, 150));

        // Clonar el grid de horarios (sin la sección completa)
        const scheduleGrid = document.querySelector('.schedule-grid');
        const francosSection = document.querySelector('.francos-section');

        if (scheduleGrid) {
            // Crear wrapper para este día
            const dayWrapper = document.createElement('div');
            dayWrapper.className = 'day-print-section';

            // Agregar título del día
            const dayTitle = document.createElement('div');
            dayTitle.className = 'day-print-title';
            dayTitle.textContent = getDayTitle(day);
            dayWrapper.appendChild(dayTitle);

            // Clonar el grid
            const gridClone = scheduleGrid.cloneNode(true);

            // Si no es lunes (día 0), ocultar el header-row
            if (day !== 0) {
                const headerRow = gridClone.querySelector('.header-row');
                if (headerRow) {
                    headerRow.style.display = 'none';
                }
            }

            dayWrapper.appendChild(gridClone);

            // Clonar la sección de francos solo si tiene contenido
            if (francosSection) {
                const francosList = francosSection.querySelector('.francos-list');
                // Verificar si hay elementos dentro de francos-list
                if (francosList && francosList.children.length > 0) {
                    const francosClone = francosSection.cloneNode(true);
                    dayWrapper.appendChild(francosClone);
                }
            }

            printContainer.appendChild(dayWrapper);
        }
    }

    // Agregar el contenedor al body
    document.body.appendChild(printContainer);

    // NO agregar título general - comentado
    // addPrintTitle();

    // Esperar un momento y luego imprimir
    await new Promise(resolve => setTimeout(resolve, 200));

    window.print();

    // Limpiar después de imprimir
    await new Promise(resolve => setTimeout(resolve, 500));

    // NO remover título ya que no se agrega
    // removePrintTitle();

    if (printContainer && printContainer.parentNode) {
        printContainer.parentNode.removeChild(printContainer);
    }

    // Restaurar el día original
    const originalDayTab = document.querySelector(`.day-tab[data-day="${currentDay}"]`);
    if (originalDayTab) {
        originalDayTab.click();
    }
}

// Obtener título del día
function getDayTitle(dayIndex) {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const weekDateInput = document.getElementById('weekDate');

    if (weekDateInput && weekDateInput.value) {
        const selectedDate = new Date(weekDateInput.value + 'T00:00:00');
        const targetDate = new Date(selectedDate);
        targetDate.setDate(selectedDate.getDate() + dayIndex);

        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const dia = targetDate.getDate();
        const mes = meses[targetDate.getMonth()];
        const año = targetDate.getFullYear();

        return `${dias[dayIndex]} ${dia} de ${mes} de ${año}`;
    }

    return dias[dayIndex];
}

// Agregar título con fecha para impresión (DESHABILITADO - no se usa)
function addPrintTitle() {
    // Función deshabilitada - no se crea título principal
    return;
}

// Remover título de impresión (DESHABILITADO - no se usa)
function removePrintTitle() {
    // Función deshabilitada - no hay título que remover
    return;
}