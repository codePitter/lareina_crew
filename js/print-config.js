// ========== FUNCIONES PARA CONFIGURACIÓN DE IMPRESIÓN ==========

// Abrir modal de configuración de impresión
function openPrintConfigModal() {
    const modal = document.getElementById('printConfigModal');
    modal.classList.add('show');
    modal.style.display = 'flex';
}

// Cerrar modal de configuración de impresión
function closePrintConfigModal() {
    const modal = document.getElementById('printConfigModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
}

// Proceder con la impresión después de configurar
function proceedWithPrint() {
    // Obtener configuración de checkboxes
    const omitTurno1 = document.getElementById('omitTurno1Salida').checked;
    const omitTurno2 = document.getElementById('omitTurno2Salida').checked;
    const omitTurno3 = document.getElementById('omitTurno3Salida').checked;

    // Preparar números de caja (quitar emojis)
    prepareCajaNumbers();

    // Ocultar las columnas de salida seleccionadas
    hideSelectedExitColumns(omitTurno1, omitTurno2, omitTurno3);

    // Agregar título con fecha
    addPrintTitle();

    // Cerrar modal
    closePrintConfigModal();

    // Esperar un momento para que se apliquen los cambios
    setTimeout(() => {
        // Ejecutar impresión
        window.print();

        // Restaurar las columnas y remover el título después de imprimir
        setTimeout(() => {
            restoreAllColumns();
            removePrintTitle();
            restoreCajaNumbers();
        }, 500);
    }, 100);
}

// Preparar números de caja para impresión (quitar emojis)
function prepareCajaNumbers() {
    const cajaNumbers = document.querySelectorAll('.caja-number');
    cajaNumbers.forEach(caja => {
        // Obtener el texto sin emojis (solo números y letras)
        const text = caja.textContent || caja.innerText;
        const textWithoutEmojis = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();

        // Guardar el contenido HTML original
        caja.setAttribute('data-original-html', caja.innerHTML);

        // Reemplazar el contenido con solo el texto sin emojis
        caja.textContent = textWithoutEmojis;
    });

    // Formatear nombres en dropzones para mostrar Apellido + Inicial
    prepareNameDropzones();
}

// Formatear nombres para impresión (Apellido + Inicial)
function prepareNameDropzones() {
    const dropzones = document.querySelectorAll('.name-dropzone.has-name');
    dropzones.forEach(dropzone => {
        const fullName = dropzone.textContent.trim();
        if (fullName) {
            // Guardar nombre original
            dropzone.setAttribute('data-original-name', fullName);

            // Formatear nombre: detectar si tiene dos partes (nombre + apellido)
            const nameParts = fullName.trim().split(/\s+/);
            let formattedName = fullName;

            if (nameParts.length >= 2) {
                // Si tiene dos o más partes, tomar la última como apellido
                const lastName = nameParts[nameParts.length - 1];
                const firstInitial = nameParts[0].charAt(0).toUpperCase();
                formattedName = `${lastName} ${firstInitial}.`;
            } else if (nameParts.length === 1) {
                // Si solo tiene una parte, agregar la primera inicial
                const name = nameParts[0];
                const initial = name.charAt(0).toUpperCase();
                formattedName = `${name} ${initial}.`;
            }

            // Actualizar el texto del dropzone
            dropzone.textContent = formattedName;
        }
    });
}

// Restaurar números de caja después de impresión
function restoreCajaNumbers() {
    const cajaNumbers = document.querySelectorAll('.caja-number');
    cajaNumbers.forEach(caja => {
        // Restaurar contenido HTML original
        const originalHTML = caja.getAttribute('data-original-html');
        if (originalHTML) {
            caja.innerHTML = originalHTML;
            caja.removeAttribute('data-original-html');
        }
    });

    // Restaurar nombres originales en dropzones si es necesario
    restoreNameDropzones();
}

// Restaurar nombres originales en dropzones
function restoreNameDropzones() {
    const dropzones = document.querySelectorAll('.name-dropzone.has-name');
    dropzones.forEach(dropzone => {
        // Restaurar nombre original
        const originalName = dropzone.getAttribute('data-original-name');
        if (originalName) {
            dropzone.textContent = originalName;
            dropzone.removeAttribute('data-original-name');
        }
    });
}

// Agregar título con fecha para impresión
function addPrintTitle() {
    // Remover título anterior si existe
    removePrintTitle();

    // Obtener la fecha seleccionada
    const weekDateInput = document.getElementById('weekDate');
    let dateStr = 'Horario de Cajas';

    if (weekDateInput && weekDateInput.value) {
        const selectedDate = new Date(weekDateInput.value + 'T00:00:00');

        // Obtener el día de la semana activo
        const activeDayTab = document.querySelector('.day-tab.active');
        let dayOffset = 0;
        if (activeDayTab) {
            dayOffset = parseInt(activeDayTab.dataset.day) || 0;
        }

        // Calcular la fecha del día seleccionado
        const targetDate = new Date(selectedDate);
        targetDate.setDate(selectedDate.getDate() + dayOffset);

        // Formatear la fecha
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const diaSemana = dias[targetDate.getDay()];
        const dia = targetDate.getDate();
        const mes = meses[targetDate.getMonth()];
        const año = targetDate.getFullYear();

        dateStr = `Horario de Cajas - ${diaSemana} ${dia} de ${mes} de ${año}`;
    }

    // Crear el elemento de título
    const titleElement = document.createElement('div');
    titleElement.id = 'print-title';
    titleElement.textContent = dateStr;
    titleElement.style.display = 'none'; // Oculto por defecto, visible solo en impresión

    // Insertar al inicio del área de horario
    const scheduleArea = document.getElementById('scheduleArea');
    if (scheduleArea) {
        scheduleArea.insertBefore(titleElement, scheduleArea.firstChild);
    }
}

// Remover título de impresión
function removePrintTitle() {
    const existingTitle = document.getElementById('print-title');
    if (existingTitle) {
        existingTitle.remove();
    }
}

// Ocultar columnas de salida seleccionadas
function hideSelectedExitColumns(omitTurno1, omitTurno2, omitTurno3) {
    // Crear estilos dinámicos para ocultar columnas
    let styleElement = document.getElementById('print-hide-columns-style');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'print-hide-columns-style';
        document.head.appendChild(styleElement);
    }

    let css = '@media print {';

    if (omitTurno1) {
        css += `
            input[data-turno="turno1"][data-field="salida"],
            .time-input[data-turno="turno1"][data-field="salida"] {
                display: none !important;
                visibility: hidden !important;
            }
        `;
    }

    if (omitTurno2) {
        css += `
            input[data-turno="turno2"][data-field="salida"],
            .time-input[data-turno="turno2"][data-field="salida"] {
                display: none !important;
                visibility: hidden !important;
            }
        `;
    }

    if (omitTurno3) {
        css += `
            input[data-turno="turno3"][data-field="salida"],
            .time-input[data-turno="turno3"][data-field="salida"] {
                display: none !important;
                visibility: hidden !important;
            }
        `;
    }

    css += '}';
    styleElement.textContent = css;
}

