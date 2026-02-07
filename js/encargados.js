// ========== VARIABLES GLOBALES ==========
let MANAGERS_LIST = [];
let ALL_PERSONNEL_LIST = [];
let currentDay = 0;
let managersScheduleData = {};
let dynamicRows = [];

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_NAMES_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

let draggedName = null;

// ========== CARGA DE ENCARGADOS Y PERSONAL ==========
async function loadManagersFromJSON() {
    try {
        const response = await fetch('crew/personnel.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        MANAGERS_LIST = data.personnel
            .filter(person => person.active && person.isManager)
            .map(person => person.name)
            .sort();

        ALL_PERSONNEL_LIST = data.personnel
            .filter(person => person.active)
            .map(person => person.name)
            .sort();

        console.log(`✅ Encargados cargados: ${MANAGERS_LIST.length}`);
        console.log(`✅ Personal total: ${ALL_PERSONNEL_LIST.length}`);
        return true;
    } catch (error) {
        console.error('❌ Error al cargar personal:', error);
        MANAGERS_LIST = [];
        ALL_PERSONNEL_LIST = [];
        return false;
    }
}

// ========== ALMACENAMIENTO LOCAL ==========
function saveToLocalStorage() {
    try {
        localStorage.setItem('managersScheduleData', JSON.stringify(managersScheduleData));
        console.log('💾 Datos guardados');
    } catch (error) {
        console.error('Error al guardar:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('managersScheduleData');
        if (savedData) {
            managersScheduleData = JSON.parse(savedData);
            console.log('✅ Datos cargados');
            return true;
        }
    } catch (error) {
        console.error('Error al cargar:', error);
    }
    return false;
}

function saveDynamicRowsToLocalStorage() {
    try {
        localStorage.setItem('managersDynamicRows', JSON.stringify(dynamicRows));
    } catch (error) {
        console.error('Error al guardar filas dinámicas:', error);
    }
}

function loadDynamicRowsFromLocalStorage() {
    try {
        const saved = localStorage.getItem('managersDynamicRows');
        if (saved) {
            dynamicRows = JSON.parse(saved);
            console.log('Filas dinámicas cargadas:', dynamicRows.length);
        }
    } catch (error) {
        console.error('Error al cargar filas dinámicas:', error);
        dynamicRows = [];
    }
}

function clearAllData() {
    if (!confirm('¿Eliminar TODOS los horarios? Esta acción no se puede deshacer.')) return;
    localStorage.removeItem('managersScheduleData');
    localStorage.removeItem('managersDynamicRows');
    dynamicRows = [];
    initializeScheduleData();
    regenerateScheduleGrid();
    generateManagersList();
    alert('✅ Todos los datos han sido eliminados');
}

function exportToJSON() {
    const dataStr = JSON.stringify(managersScheduleData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `horarios_encargados_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('✅ Guardado correctamente');
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
                if (imported && typeof imported === 'object') {
                    managersScheduleData = imported;
                    saveToLocalStorage();
                    loadSchedule(currentDay);
                    generateManagersList();
                    alert('✅ Importado correctamente');
                } else {
                    alert('❌ Formato incorrecto');
                }
            } catch (error) {
                alert('❌ Error al leer');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function initializeScheduleData() {
    for (let day = 0; day < 7; day++) {
        managersScheduleData[day] = {
            cajas: {},
            francos: [],
            licencias: [],
            vacaciones: []
        };
        const totalCajas = 3 + (dynamicRows ? dynamicRows.length : 0);
        for (let caja = 1; caja <= totalCajas; caja++) {
            managersScheduleData[day].cajas[caja] = {
                turno1: { name: '', entrada: '', salida: '' },
                turno2: { name: '', entrada: '', salida: '' },
                turno3: { name: '', entrada: '', salida: '' }
            };
        }
    }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 Iniciando sistema de encargados...');

    await loadManagersFromJSON();
    loadDynamicRowsFromLocalStorage();

    const dataLoaded = loadFromLocalStorage();
    if (!dataLoaded) {
        initializeScheduleData();
    }

    setTodayDate();
    generateScheduleGrid();
    generateManagersList();
    setupEventListeners();
    setupHamburgerMenu();
    loadSchedule(currentDay);

    console.log('✅ Sistema listo');
});

function setTodayDate() {
    const today = new Date();
    const dateInput = document.getElementById('weekDate');
    if (!dateInput) return;

    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToSubtract);
    dateInput.valueAsDate = monday;
    dateInput.addEventListener('change', forceMonday);
}

function forceMonday(event) {
    const input = event.target;
    const selectedDate = new Date(input.value + 'T00:00:00');
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek !== 1) {
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(selectedDate);
        monday.setDate(selectedDate.getDate() - daysToSubtract);
        input.valueAsDate = monday;
    }
}

// ========== VALIDAR SI PERSONA ESTÁ EN OTRA SECCIÓN ==========
function isPersonInSpecialSection(name, currentDay) {
    const dayData = managersScheduleData[currentDay];
    if (!dayData) return false;

    return (dayData.francos && dayData.francos.includes(name)) ||
        (dayData.licencias && dayData.licencias.includes(name)) ||
        (dayData.vacaciones && dayData.vacaciones.includes(name));
}

function isPersonInGrid(name, currentDay) {
    const dayData = managersScheduleData[currentDay];
    if (!dayData || !dayData.cajas) return false;

    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            if (dayData.cajas[caja][turno].name === name) {
                return true;
            }
        }
    }
    return false;
}

// ========== GENERAR GRID DE HORARIOS ==========
function generateScheduleGrid() {
    const grid = document.getElementById('scheduleGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const headerRow = document.createElement('div');
    headerRow.className = 'header-row';

    const emptyCaja = document.createElement('div');
    emptyCaja.className = 'caja-number-header';
    emptyCaja.textContent = '#';
    headerRow.appendChild(emptyCaja);

    ['T1', 'T2', 'T3'].forEach((t) => {
        const header = document.createElement('div');
        header.className = 'turno-header';
        header.innerHTML = `${t} <span class="turno-counter" id="counter-${t.toLowerCase()}">(0)</span>`;
        headerRow.appendChild(header);
    });
    grid.appendChild(headerRow);

    for (let i = 1; i <= 3; i++) {
        const row = document.createElement('div');
        row.className = 'caja-row manager-row';

        const cajaNumber = document.createElement('div');
        cajaNumber.className = 'caja-number';
        cajaNumber.innerHTML = `👔${i}`;
        row.appendChild(cajaNumber);

        for (let turno = 1; turno <= 3; turno++) {
            const turnoBlock = createTurnoBlock(i, turno);
            row.appendChild(turnoBlock);
        }
        grid.appendChild(row);
    }

    const addRowButton = document.createElement('div');
    addRowButton.className = 'add-row-button-container';
    addRowButton.innerHTML = `<button class="add-row-btn" id="addRowBtn">➕ Agregar Encargado Extra</button>`;
    grid.appendChild(addRowButton);

    const addBtn = document.getElementById('addRowBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addDynamicRow);
    }

    if (dynamicRows && dynamicRows.length > 0) {
        dynamicRows.forEach((rowData, index) => {
            grid.appendChild(createDynamicRow(rowData.label, rowData.cajaNum, index));
        });
    }
}

function createTurnoBlock(cajaNum, turnoNum) {
    const block = document.createElement('div');
    block.className = 'turno-block';
    const turnoContent = document.createElement('div');
    turnoContent.className = 'turno-content';

    const dropzone = document.createElement('div');
    dropzone.className = 'name-dropzone';
    dropzone.textContent = 'Arrastrar';
    dropzone.dataset.caja = cajaNum;
    dropzone.dataset.turno = `turno${turnoNum}`;
    dropzone.dataset.dropzone = 'name';

    dropzone.addEventListener('dragover', handleDragOver);
    dropzone.addEventListener('dragleave', handleDragLeave);
    dropzone.addEventListener('drop', handleDrop);
    dropzone.addEventListener('dblclick', handleDropzoneDblClick);

    turnoContent.appendChild(dropzone);

    const entradaInput = document.createElement('input');
    entradaInput.type = 'time';
    entradaInput.className = 'time-input';
    entradaInput.dataset.caja = cajaNum;
    entradaInput.dataset.turno = `turno${turnoNum}`;
    entradaInput.dataset.field = 'entrada';
    entradaInput.addEventListener('change', handleTimeChange);

    const separator = document.createElement('span');
    separator.className = 'time-separator';
    separator.textContent = '→';

    const salidaInput = document.createElement('input');
    salidaInput.type = 'time';
    salidaInput.className = 'time-input';
    salidaInput.dataset.caja = cajaNum;
    salidaInput.dataset.turno = `turno${turnoNum}`;
    salidaInput.dataset.field = 'salida';
    salidaInput.addEventListener('change', handleTimeChange);

    turnoContent.appendChild(entradaInput);
    turnoContent.appendChild(separator);
    turnoContent.appendChild(salidaInput);
    block.appendChild(turnoContent);

    return block;
}

function createDynamicRow(label, cajaNum, index) {
    const row = document.createElement('div');
    row.className = 'caja-row dynamic-row';
    row.dataset.dynamicIndex = index;

    const cajaLabel = document.createElement('div');
    cajaLabel.className = 'caja-number dynamic-label';
    cajaLabel.innerHTML = `<span class="dynamic-label-text">${label}</span><button class="remove-row-btn" onclick="removeDynamicRow(${index})">✖️</button>`;
    row.appendChild(cajaLabel);

    for (let turno = 1; turno <= 3; turno++) {
        row.appendChild(createTurnoBlock(cajaNum, turno));
    }
    return row;
}

function addDynamicRow() {
    const label = prompt('Nombre para el nuevo encargado:');
    if (label === null) return;

    const usedCajas = dynamicRows.map(r => r.cajaNum);
    let nextCajaNum = 4;
    while (usedCajas.includes(nextCajaNum)) nextCajaNum++;

    dynamicRows.push({ label: label.trim() || 'Extra', cajaNum: nextCajaNum });

    for (let day = 0; day < 7; day++) {
        if (!managersScheduleData[day]) {
            managersScheduleData[day] = {
                cajas: {},
                francos: [],
                licencias: [],
                vacaciones: []
            };
        }
        managersScheduleData[day].cajas[nextCajaNum] = {
            turno1: { name: '', entrada: '', salida: '' },
            turno2: { name: '', entrada: '', salida: '' },
            turno3: { name: '', entrada: '', salida: '' }
        };
    }

    saveDynamicRowsToLocalStorage();
    saveToLocalStorage();
    regenerateScheduleGrid();
}

function removeDynamicRow(index) {
    if (!confirm('¿Eliminar esta fila?')) return;

    if (!dynamicRows || index >= dynamicRows.length) return;

    const rowData = dynamicRows[index];
    for (let day = 0; day < 7; day++) {
        if (managersScheduleData[day] && managersScheduleData[day].cajas) {
            delete managersScheduleData[day].cajas[rowData.cajaNum];
        }
    }
    dynamicRows.splice(index, 1);
    saveDynamicRowsToLocalStorage();
    saveToLocalStorage();
    regenerateScheduleGrid();
}

function regenerateScheduleGrid() {
    generateScheduleGrid();
    loadSchedule(currentDay);
}

// ========== GENERAR LISTA DE PERSONAL ==========
function generateManagersList() {
    const list = document.getElementById('personnelList');
    if (!list) return;
    list.innerHTML = '';

    if (MANAGERS_LIST && MANAGERS_LIST.length > 0) {
        MANAGERS_LIST.forEach(name => {
            const chip = createManagerChip(name, true);
            list.appendChild(chip);
        });
    }

    const separator = document.createElement('div');
    separator.className = 'personnel-separator';
    separator.innerHTML = '<div style="text-align: center; padding: 6px 0; font-size: 8px; color: #999; font-weight: 600;">─ Otro Personal ─</div>';
    list.appendChild(separator);

    if (ALL_PERSONNEL_LIST && ALL_PERSONNEL_LIST.length > 0) {
        const otherPersonnel = ALL_PERSONNEL_LIST.filter(name => !MANAGERS_LIST.includes(name));
        otherPersonnel.forEach(name => {
            const chip = createManagerChip(name, false);
            list.appendChild(chip);
        });
    }
}

function createManagerChip(name, isActive) {
    const chip = document.createElement('div');
    chip.className = isActive ? 'person-chip manager-active' : 'person-chip manager-inactive';
    chip.draggable = true;
    chip.dataset.name = name;

    const personMain = document.createElement('div');
    personMain.className = 'person-main';

    const nameRow = document.createElement('div');
    nameRow.className = 'person-name-row';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'person-name';
    nameSpan.textContent = name;
    nameRow.appendChild(nameSpan);

    const scheduleInfo = document.createElement('div');
    scheduleInfo.className = 'schedule-info';

    personMain.appendChild(nameRow);
    personMain.appendChild(scheduleInfo);
    chip.appendChild(personMain);

    // Agregar eventos drag para TODOS
    chip.addEventListener('dragstart', handleDragStart);
    chip.addEventListener('dragend', handleDragEnd);

    // Menú contextual solo para activos
    if (isActive) {
        chip.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showPersonnelContextMenu(e, name);
        });
    }

    return chip;
}

// ========== MENÚ CONTEXTUAL ==========
function showPersonnelContextMenu(e, name) {
    e.preventDefault();
    e.stopPropagation();

    const dayData = managersScheduleData[currentDay];
    if (!dayData) {
        console.warn('dayData no disponible');
        return;
    }

    // Verificar si está en el grid
    let isAssignedToGrid = false;
    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            if (dayData.cajas[caja][turno].name === name) {
                isAssignedToGrid = true;
                break;
            }
        }
        if (isAssignedToGrid) break;
    }

    if (isAssignedToGrid) {
        alert(`${name} ya está asignado a un turno en el grid. Quítalo primero.`);
        return;
    }

    const isInFrancos = dayData.francos && dayData.francos.includes(name);
    const isInLicencias = dayData.licencias && dayData.licencias.includes(name);
    const isInVacaciones = dayData.vacaciones && dayData.vacaciones.includes(name);

    if (isInFrancos || isInLicencias || isInVacaciones) {
        alert(`${name} ya está asignado a una sección especial.`);
        return;
    }

    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    menu.style.left = (e.clientX || e.pageX) + 'px';
    menu.style.top = (e.clientY || e.pageY) + 'px';
    menu.style.zIndex = '2000';

    const menuTitle = document.createElement('div');
    menuTitle.className = 'context-menu-title';
    menuTitle.textContent = `Asignar ${name}`;
    menu.appendChild(menuTitle);

    const options = [
        { icon: '🏖️', text: 'Franco', fn: addToFrancos },
        { icon: '🏥', text: 'Licencia', fn: addToLicencias },
        { icon: '✈️', text: 'Vacaciones', fn: addToVacaciones }
    ];

    options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.innerHTML = `${opt.icon} ${opt.text}`;
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            opt.fn(name);
            menu.remove();
        });
        menu.appendChild(item);
    });

    const cancelOption = document.createElement('div');
    cancelOption.className = 'context-menu-item context-menu-cancel';
    cancelOption.textContent = '✕ Cancelar';
    cancelOption.style.cursor = 'pointer';
    cancelOption.addEventListener('click', () => menu.remove());
    menu.appendChild(cancelOption);

    document.body.appendChild(menu);

    setTimeout(() => {
        const closeMenu = (event) => {
            if (menu && menu.parentNode && !menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }, 100);
}

// ========== DRAG & DROP ==========
function handleDragStart(e) {
    const chip = e.target.closest('.person-chip');
    if (chip) {
        draggedName = chip.dataset.name;
        chip.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedName);
    }
}

function handleDragEnd(e) {
    const chip = e.target.closest('.person-chip');
    if (chip) chip.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('[data-dropzone]');
    if (target) {
        target.classList.add('drag-over');
    }
    return false;
}

function handleDragLeave(e) {
    const target = e.target.closest('[data-dropzone]');
    if (target) {
        target.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    const dropzone = e.target.closest('[data-dropzone]');
    if (!dropzone) return false;

    dropzone.classList.remove('drag-over');

    // Determinar qué tipo de dropzone es
    if (dropzone.dataset.dropzone === 'name') {
        // Dropzone de nombre en grid

        // VALIDAR: No puede estar en Franco, Licencia o Vacaciones
        if (isPersonInSpecialSection(draggedName, currentDay)) {
            alert(`${draggedName} ya está asignado a Franco, Licencia o Vacaciones. Quítalo primero.`);
            return false;
        }

        const cajaNum = parseInt(dropzone.dataset.caja);
        const turnoKey = dropzone.dataset.turno;

        if (dropzone.classList.contains('has-name')) {
            alert('Esta posición ya está asignada');
            return false;
        }

        if (!managersScheduleData[currentDay]) {
            managersScheduleData[currentDay] = {
                cajas: {},
                francos: [],
                licencias: [],
                vacaciones: []
            };
        }

        managersScheduleData[currentDay].cajas[cajaNum][turnoKey].name = draggedName;
        dropzone.textContent = draggedName;
        dropzone.classList.add('has-name');
        makeDropzoneDraggable(dropzone);

        updatePersonnelStatus();
        saveToLocalStorage();
    } else if (dropzone.dataset.dropzone === 'francos') {
        // VALIDAR: No puede estar en el grid
        if (isPersonInGrid(draggedName, currentDay)) {
            alert(`${draggedName} ya está asignado en el grid. Quítalo primero.`);
            return false;
        }
        // Dropzone de francos
        addToFrancos(draggedName);
    } else if (dropzone.dataset.dropzone === 'licencias') {
        // VALIDAR: No puede estar en el grid
        if (isPersonInGrid(draggedName, currentDay)) {
            alert(`${draggedName} ya está asignado en el grid. Quítalo primero.`);
            return false;
        }
        // Dropzone de licencias
        addToLicencias(draggedName);
    } else if (dropzone.dataset.dropzone === 'vacaciones') {
        // VALIDAR: No puede estar en el grid
        if (isPersonInGrid(draggedName, currentDay)) {
            alert(`${draggedName} ya está asignado en el grid. Quítalo primero.`);
            return false;
        }
        // Dropzone de vacaciones
        addToVacaciones(draggedName);
    }

    return false;
}

function handleDropzoneDblClick(e) {
    const dropzone = e.target.closest('.name-dropzone');
    if (dropzone && dropzone.classList.contains('has-name')) {
        const cajaNum = parseInt(dropzone.dataset.caja);
        const turnoKey = dropzone.dataset.turno;

        if (!managersScheduleData[currentDay]) return;

        managersScheduleData[currentDay].cajas[cajaNum][turnoKey].name = '';
        dropzone.textContent = 'Arrastrar';
        dropzone.classList.remove('has-name');

        updatePersonnelStatus();
        saveToLocalStorage();
    }
}

function makeDropzoneDraggable(dropzone) {
    dropzone.draggable = true;
    dropzone.style.cursor = 'move';

    dropzone.addEventListener('dragstart', function (e) {
        draggedName = dropzone.textContent;
        dropzone.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', draggedName);
    }, { once: false });

    dropzone.addEventListener('dragend', function () {
        dropzone.classList.remove('dragging');
    }, { once: false });
}

// ========== ACTUALIZAR ESTADO ==========
function updateTurnoCounters() {
    const dayData = managersScheduleData[currentDay];
    if (!dayData || !dayData.cajas) return;

    const counters = { turno1: 0, turno2: 0, turno3: 0 };

    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            if (dayData.cajas[caja][turno].name) counters[turno]++;
        }
    }

    const el1 = document.getElementById('counter-t1');
    const el2 = document.getElementById('counter-t2');
    const el3 = document.getElementById('counter-t3');
    if (el1) el1.textContent = `(${counters.turno1})`;
    if (el2) el2.textContent = `(${counters.turno2})`;
    if (el3) el3.textContent = `(${counters.turno3})`;
}

function updatePersonnelStatus() {
    const dayData = managersScheduleData[currentDay];
    if (!dayData || !dayData.cajas) return;

    const personnelSchedules = {};
    const personnelHours = {};

    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            const turnoData = dayData.cajas[caja][turno];
            const name = turnoData.name;

            if (name) {
                if (!personnelSchedules[name]) {
                    personnelSchedules[name] = [];
                }

                if (turnoData.entrada || turnoData.salida) {
                    personnelSchedules[name].push({
                        entrada: turnoData.entrada || '--:--',
                        salida: turnoData.salida || '--:--'
                    });
                    const horas = calculateHours(turnoData.entrada, turnoData.salida);
                    personnelHours[name] = (personnelHours[name] || 0) + horas;
                }
            }
        }
    }

    if (dayData.francos) {
        dayData.francos.forEach(name => {
            if (!personnelSchedules[name]) personnelSchedules[name] = [];
        });
    }

    if (dayData.licencias) {
        dayData.licencias.forEach(name => {
            if (!personnelSchedules[name]) personnelSchedules[name] = [];
        });
    }

    if (dayData.vacaciones) {
        dayData.vacaciones.forEach(name => {
            if (!personnelSchedules[name]) personnelSchedules[name] = [];
        });
    }

    const chips = document.querySelectorAll('.person-chip');
    chips.forEach(chip => {
        const name = chip.dataset.name;
        chip.innerHTML = '';

        const personMain = document.createElement('div');
        personMain.className = 'person-main';

        const nameRow = document.createElement('div');
        nameRow.className = 'person-name-row';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'person-name';
        nameSpan.textContent = name;
        nameRow.appendChild(nameSpan);

        if (personnelHours[name]) {
            const hoursSpan = document.createElement('span');
            hoursSpan.className = 'person-hours';
            hoursSpan.textContent = `${personnelHours[name].toFixed(1)}h`;
            nameRow.appendChild(hoursSpan);
        }

        personMain.appendChild(nameRow);

        const scheduleInfo = document.createElement('div');
        scheduleInfo.className = 'schedule-info';

        if (personnelSchedules[name] && personnelSchedules[name].length > 0) {
            const scheduleTexts = [];
            personnelSchedules[name].forEach((schedule) => {
                if (schedule.entrada !== '--:--' && schedule.salida !== '--:--') {
                    scheduleTexts.push(`${schedule.entrada}–${schedule.salida}`);
                }
            });

            if (scheduleTexts.length > 0) {
                const scheduleItem = document.createElement('div');
                scheduleItem.className = 'schedule-item';
                scheduleItem.textContent = scheduleTexts.join(' ');
                scheduleInfo.appendChild(scheduleItem);
            }
        }

        if (dayData.francos && dayData.francos.includes(name)) {
            const item = document.createElement('div');
            item.className = 'schedule-item franco-label';
            item.textContent = '🏖️ Franco';
            scheduleInfo.appendChild(item);
        }

        if (dayData.licencias && dayData.licencias.includes(name)) {
            const item = document.createElement('div');
            item.className = 'schedule-item licencia-label';
            item.textContent = '🏥 Licencia';
            scheduleInfo.appendChild(item);
        }

        if (dayData.vacaciones && dayData.vacaciones.includes(name)) {
            const item = document.createElement('div');
            item.className = 'schedule-item vacacion-label';
            item.textContent = '✈️ Vacaciones';
            scheduleInfo.appendChild(item);
        }

        personMain.appendChild(scheduleInfo);
        chip.appendChild(personMain);
    });

    updateTurnoCounters();
}

// ========== FRANCOS ==========
function addToFrancos(name) {
    const dayData = managersScheduleData[currentDay];
    if (!dayData) return;
    if (!dayData.francos) dayData.francos = [];
    if (!dayData.francos.includes(name)) {
        dayData.francos.push(name);
        renderFrancos();
        updatePersonnelStatus();
        saveToLocalStorage();
    }
}

function removeFromFrancos(name) {
    const dayData = managersScheduleData[currentDay];
    if (!dayData || !dayData.francos) return;
    const index = dayData.francos.indexOf(name);
    if (index > -1) {
        dayData.francos.splice(index, 1);
        renderFrancos();
        updatePersonnelStatus();
        saveToLocalStorage();
    }
}

function renderFrancos() {
    const list = document.getElementById('francos-list');
    if (!list) return;
    list.innerHTML = '';

    const dayData = managersScheduleData[currentDay];
    if (!dayData || !dayData.francos || dayData.francos.length === 0) return;

    dayData.francos.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'franco-chip';
        chip.textContent = name;
        const btn = document.createElement('button');
        btn.className = 'remove-btn';
        btn.textContent = '✕';
        btn.addEventListener('click', () => removeFromFrancos(name));
        chip.appendChild(btn);
        list.appendChild(chip);
    });
}

// ========== LICENCIAS ==========
function addToLicencias(name) {
    const dayData = managersScheduleData[currentDay];
    if (!dayData) return;
    if (!dayData.licencias) dayData.licencias = [];
    if (!dayData.licencias.includes(name)) {
        dayData.licencias.push(name);
        renderLicencias();
        updatePersonnelStatus();
        saveToLocalStorage();
    }
}

function removeFromLicencias(name) {
    const dayData = managersScheduleData[currentDay];
    if (!dayData || !dayData.licencias) return;
    const index = dayData.licencias.indexOf(name);
    if (index > -1) {
        dayData.licencias.splice(index, 1);
        renderLicencias();
        updatePersonnelStatus();
        saveToLocalStorage();
    }
}

function renderLicencias() {
    const list = document.getElementById('licencias-list');
    if (!list) return;
    list.innerHTML = '';

    const dayData = managersScheduleData[currentDay];
    if (!dayData || !dayData.licencias || dayData.licencias.length === 0) return;

    dayData.licencias.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'licencia-chip';
        chip.textContent = name;
        const btn = document.createElement('button');
        btn.className = 'remove-btn';
        btn.textContent = '✕';
        btn.addEventListener('click', () => removeFromLicencias(name));
        chip.appendChild(btn);
        list.appendChild(chip);
    });
}

// ========== VACACIONES ==========
function addToVacaciones(name) {
    const dayData = managersScheduleData[currentDay];
    if (!dayData) return;
    if (!dayData.vacaciones) dayData.vacaciones = [];
    if (!dayData.vacaciones.includes(name)) {
        dayData.vacaciones.push(name);
        renderVacaciones();
        updatePersonnelStatus();
        saveToLocalStorage();
    }
}

function removeFromVacaciones(name) {
    const dayData = managersScheduleData[currentDay];
    if (!dayData || !dayData.vacaciones) return;
    const index = dayData.vacaciones.indexOf(name);
    if (index > -1) {
        dayData.vacaciones.splice(index, 1);
        renderVacaciones();
        updatePersonnelStatus();
        saveToLocalStorage();
    }
}

function renderVacaciones() {
    const list = document.getElementById('vacaciones-list');
    if (!list) return;
    list.innerHTML = '';

    const dayData = managersScheduleData[currentDay];
    if (!dayData || !dayData.vacaciones || dayData.vacaciones.length === 0) return;

    dayData.vacaciones.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'vacacion-chip';
        chip.textContent = name;
        const btn = document.createElement('button');
        btn.className = 'remove-btn';
        btn.textContent = '✕';
        btn.addEventListener('click', () => removeFromVacaciones(name));
        chip.appendChild(btn);
        list.appendChild(chip);
    });
}

// ========== TIEMPO ==========
function handleTimeChange(e) {
    const input = e.target;
    const cajaNum = parseInt(input.dataset.caja);
    const turnoKey = input.dataset.turno;
    const field = input.dataset.field;

    if (!managersScheduleData[currentDay]) return;
    if (!managersScheduleData[currentDay].cajas[cajaNum]) return;

    managersScheduleData[currentDay].cajas[cajaNum][turnoKey][field] = input.value;
    updatePersonnelStatus();
    saveToLocalStorage();
}

function calculateHours(entrada, salida) {
    if (!entrada || !salida) return 0;
    const [h1, m1] = entrada.split(':').map(Number);
    const [h2, m2] = salida.split(':').map(Number);
    let start = h1 * 60 + m1;
    let end = h2 * 60 + m2;
    if (end < start) end += 24 * 60;
    return (end - start) / 60;
}

// ========== CARGAR HORARIO ==========
function loadSchedule(day) {
    const dayData = managersScheduleData[day];
    if (!dayData) return;

    document.querySelectorAll('.name-dropzone').forEach(dropzone => {
        dropzone.textContent = 'Arrastrar';
        dropzone.classList.remove('has-name');
        dropzone.draggable = false;
    });

    document.querySelectorAll('.time-input').forEach(input => {
        input.value = '';
    });

    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            const turnoData = dayData.cajas[caja][turno];

            if (turnoData.name) {
                const dropzone = document.querySelector(
                    `.name-dropzone[data-caja="${caja}"][data-turno="${turno}"]`
                );
                if (dropzone) {
                    dropzone.textContent = turnoData.name;
                    dropzone.classList.add('has-name');
                    makeDropzoneDraggable(dropzone);
                }
            }

            if (turnoData.entrada) {
                const input = document.querySelector(
                    `.time-input[data-caja="${caja}"][data-turno="${turno}"][data-field="entrada"]`
                );
                if (input) input.value = turnoData.entrada;
            }

            if (turnoData.salida) {
                const input = document.querySelector(
                    `.time-input[data-caja="${caja}"][data-turno="${turno}"][data-field="salida"]`
                );
                if (input) input.value = turnoData.salida;
            }
        }
    }

    renderFrancos();
    renderLicencias();
    renderVacaciones();
    updatePersonnelStatus();
    updateTurnoCounters();
}

// ========== EXPORTAR PDF ==========
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        alert('Error: jsPDF no disponible');
        return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const currentDayName = dayNames[currentDay];
    const dateInput = document.getElementById('weekDate');
    const selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    const dayData = managersScheduleData[currentDay];

    if (!dayData) {
        alert('No hay datos para exportar');
        return;
    }

    const turnoCounters = { turno1: 0, turno2: 0, turno3: 0 };
    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            if (dayData.cajas[caja][turno].name) turnoCounters[turno]++;
        }
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`👔 Encargados - ${currentDayName}`, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Fecha: ${selectedDate}`, 105, 23, { align: 'center' });

    const tableData = [];
    const totalCajas = 3 + (dynamicRows ? dynamicRows.length : 0);
    for (let i = 1; i <= totalCajas; i++) {
        const cajaData = dayData.cajas[i];
        if (cajaData) {
            tableData.push([
                `Encargado ${i}`,
                formatTurnoForPDF(cajaData.turno1),
                formatTurnoForPDF(cajaData.turno2),
                formatTurnoForPDF(cajaData.turno3)
            ]);
        }
    }

    if (tableData.length > 0 && doc.autoTable) {
        doc.autoTable({
            startY: 30,
            head: [['Encargado', `T1 (${turnoCounters.turno1})`, `T2 (${turnoCounters.turno2})`, `T3 (${turnoCounters.turno3})`]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [74, 144, 226], textColor: 255, fontStyle: 'bold' }
        });
    }

    doc.save(`Encargados_${currentDayName}_${selectedDate}.pdf`);
}

function formatTurnoForPDF(turno) {
    if (!turno || !turno.name) return '-';
    let text = turno.name;
    if (turno.entrada && turno.salida) text += ` (${turno.entrada} - ${turno.salida})`;
    else if (turno.entrada) text += ` (${turno.entrada} -)`;
    else if (turno.salida) text += ` (- ${turno.salida})`;
    return text;
}

// ========== EVENTOS ==========
function setupEventListeners() {
    const dayTabs = document.querySelectorAll('.day-tab');
    dayTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            currentDay = parseInt(this.dataset.day);
            dayTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            loadSchedule(currentDay);
        });
    });

    const exportPdfBtn = document.getElementById('exportPDF');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPDF);
    }

    const exportBackupBtn = document.getElementById('exportBackup');
    if (exportBackupBtn) {
        exportBackupBtn.addEventListener('click', exportToJSON);
    }

    const importBackupBtn = document.getElementById('importBackup');
    if (importBackupBtn) {
        importBackupBtn.addEventListener('click', importFromJSON);
    }

    const clearDataBtn = document.getElementById('clearData');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
    }

    const weekDateInput = document.getElementById('weekDate');
    if (weekDateInput) {
        weekDateInput.addEventListener('change', () => {
            loadSchedule(currentDay);
        });
    }

    // ========== SETUP DROPZONES PARA FRANCO, LICENCIAS Y VACACIONES ==========
    const dropzones = [
        { id: 'franciscosDropzone', type: 'francos' },
        { id: 'licenciasDropzone', type: 'licencias' },
        { id: 'vacacionesDropzone', type: 'vacaciones' }
    ];

    dropzones.forEach(dz => {
        const el = document.getElementById(dz.id);
        if (el) {
            el.dataset.dropzone = dz.type;
            el.addEventListener('dragover', handleDragOver);
            el.addEventListener('dragleave', handleDragLeave);
            el.addEventListener('drop', handleDrop);
        }
    });
}

