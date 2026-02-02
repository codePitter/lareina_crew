// // ========== VARIABLES GLOBALES ==========
let PERSONNEL = [];
let scheduleData = {};
let scheduleCodes = {}; // Códigos cargados desde /crew/Schedule codes.json  { "08:00-13:00+17:00-21:00": { codigo: "00353", alternativas: [...] } }
let viewMode = 'codes'; // 'codes' o 'schedules'

// ========== CARGA DE DATOS ==========
async function loadPersonnelFromJSON() {
    try {
        const response = await fetch('crew/personnel.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        PERSONNEL = data.personnel.filter(person => person.active);
        console.log(`? Personal cargado: ${PERSONNEL.length} personas`);
        return true;
    } catch (error) {
        console.error('? Error al cargar personal:', error);
        return false;
    }
}

function loadScheduleFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('scheduleData');
        if (savedData) {
            scheduleData = JSON.parse(savedData);
            console.log('? Horarios cargados del localStorage');
            return true;
        }
    } catch (error) {
        console.error('Error al cargar horarios:', error);
    }
    return false;
}

async function loadScheduleCodesFromJSON() {
    try {
        const response = await fetch('crew/schedule_codes.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        scheduleCodes = await response.json();
        console.log(`✅ Códigos cargados: ${Object.keys(scheduleCodes).length} combinaciones`);
        return true;
    } catch (error) {
        console.error('❌ Error al cargar schedule_codes.json:', error);
        scheduleCodes = {};
        return false;
    }
}

// ========== GENERACI�N DE C�DIGOS ==========
function getScheduleSignature(daySchedule) {
    // Crear una firma �nica para identificar el horario
    const signatures = [];

    // Recorrer todas las cajas y turnos
    for (let caja in daySchedule.cajas) {
        for (let turno in daySchedule.cajas[caja]) {
            const turnoData = daySchedule.cajas[caja][turno];
            if (turnoData.name) {
                const entrada = turnoData.entrada || '';
                const salida = turnoData.salida || '';
                if (entrada && salida) {
                    signatures.push(`${entrada}-${salida}`);
                }
            }
        }
    }

    if (signatures.length === 0) {
        return null;
    }

    // Ordenar y unir para crear firma �nica
    signatures.sort();
    return signatures.join(' / ');
}

function calculateHours(scheduleSignature) {
    if (!scheduleSignature) return 0;

    const segments = scheduleSignature.split(' / ');
    let totalMinutes = 0;

    segments.forEach(segment => {
        const [start, end] = segment.split('-');
        if (start && end) {
            const [startHour, startMin] = start.split(':').map(Number);
            const [endHour, endMin] = end.split(':').map(Number);

            const startInMinutes = startHour * 60 + startMin;
            const endInMinutes = endHour * 60 + endMin;

            totalMinutes += endInMinutes - startInMinutes;
        }
    });

    return totalMinutes / 60;
}

function lookupCode(signature) {
    // signature formato: "08:00-13:00+17:00-21:00" o "08:00-16:00"
    if (!signature) {
        return { code: '-', hours: 0, schedule: '-' };
    }

    const entry = scheduleCodes[signature];
    if (entry) {
        return {
            code: entry.codigo,
            hours: calculateHours(signature),
            schedule: signature.replace(/\+/g, ' / ')
        };
    }

    // No encontrado en el archivo: mostrar horario como código fallback
    return {
        code: '?',
        hours: calculateHours(signature),
        schedule: signature.replace(/\+/g, ' / ')
    };
}

function getCodeForPerson(personId, day) {
    if (!scheduleData[day]) {
        return { code: '-', hours: 0, schedule: '-', type: 'empty' };
    }

    const dayData = scheduleData[day];

    // Verificar francos
    if (dayData.francos && dayData.francos.includes(personId)) {
        return { code: 'F', hours: 0, schedule: 'Franco', type: 'franco' };
    }

    // Verificar licencias
    if (dayData.licencias && dayData.licencias.includes(personId)) {
        return { code: 'L', hours: 0, schedule: 'Licencia', type: 'licencia' };
    }

    // Verificar vacaciones
    if (dayData.vacaciones && dayData.vacaciones.includes(personId)) {
        return { code: 'V', hours: 0, schedule: 'Vacaciones', type: 'vacaciones' };
    }

    // Buscar en todas las cajas los turnos de esta persona
    let segments = [];

    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            const turnoData = dayData.cajas[caja][turno];
            if (turnoData.name === personId) {
                const entrada = turnoData.entrada || '';
                const salida = turnoData.salida || '';
                if (entrada && salida) {
                    segments.push(`${entrada}-${salida}`);
                }
            }
        }
    }

    if (segments.length === 0) {
        return { code: '-', hours: 0, schedule: '-', type: 'empty' };
    }

    // Ordenar y crear firma con "+" como separador (formato del JSON)
    segments.sort();
    const signature = segments.join('+');

    return { ...lookupCode(signature), type: 'normal' };
}


