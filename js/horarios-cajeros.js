// ========== VARIABLES GLOBALES ==========
let PERSONNEL = [];
let scheduleData = {};
let scheduleCodes = {}; // { "codeId": { code: 1, schedule: "09:00-13:00 / 17:00-21:00", hours: 8 } }
let nextCodeId = 1;

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

function loadCodesFromLocalStorage() {
    try {
        const savedCodes = localStorage.getItem('scheduleCodes');
        if (savedCodes) {
            scheduleCodes = JSON.parse(savedCodes);
            // Encontrar el siguiente ID disponible
            const maxId = Math.max(...Object.keys(scheduleCodes).map(k => parseInt(k)), 0);
            nextCodeId = maxId + 1;
            console.log('? C�digos cargados del localStorage');
            return true;
        }
    } catch (error) {
        console.error('Error al cargar c�digos:', error);
    }
    return false;
}

function saveCodesToLocalStorage() {
    try {
        localStorage.setItem('scheduleCodes', JSON.stringify(scheduleCodes));
        console.log('?? C�digos guardados');
    } catch (error) {
        console.error('Error al guardar c�digos:', error);
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

function getOrCreateCode(scheduleSignature) {
    if (!scheduleSignature) {
        return { code: '-', hours: 0, schedule: '-' };
    }

    // Buscar si ya existe un c�digo para este horario
    for (let codeId in scheduleCodes) {
        if (scheduleCodes[codeId].schedule === scheduleSignature) {
            return scheduleCodes[codeId];
        }
    }

    // Si no existe, crear uno nuevo
    const hours = calculateHours(scheduleSignature);
    const newCode = {
        code: nextCodeId,
        schedule: scheduleSignature,
        hours: hours
    };

    scheduleCodes[nextCodeId] = newCode;
    nextCodeId++;
    saveCodesToLocalStorage();

    return newCode;
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

    // Buscar en todas las cajas
    let personSchedule = [];

    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            const turnoData = dayData.cajas[caja][turno];
            if (turnoData.name === personId) {
                const entrada = turnoData.entrada || '';
                const salida = turnoData.salida || '';
                if (entrada && salida) {
                    personSchedule.push(`${entrada}-${salida}`);
                }
            }
        }
    }

    if (personSchedule.length === 0) {
        return { code: '-', hours: 0, schedule: '-', type: 'empty' };
    }

    // Ordenar y crear firma
    personSchedule.sort();
    const signature = personSchedule.join(' / ');

    return { ...getOrCreateCode(signature), type: 'normal' };
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

        // D�as de la semana
        let totalWeekHours = 0;
        for (let day = 0; day < 7; day++) {
            const codeInfo = getCodeForPerson(person.name, day);
            const dayCell = document.createElement('td');
            dayCell.className = `code-cell ${codeInfo.type}`;
            dayCell.textContent = codeInfo.code;
            dayCell.title = codeInfo.schedule;
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

    const sortedCodes = Object.entries(scheduleCodes).sort((a, b) => a[1].code - b[1].code);

    sortedCodes.forEach(([codeId, codeData]) => {
        const row = document.createElement('tr');
        row.dataset.codeId = codeId;

        row.innerHTML = `
            <td>
                <span class="code-display" id="code-display-${codeId}">${codeData.code}</span>
                <input type="number" class="code-edit-input" id="code-input-${codeId}" value="${codeData.code}" style="display: none;" min="1">
            </td>
            <td>${codeData.schedule}</td>
            <td>${codeData.hours}h</td>
            <td>
                <button class="code-edit-btn" onclick="editCode('${codeId}')">📝​ Editar</button>
                <button class="code-save-btn" onclick="saveCode('${codeId}')" style="display: none;">​💾​ Guardar</button>
                <button class="code-cancel-btn" onclick="cancelEditCode('${codeId}')" style="display: none;">❌ Cancelar</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function editCode(codeId) {
    const display = document.getElementById(`code-display-${codeId}`);
    const input = document.getElementById(`code-input-${codeId}`);
    const row = document.querySelector(`tr[data-code-id="${codeId}"]`);

    display.style.display = 'none';
    input.style.display = 'inline-block';

    const editBtn = row.querySelector('.code-edit-btn');
    const saveBtn = row.querySelector('.code-save-btn');
    const cancelBtn = row.querySelector('.code-cancel-btn');

    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
}

function saveCode(codeId) {
    const input = document.getElementById(`code-input-${codeId}`);
    const newCode = parseInt(input.value);

    if (newCode < 1) {
        alert('El c�digo debe ser un n�mero mayor a 0');
        return;
    }

    // Verificar si el c�digo ya existe
    for (let id in scheduleCodes) {
        if (id !== codeId && scheduleCodes[id].code === newCode) {
            alert(`El c�digo ${newCode} ya est� en uso`);
            return;
        }
    }

    scheduleCodes[codeId].code = newCode;
    saveCodesToLocalStorage();

    cancelEditCode(codeId);
    generateScheduleTable();
    generateLegend();
}

function cancelEditCode(codeId) {
    const display = document.getElementById(`code-display-${codeId}`);
    const input = document.getElementById(`code-input-${codeId}`);
    const row = document.querySelector(`tr[data-code-id="${codeId}"]`);

    display.style.display = 'inline-block';
    input.style.display = 'none';
    input.value = scheduleCodes[codeId].code;

    const editBtn = row.querySelector('.code-edit-btn');
    const saveBtn = row.querySelector('.code-save-btn');
    const cancelBtn = row.querySelector('.code-cancel-btn');

    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
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
            person.contractType,
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

                    // Actualizar nextCodeId
                    const maxId = Math.max(...Object.keys(scheduleCodes).map(k => parseInt(k)), 0);
                    nextCodeId = maxId + 1;

                    saveCodesToLocalStorage();
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

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Botones principales
    document.getElementById('manageCodesBtn').addEventListener('click', openCodesModal);
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
    document.getElementById('saveScheduleBtn').addEventListener('click', () => {
        saveCodesToLocalStorage();
        alert('? Horarios guardados correctamente');
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

    // Filtros
    document.getElementById('contractFilter').addEventListener('change', generateScheduleTable);
    document.getElementById('searchInput').addEventListener('input', generateScheduleTable);

    // Fecha
    const dateInput = document.getElementById('weekDate');
    const today = new Date();
    dateInput.valueAsDate = today;
}

// ========== INICIALIZACI�N ==========
document.addEventListener('DOMContentLoaded', async function () {
    console.log('?? Iniciando sistema de horarios por cajero...');

    // Cargar datos
    await loadPersonnelFromJSON();
    loadScheduleFromLocalStorage();
    loadCodesFromLocalStorage();

    // Inicializar interfaz
    setupEventListeners();
    generateScheduleTable();
    generateLegend();

    console.log('? Sistema iniciado correctamente');
});