// ========== MENÚ HAMBURGUESA ==========
function setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenuBtn = document.getElementById('closeMenuBtn');

    if (!hamburgerBtn || !sideMenu || !menuOverlay) return;

    hamburgerBtn.addEventListener('click', () => {
        const isOpen = sideMenu.classList.contains('open');
        sideMenu.classList.toggle('open', !isOpen);
        menuOverlay.classList.toggle('active', !isOpen);
        hamburgerBtn.classList.toggle('active', !isOpen);
        document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    const closeMenu = () => {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);

    const menuExportPdf = document.getElementById('menuExportPDF');
    if (menuExportPdf) {
        menuExportPdf.addEventListener('click', () => {
            closeMenu();
            document.getElementById('exportPDF')?.click();
        });
    }

    const menuSaveBtn = document.getElementById('menuSaveBtn');
    if (menuSaveBtn) {
        menuSaveBtn.addEventListener('click', () => {
            closeMenu();
            document.getElementById('exportBackup')?.click();
        });
    }

    const menuLoadBtn = document.getElementById('menuLoadBtn');
    if (menuLoadBtn) {
        menuLoadBtn.addEventListener('click', () => {
            closeMenu();
            document.getElementById('importBackup')?.click();
        });
    }

    const menuClearBtn = document.getElementById('menuClearBtn');
    if (menuClearBtn) {
        menuClearBtn.addEventListener('click', () => {
            closeMenu();
            document.getElementById('clearData')?.click();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sideMenu.classList.contains('open')) closeMenu();
    });
}

// ========== FUNCIONES GLOBALES ==========
window.removeDynamicRow = removeDynamicRow;