// ========== GENERACI�N DE LA TABLA ==========
function generateScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    tbody.innerHTML = '';

    const contractFilter = document.getElementById('contractFilter').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase();

    let filteredPersonnel = PERSONNEL;

    // Aplicar filtros
    if (contractFilter !== 'all') {
        filteredPersonnel = filteredPersonnel.filter(p => p.contractType === contractFilter);
    }

    if (searchText) {
        filteredPersonnel = filteredPersonnel.filter(p =>
            p.name.toLowerCase().includes(searchText)
        );
    }

    // Ordenar por contrato y luego por nombre
    filteredPersonnel.sort((a, b) => {
        if (a.contractType !== b.contractType) {
            return b.contractType.localeCompare(a.contractType); // Full-time primero
        }
        return a.name.localeCompare(b.name);
    });

    // Generar filas
    filteredPersonnel.forEach(person => {
        const row = document.createElement('tr');
        row.className = person.contractType === 'Full-time' ? 'full-time' : 'part-time';

        // Contrato
        const contractCell = document.createElement('td');
        contractCell.className = 'contract-cell';
        contractCell.innerHTML = `<span class="contract-badge ${person.contractType === 'Full-time' ? 'full-time' : 'part-time'}">${person.contractType}</span>`;
        row.appendChild(contractCell);

        // ID
        const idCell = document.createElement('td');
        idCell.className = 'id-cell';
        idCell.textContent = person.id;
        row.appendChild(idCell);

        // Nombre
        const nameCell = document.createElement('td');
        nameCell.className = 'name-cell';
        nameCell.textContent = person.name;
        row.appendChild(nameCell);

        // Días de la semana
        let totalWeekHours = 0;
        for (let day = 0; day < 7; day++) {
            const codeInfo = getCodeForPerson(person.name, day);
            const dayCell = document.createElement('td');
            dayCell.className = `code-cell ${codeInfo.type}`;

            // Mostrar código o horario según el modo de vista
            if (viewMode === 'codes') {
                dayCell.textContent = codeInfo.code;
                dayCell.title = codeInfo.schedule;
            } else {
                // Modo horarios: mostrar código (negro) + horario (gris)
                dayCell.innerHTML = `
                    <div class="code-with-schedule">
                        <div class="code-part">${codeInfo.code}</div>
                        <div class="schedule-part">${codeInfo.schedule}</div>
                    </div>
                `;
                dayCell.title = `Código: ${codeInfo.code}`;
                dayCell.classList.add('schedule-view');
            }

            row.appendChild(dayCell);

            totalWeekHours += codeInfo.hours;
        }

        // Total de horas
        const totalCell = document.createElement('td');
        totalCell.className = 'total-cell';

        if (totalWeekHours < person.weeklyHours) {
            totalCell.classList.add('under-hours');
        } else if (totalWeekHours > person.weeklyHours) {
            totalCell.classList.add('over-hours');
        }

        totalCell.textContent = `${totalWeekHours}h / ${person.weeklyHours}h`;
        row.appendChild(totalCell);

        // Horas extras
        const extraHoursCell = document.createElement('td');
        extraHoursCell.className = 'extra-hours-cell';
        const extraHours = totalWeekHours - person.weeklyHours;

        if (extraHours > 0) {
            extraHoursCell.classList.add('has-extra');
            extraHoursCell.textContent = `+${extraHours}h`;
        } else if (extraHours < 0) {
            extraHoursCell.classList.add('has-deficit');
            extraHoursCell.textContent = `${extraHours}h`;
        } else {
            extraHoursCell.textContent = '0h';
        }
        row.appendChild(extraHoursCell);

        tbody.appendChild(row);
    });

    updateStats(filteredPersonnel.length);
}

