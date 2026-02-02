// ========== VARIABLES GLOBALES ==========
let managersSchedule = {};
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DEFAULT_MANAGERS = ['Gonzalez, Patricia', 'Duppa, Soledad', 'Aranda, Facuando'];

// ========== INICIALIZACIÓN ==========

// ========== MENU HAMBURGUESA ========== 
function setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenuBtn = document.getElementById('closeMenuBtn');

    if (!hamburgerBtn || !sideMenu || !menuOverlay) return;

    // Toggle menú (abrir/cerrar)
    hamburgerBtn.addEventListener('click', () => {
        const isOpen = sideMenu.classList.contains('open');

        if (isOpen) {
            // Cerrar menú
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('active');
            hamburgerBtn.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            // Abrir menú
            sideMenu.classList.add('open');
            menuOverlay.classList.add('active');
            hamburgerBtn.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    // Cerrar menú
    function closeMenu() {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }
    menuOverlay.addEventListener('click', closeMenu);

    // Conectar botones del menú con las funciones existentes
    document.getElementById('menuExportPDF').addEventListener('click', () => {
        closeMenu();
        document.getElementById('exportPDF').click();
    });

    document.getElementById('menuSaveBtn').addEventListener('click', () => {
        closeMenu();
        document.getElementById('saveBtn').click();
    });

    document.getElementById('menuLoadBtn').addEventListener('click', () => {
        closeMenu();
        document.getElementById('loadBtn').click();
    });

    document.getElementById('menuClearBtn').addEventListener('click', () => {
        closeMenu();
        document.getElementById('clearBtn').click();
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sideMenu.classList.contains('open')) {
            closeMenu();
        }
    });
}
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Iniciando sistema de horarios de encargados...');

    // Configurar fecha
    setTodayDate();

    // Cargar datos guardados o inicializar
    const dataLoaded = loadFromLocalStorage();
    if (!dataLoaded) {
        initializeSchedule();
    }

    // Generar interfaz
    generateWeekView();

    // Event listeners
    setupEventListeners();
    setupHamburgerMenu();

    console.log('✅ Sistema iniciado correctamente');
});

// ========== INICIALIZACIÓN DE DATOS ==========
function initializeSchedule() {
    managersSchedule = {};

    for (let day = 0; day < 7; day++) {
        managersSchedule[day] = {
            managers: DEFAULT_MANAGERS.map((name, index) => ({
                id: `manager-${day}-${index}`,
                name: name,
                isExtra: false,
                shifts: {
                    turno1: { entrada: '', salida: '' },
                    turno2: { entrada: '', salida: '' },
                    turno3: { entrada: '', salida: '' }
                }
            }))
        };
    }

    saveToLocalStorage();
}

// ========== GENERAR VISTA SEMANAL ==========
function generateWeekView() {
    const container = document.getElementById('weekContainer');
    container.innerHTML = '';

    const weekDate = document.getElementById('weekDate').value;
    const baseDate = weekDate ? new Date(weekDate + 'T00:00:00') : new Date();

    for (let day = 0; day < 7; day++) {
        const dayData = managersSchedule[day];
        const daySection = createDaySection(day, dayData, baseDate);
        container.appendChild(daySection);
    }
}