// Restaurar todas las columnas
function restoreAllColumns() {
    const styleElement = document.getElementById('print-hide-columns-style');
    if (styleElement) {
        styleElement.textContent = '';
    }
}

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', (event) => {
    const modal = document.getElementById('printConfigModal');
    if (event.target === modal) {
        closePrintConfigModal();
    }

    const weekModal = document.getElementById('weekPrintConfigModal');
    if (event.target === weekModal) {
        closeWeekPrintConfigModal();
    }
});

// ========== FUNCIONES PARA IMPRESIÓN SEMANAL ==========

// Abrir modal de configuración de impresión semanal
function openWeekPrintConfigModal() {
    const modal = document.getElementById('weekPrintConfigModal');
    modal.classList.add('show');
    modal.style.display = 'flex';
}

// Cerrar modal de configuración de impresión semanal
function closeWeekPrintConfigModal() {
    const modal = document.getElementById('weekPrintConfigModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
}

// Proceder con la impresión de toda la semana
function proceedWithWeekPrint() {
    // Recopilar la configuración de cada día
    const weekConfig = [];
    for (let day = 0; day < 7; day++) {
        const dayConfig = {
            day: day,
            omitTurno1: document.querySelector(`.week-print-config[data-day="${day}"][data-turno="1"]`).checked,
            omitTurno2: document.querySelector(`.week-print-config[data-day="${day}"][data-turno="2"]`).checked,
            omitTurno3: document.querySelector(`.week-print-config[data-day="${day}"][data-turno="3"]`).checked
        };
        weekConfig.push(dayConfig);
    }

    // Cerrar modal
    closeWeekPrintConfigModal();

    // Imprimir cada día secuencialmente
    printWeekSequentially(weekConfig, 0);
}

// Imprimir cada día de la semana secuencialmente
function printWeekSequentially(weekConfig, currentDayIndex) {
    if (currentDayIndex >= 7) {
        // Terminamos de imprimir todos los días
        console.log('Impresión semanal completada');
        return;
    }

    const dayConfig = weekConfig[currentDayIndex];

    // Simular clic en el día correspondiente para cambiar la vista
    const dayTab = document.querySelector(`.day-tab[data-day="${dayConfig.day}"]`);
    if (dayTab) {
        dayTab.click();
    }

    // Esperar a que se cargue el día
    setTimeout(() => {
        // Preparar la impresión con la configuración de este día
        prepareCajaNumbers();
        hideSelectedExitColumns(dayConfig.omitTurno1, dayConfig.omitTurno2, dayConfig.omitTurno3);
        addPrintTitle();

        // Esperar un momento para que se apliquen los cambios
        setTimeout(() => {
            // Ejecutar impresión
            window.print();

            // Esperar a que termine la impresión y limpiar
            setTimeout(() => {
                restoreAllColumns();
                removePrintTitle();
                restoreCajaNumbers();

                // Continuar con el siguiente día
                printWeekSequentially(weekConfig, currentDayIndex + 1);
            }, 1000);
        }, 100);
    }, 300);
}

// Agregar efecto hover a los labels
document.addEventListener('DOMContentLoaded', () => {
    const labels = document.querySelectorAll('#printConfigModal label');
    labels.forEach(label => {
        label.addEventListener('mouseenter', () => {
            label.style.background = 'var(--light-blue)';
            label.style.transform = 'translateX(3px)';
        });
        label.addEventListener('mouseleave', () => {
            label.style.background = 'var(--bg-secondary)';
            label.style.transform = 'translateX(0)';
        });
    });
});