function updateStats(filteredCount) {
    const totalActive = PERSONNEL.length;
    document.getElementById('totalEmployees').textContent = `Total: ${totalActive}`;
    document.getElementById('activeEmployees').textContent = `Mostrando: ${filteredCount}`;
}

// ========== LEYENDA DE C�DIGOS ==========
function generateLegend() {
    const legendContent = document.getElementById('legendContent');
    legendContent.innerHTML = '';

    // Agregar c�digos especiales
    const specialCodes = [
        { code: 'F', schedule: 'Franco', hours: 0 },
        { code: 'L', schedule: 'Licencia', hours: 0 },
        { code: 'V', schedule: 'Vacaciones', hours: 0 },
        { code: '-', schedule: 'Sin asignar', hours: 0 }
    ];

    specialCodes.forEach(codeData => {
        const item = createLegendItem(codeData.code, codeData.schedule, codeData.hours);
        legendContent.appendChild(item);
    });

    // Agregar c�digos de horarios
    const sortedCodes = Object.values(scheduleCodes).sort((a, b) => a.code - b.code);
    sortedCodes.forEach(codeData => {
        const item = createLegendItem(codeData.code, codeData.schedule, codeData.hours);
        legendContent.appendChild(item);
    });
}

function createLegendItem(code, schedule, hours) {
    const item = document.createElement('div');
    item.className = 'legend-item';

    item.innerHTML = `
        <div class="legend-code">${code}</div>
        <div class="legend-schedule">${schedule}</div>
        <div class="legend-hours">${hours}h</div>
    `;

    return item;
}

// ========== MODAL DE C�DIGOS ==========
function openCodesModal() {
    const modal = document.getElementById('codesModal');
    modal.classList.add('show');
    renderCodesTable();
}

function closeCodesModal() {
    const modal = document.getElementById('codesModal');
    modal.classList.remove('show');
}