function createDaySection(dayIndex, dayData, baseDate) {
    const section = document.createElement('div');
    section.className = 'day-section';
    section.dataset.day = dayIndex;

    // Calcular fecha del día
    const dayDate = new Date(baseDate);
    dayDate.setDate(baseDate.getDate() + dayIndex);
    const dateStr = formatDate(dayDate);

    // Header
    const header = document.createElement('div');
    header.className = 'day-header';
    header.innerHTML = `
        <div class="day-title">${DAYS[dayIndex].toUpperCase()}</div>
        <div class="day-date">${dateStr}</div>
    `;
    section.appendChild(header);

    // Tabla
    const table = document.createElement('table');
    table.className = 'day-table';

    // Thead
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Encargado/a</th>
            <th>Turno 1</th>
            <th>Turno 2</th>
            <th>Turno 3</th>
        </tr>
    `;
    table.appendChild(thead);

    // Tbody
    const tbody = document.createElement('tbody');
    tbody.id = `tbody-day-${dayIndex}`;

    dayData.managers.forEach((manager, index) => {
        const row = createManagerRow(dayIndex, manager, index);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    section.appendChild(table);

    // Botón agregar
    const addBtn = document.createElement('button');
    addBtn.className = 'add-row-btn';
    addBtn.innerHTML = '➕ Agregar Encargado';
    addBtn.onclick = () => addManager(dayIndex);
    section.appendChild(addBtn);

    return section;
}

function createManagerRow(dayIndex, manager, managerIndex) {
    const row = document.createElement('tr');
    row.dataset.managerId = manager.id;

    if (manager.isExtra) {
        row.classList.add('extra-row');
    }

    // Celda nombre
    const nameCell = document.createElement('td');
    nameCell.className = 'name-cell';

    if (manager.isExtra) {
        nameCell.innerHTML = `
            <button class="delete-row-btn" onclick="deleteManager(${dayIndex}, '${manager.id}')">🗑️</button>
            <input type="text" class="name-input" value="${manager.name}" 
                   onchange="updateManagerName(${dayIndex}, '${manager.id}', this.value)">
        `;
    } else {
        nameCell.innerHTML = `
            <input type="text" class="name-input" value="${manager.name}" 
                   onchange="updateManagerName(${dayIndex}, '${manager.id}', this.value)">
        `;
    }

    row.appendChild(nameCell);

    // Celdas de turnos
    ['turno1', 'turno2', 'turno3'].forEach(turno => {
        const cell = document.createElement('td');
        const shiftValue = manager.shifts[turno].entrada || manager.shifts[turno].salida
            ? `${manager.shifts[turno].entrada || ''} - ${manager.shifts[turno].salida || ''}`
            : '';
        cell.innerHTML = `
            <input type="text" class="shift-input" value="${shiftValue}" placeholder="ej: 08:00 - 16:00"
                   onchange="updateShiftText(${dayIndex}, '${manager.id}', '${turno}', this.value)">
        `;
        row.appendChild(cell);
    });

    return row;
}

// ========== FUNCIONES DE GESTIÓN ==========
function addManager(dayIndex) {
    const dayData = managersSchedule[dayIndex];
    const newId = `manager-${dayIndex}-${Date.now()}`;

    const newManager = {
        id: newId,
        name: 'Nuevo Encargado',
        isExtra: true,
        shifts: {
            turno1: { entrada: '', salida: '' },
            turno2: { entrada: '', salida: '' },
            turno3: { entrada: '', salida: '' }
        }
    };

    dayData.managers.push(newManager);
    saveToLocalStorage();

    // Regenerar solo ese día
    regenerateDay(dayIndex);

    console.log(`✅ Encargado agregado al ${DAYS[dayIndex]}`);
}

function deleteManager(dayIndex, managerId) {
    if (!confirm('¿Eliminar este encargado?')) return;

    const dayData = managersSchedule[dayIndex];
    dayData.managers = dayData.managers.filter(m => m.id !== managerId);

    saveToLocalStorage();
    regenerateDay(dayIndex);

    console.log(`🗑️ Encargado eliminado del ${DAYS[dayIndex]}`);
}

function updateManagerName(dayIndex, managerId, newName) {
    const manager = managersSchedule[dayIndex].managers.find(m => m.id === managerId);
    if (manager) {
        manager.name = newName;
        saveToLocalStorage();
    }
}

function updateShiftText(dayIndex, managerId, turno, value) {
    const manager = managersSchedule[dayIndex].managers.find(m => m.id === managerId);
    if (manager) {
        // Parsear el texto ingresado (ej: "08:00 - 16:00")
        const parts = value.split('-').map(p => p.trim());
        manager.shifts[turno].entrada = parts[0] || '';
        manager.shifts[turno].salida = parts[1] || '';
        saveToLocalStorage();
    }
}

function regenerateDay(dayIndex) {
    const weekDate = document.getElementById('weekDate').value;
    const baseDate = weekDate ? new Date(weekDate + 'T00:00:00') : new Date();

    const dayData = managersSchedule[dayIndex];
    const newSection = createDaySection(dayIndex, dayData, baseDate);

    const oldSection = document.querySelector(`.day-section[data-day="${dayIndex}"]`);
    if (oldSection) {
        oldSection.replaceWith(newSection);
    }
}

// ========== ALMACENAMIENTO LOCAL ==========
function saveToLocalStorage() {
    try {
        localStorage.setItem('managersSchedule', JSON.stringify(managersSchedule));
        console.log('💾 Datos guardados');
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar los datos');
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('managersSchedule');
        if (saved) {
            managersSchedule = JSON.parse(saved);
            console.log('📂 Datos cargados');
            return true;
        }
    } catch (error) {
        console.error('Error al cargar:', error);
    }
    return false;
}

function clearAllData() {
    if (!confirm('¿Eliminar TODOS los horarios? Esta acción no se puede deshacer.')) return;

    localStorage.removeItem('managersSchedule');
    initializeSchedule();
    generateWeekView();

    alert('✅ Todos los datos han sido eliminados');
}

// ========== EXPORTAR/IMPORTAR JSON ==========
function exportToJSON() {
    const dataStr = JSON.stringify(managersSchedule, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');

    const weekDate = document.getElementById('weekDate').value || new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `horarios_encargados_${weekDate}.json`;
    link.click();

    URL.revokeObjectURL(url);
    alert('✅ Datos exportados correctamente');
}

function importFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);

                if (typeof imported === 'object' && imported[0]) {
                    managersSchedule = imported;
                    saveToLocalStorage();
                    generateWeekView();
                    alert('✅ Datos importados correctamente');
                } else {
                    alert('❌ Formato de archivo incorrecto');
                }
            } catch (error) {
                console.error('Error al importar:', error);
                alert('❌ Error al leer el archivo');
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

// ========== EXPORTAR A PDF ==========
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para más espacio

    const weekDate = document.getElementById('weekDate').value || new Date().toISOString().split('T')[0];
    const baseDate = new Date(weekDate + 'T00:00:00');

    // Título
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Horarios de Encargados', 148, 15, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text('Horarios de Encargados', 148, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Semana del ${formatDate(baseDate)}`, 148, 22, { align: 'center' });

    let yPosition = 30;

    // Por cada día
    for (let day = 0; day < 7; day++) {
        const dayData = managersSchedule[day];

        // Verificar si necesitamos nueva página
        if (yPosition > 170) {
            doc.addPage();
            yPosition = 20;
        }

        // Calcular fecha del día
        const dayDate = new Date(baseDate);
        dayDate.setDate(baseDate.getDate() + day);

        // Título del día
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(102, 126, 234);
        doc.rect(10, yPosition, 277, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(`${DAYS[day].toUpperCase()} - ${formatDate(dayDate)}`, 15, yPosition + 6);

        yPosition += 10;

        // Preparar datos de la tabla
        const tableData = [];

        dayData.managers.forEach(manager => {
            const row = [
                manager.name,
                formatShift(manager.shifts.turno1),
                formatShift(manager.shifts.turno2),
                formatShift(manager.shifts.turno3)
            ];
            tableData.push(row);
        });

        // Si no hay datos, agregar fila vacía
        if (tableData.length === 0) {
            tableData.push(['Sin encargados asignados', '-', '-', '-']);
        }

        // Crear tabla
        doc.autoTable({
            startY: yPosition,
            head: [['Encargado/a', 'Turno 1', 'Turno 2', 'Turno 3']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [243, 244, 246],
                textColor: [31, 41, 55],
                fontStyle: 'bold',
                halign: 'left',
                fontSize: 10
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 3,
                textColor: [31, 41, 55]
            },
            columnStyles: {
                0: { cellWidth: 70, fontStyle: 'bold' },
                1: { cellWidth: 65, halign: 'center' },
                2: { cellWidth: 65, halign: 'center' },
                3: { cellWidth: 65, halign: 'center' }
            },
            margin: { left: 10, right: 10 },
            didParseCell: function (data) {
                // Resaltar filas extras (aunque en PDF no se distinguen visualmente)
                if (data.section === 'body' && data.row.index >= 3) {
                    data.cell.styles.fillColor = [254, 243, 199];
                }
            }
        });

        yPosition = doc.lastAutoTable.finalY + 8;
    }

    // Guardar PDF
    doc.save(`Horarios_Encargados_${weekDate}.pdf`);

    console.log('📄 PDF generado correctamente');
}

function formatShift(shift) {
    if (!shift.entrada && !shift.salida) {
        return '-';
    }

    if (shift.entrada && shift.salida) {
        return `${shift.entrada} - ${shift.salida}`;
    }

    if (shift.entrada) {
        return `${shift.entrada} -`;
    }

    if (shift.salida) {
        return `- ${shift.salida}`;
    }

    return '-';
}

// ========== UTILIDADES ==========
function setTodayDate() {
    const dateInput = document.getElementById('weekDate');
    const today = new Date();

    // Calcular el lunes de la semana actual
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Si es domingo, restar 6 días
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToSubtract);

    dateInput.valueAsDate = monday;

    // Agregar listener para forzar selección de lunes
    dateInput.addEventListener('change', forceMonday);
}

// Forzar que la fecha seleccionada sea siempre un lunes
function forceMonday(event) {
    const input = event.target;
    const selectedDate = new Date(input.value + 'T00:00:00');
    const dayOfWeek = selectedDate.getDay();

    // Si no es lunes, ajustar al lunes más cercano
    if (dayOfWeek !== 1) {
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(selectedDate);
        monday.setDate(selectedDate.getDate() - daysToSubtract);
        input.valueAsDate = monday;

        // Regenerar la vista con el lunes correcto
        generateWeekView();
    }
}

function formatDate(date) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} de ${month}, ${year}`;
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Botones principales
    document.getElementById('exportPDF').addEventListener('click', exportToPDF);
    document.getElementById('saveBtn').addEventListener('click', exportToJSON);
    document.getElementById('loadBtn').addEventListener('click', importFromJSON);
    document.getElementById('clearBtn').addEventListener('click', clearAllData);

    // Cambio de fecha
    document.getElementById('weekDate').addEventListener('change', generateWeekView);

    // Guardado automático cada 30 segundos
    setInterval(() => {
        saveToLocalStorage();
    }, 30000);
}

// ========== FUNCIONES GLOBALES PARA ONCLICK ==========
window.deleteManager = deleteManager;
window.updateManagerName = updateManagerName;
window.updateShiftText = updateShiftText;