function renderCodesTable() {
    const tbody = document.getElementById('codesTableBody');
    tbody.innerHTML = '';

    const usedCodes = getUsedCodesThisWeek();
    usedCodes.sort((a, b) => a.code.localeCompare(b.code));

    usedCodes.forEach(codeData => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${codeData.code}</td>
            <td>${codeData.schedule}</td>
            <td>${codeData.hours}h</td>
            <td>-</td>
        `;
        tbody.appendChild(row);
    });
}

// ========== EXPORTAR A EXCEL ==========
function exportToExcel() {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Horarios
    const scheduleData = [];

    // Encabezados
    scheduleData.push([
        'Contrato', 'ID', 'Cajero/a', 'Lun', 'Mar', 'Mi�', 'Jue', 'Vie', 'S�b', 'Dom', 'Total Hrs'
    ]);

    // Datos
    PERSONNEL.forEach(person => {
        const row = [
            person.weeklyHours || 48,
            person.id,
            person.name
        ];

        let totalWeekHours = 0;
        for (let day = 0; day < 7; day++) {
            const codeInfo = getCodeForPerson(person.name, day);
            row.push(codeInfo.code);
            totalWeekHours += codeInfo.hours;
        }

        row.push(`${totalWeekHours}h / ${person.weeklyHours}h`);
        scheduleData.push(row);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(scheduleData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Horarios');

    // Hoja 2: Leyenda de C�digos
    const legendData = [];
    legendData.push(['C�digo', 'Horario', 'Horas']);

    // C�digos especiales
    legendData.push(['F', 'Franco', '0h']);
    legendData.push(['L', 'Licencia', '0h']);
    legendData.push(['V', 'Vacaciones', '0h']);
    legendData.push(['-', 'Sin asignar', '0h']);

    // C�digos de horarios
    const sortedCodes = Object.values(scheduleCodes).sort((a, b) => a.code - b.code);
    sortedCodes.forEach(codeData => {
        legendData.push([codeData.code, codeData.schedule, `${codeData.hours}h`]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(legendData);
    XLSX.utils.book_append_sheet(wb, ws2, 'C�digos');

    // Obtener fecha
    const dateInput = document.getElementById('weekDate');
    const selectedDate = dateInput.value || new Date().toISOString().split('T')[0];

    // Descargar
    XLSX.writeFile(wb, `Horarios_Cajeros_${selectedDate}.xlsx`);
}

// ========== EXPORTAR/IMPORTAR C�DIGOS ==========
function exportCodesToJSON() {
    const dataStr = JSON.stringify(scheduleCodes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codigos_horarios_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('? C�digos exportados correctamente');
}

function importCodesFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedCodes = JSON.parse(event.target.result);

                if (typeof importedCodes === 'object') {
                    scheduleCodes = importedCodes;
                    renderCodesTable();
                    generateScheduleTable();
                    generateLegend();
                    alert('? C�digos importados correctamente');
                } else {
                    alert('? El archivo no tiene el formato correcto');
                }
            } catch (error) {
                console.error('Error al importar:', error);
                alert('? Error al leer el archivo');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}


// ========== TOGGLE VIEW MODE ==========
function toggleViewMode() {
    const btn = document.getElementById('viewToggleBtn');

    if (viewMode === 'codes') {
        viewMode = 'schedules';
        btn.textContent = '🔄 Ver Códigos';
        btn.title = 'Cambiar a vista de códigos';
    } else {
        viewMode = 'codes';
        btn.textContent = '🔄 Ver Horarios Completos';
        btn.title = 'Cambiar a vista de horarios completos';
    }

    // Regenerar la tabla
    generateScheduleTable();

    console.log(`Vista cambiada a: ${viewMode}`);
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Botones principales
    document.getElementById('manageCodesBtn').addEventListener('click', openCodesModal);
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
    document.getElementById('saveScheduleBtn').addEventListener('click', () => {
        alert('✅ Los códigos se cargan automáticamente desde Schedule codes.json');
    });

    // Modal
    document.querySelector('.close-modal').addEventListener('click', closeCodesModal);
    document.getElementById('codesModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeCodesModal();
        }
    });

    // Botones del modal
    document.getElementById('exportCodesBtn').addEventListener('click', exportCodesToJSON);
    document.getElementById('importCodesBtn').addEventListener('click', importCodesFromJSON);

    // Botón de cambio de vista
    document.getElementById('viewToggleBtn').addEventListener('click', toggleViewMode);

    // Filtros
    document.getElementById('contractFilter').addEventListener('change', generateScheduleTable);
    document.getElementById('searchInput').addEventListener('input', generateScheduleTable);

    // Fecha - Forzar selección de lunes
    const dateInput = document.getElementById('weekDate');
    const today = new Date();

    // Calcular el lunes de la semana actual
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToSubtract);

    dateInput.valueAsDate = monday;

    // Agregar listener para forzar selección de lunes
    dateInput.addEventListener('change', function (event) {
        const input = event.target;
        const selectedDate = new Date(input.value + 'T00:00:00');
        const dayOfWeek = selectedDate.getDay();

        // Si no es lunes, ajustar al lunes más cercano
        if (dayOfWeek !== 1) {
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const monday = new Date(selectedDate);
            monday.setDate(selectedDate.getDate() - daysToSubtract);
            input.valueAsDate = monday;
        }
    });
}

// ========== INICIALIZACI�N ==========
document.addEventListener('DOMContentLoaded', async function () {
    console.log('?? Iniciando sistema de horarios por cajero...');

    // Cargar datos
    await loadPersonnelFromJSON();
    loadScheduleFromLocalStorage();
    await loadScheduleCodesFromJSON();

    // Inicializar interfaz
    setupEventListeners();
    setupHamburgerMenu();
    generateScheduleTable();
    generateLegend();

    console.log('? Sistema iniciado correctamente');
});


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

    // Conectar botones del menú
    const menuExportExcel = document.getElementById('menuExportExcel');
    const menuSaveSchedule = document.getElementById('menuSaveSchedule');
    const menuManageCodes = document.getElementById('menuManageCodes');
    const menuViewToggle = document.getElementById('menuViewToggle');

    if (menuExportExcel) {
        menuExportExcel.addEventListener('click', () => {
            closeMenu();
            document.getElementById('exportExcelBtn').click();
        });
    }

    if (menuSaveSchedule) {
        menuSaveSchedule.addEventListener('click', () => {
            closeMenu();
            document.getElementById('saveScheduleBtn').click();
        });
    }

    if (menuManageCodes) {
        menuManageCodes.addEventListener('click', () => {
            closeMenu();
            document.getElementById('manageCodesBtn').click();
        });
    }

    if (menuViewToggle) {
        menuViewToggle.addEventListener('click', () => {
            closeMenu();
            toggleViewMode();
        });
    }

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sideMenu.classList.contains('open')) {
            closeMenu();
        }
    });
}