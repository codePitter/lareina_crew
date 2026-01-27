// ========== DATOS INICIALES ==========
// Lista de personal - Se carga dinámicamente desde crew/personnel.json
let PERSONNEL = [];

// Estado global de la aplicación
let currentDay = 0; // 0 = Lunes, 6 = Domingo
let scheduleData = {};

// ========== CARGA DE PERSONAL DESDE JSON ==========
async function loadPersonnelFromJSON() {
    try {
        const response = await fetch('crew/personnel.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Filtrar solo personal activo y extraer nombres
        PERSONNEL = data.personnel
            .filter(person => person.active)
            .map(person => person.name)
            .sort(); // Ordenar alfabéticamente

        console.log(`✅ Personal cargado: ${PERSONNEL.length} personas`);
        console.log('📋 Lista:', PERSONNEL);

        return true;
    } catch (error) {
        console.error('❌ Error al cargar personal desde JSON:', error);

        // Fallback: usar lista por defecto si falla la carga
        console.warn('⚠️ Usando lista de personal por defecto');
        PERSONNEL = [
            'Abreu', 'Algosino', 'Aranda', 'Bruno', 'Buldorini',
            'Caceres', 'Caldarella', 'Cantone', 'Cardozo', 'Carrasco',
            'Chaparro', 'Coloccioni', 'Delgado', 'Diaz', 'Durruty',
            'Erosa', 'Flores C.', 'Flores R.', 'Gago', 'Gauna',
            'Gill', 'Goncalves', 'Guimenez', 'Kesuani', 'Kolenicz',
            'Ledesma', 'Leguizamon', 'Lisi', 'Lopez', 'Miranda',
            'Morelli', 'Moyano', 'Navone', 'Ortiz', 'Peralta',
            'Pereyra', 'Perez O.', 'Perez P.', 'Puig', 'Quiroga',
            'Regunaschi', 'Rios', 'Rodriguez', 'Ruiz', 'Salaya',
            'Tevez', 'Valenzuela', 'Van', 'Velazquez', 'Ventrella',
            'Villanueva', 'Zapata'
        ];

        return false;
    }
}

// ========== FUNCIONES DE ALMACENAMIENTO LOCAL ==========
function saveToLocalStorage() {
    try {
        localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
        console.log('Datos guardados correctamente');
    } catch (error) {
        console.error('Error al guardar datos:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('scheduleData');
        if (savedData) {
            scheduleData = JSON.parse(savedData);
            console.log('Datos cargados correctamente');
            return true;
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
    return false;
}

function clearLocalStorage() {
    if (confirm('¿Estás seguro de que deseas borrar todos los horarios guardados? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('scheduleData');
        initScheduleData();
        loadSchedule(currentDay);
        generatePersonnelList();
        alert('Todos los horarios han sido borrados.');
    }
}

function exportToJSON() {
    const dataStr = JSON.stringify(scheduleData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `horarios_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('Guardado correctamente');
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
                const importedData = JSON.parse(event.target.result);

                // Validar que tiene la estructura correcta
                if (importedData && typeof importedData === 'object') {
                    scheduleData = importedData;
                    saveToLocalStorage();
                    loadSchedule(currentDay);
                    generatePersonnelList();
                    alert('Horarios importados correctamente');
                } else {
                    alert('El archivo no tiene el formato correcto');
                }
            } catch (error) {
                console.error('Error al importar:', error);
                alert('Error al leer el archivo. Asegúrate de que sea un archivo JSON válido.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function initScheduleData() {
    for (let day = 0; day < 7; day++) {
        scheduleData[day] = {
            cajas: {},
            francos: [],
            licencias: [],
            vacaciones: []
        };

        // Inicializar cada caja con 3 turnos (cajas 1-32)
        for (let caja = 1; caja <= 32; caja++) {
            scheduleData[day].cajas[caja] = {
                turno1: { name: '', entrada: '', salida: '' },
                turno2: { name: '', entrada: '', salida: '' },
                turno3: { name: '', entrada: '', salida: '' }
            };
        }
    }
}

// ========== INICIALIZACIÓN ==========

// ========== INICIALIZACIÓN DEL SISTEMA ==========
document.addEventListener('DOMContentLoaded', async function () {
    // 1. Cargar personal desde JSON primero
    console.log('🔄 Cargando lista de personal...');
    await loadPersonnelFromJSON();

    // 2. Intentar cargar datos guardados
    const dataLoaded = loadFromLocalStorage();

    // 3. Si no hay datos guardados, inicializar con datos vacíos
    if (!dataLoaded) {
        initScheduleData();
    }

    // 4. Inicializar interfaz
    setTodayDate();
    generateScheduleGrid();
    generatePersonnelList();
    setupEventListeners();
    setupPersonnelModalListeners();
    loadSchedule(currentDay);

    // 5. Mostrar mensaje de bienvenida
    if (!dataLoaded) {
        console.log('✅ Sistema iniciado. Los cambios se guardarán automáticamente.');
    } else {
        console.log('✅ Sistema iniciado con datos previos.');
    }
});

// Establecer fecha actual
function setTodayDate() {
    const today = new Date();
    const dateInput = document.getElementById('weekDate');
    dateInput.valueAsDate = today;
}

// ========== GENERAR GRID DE HORARIOS ==========
function generateScheduleGrid() {
    const grid = document.getElementById('scheduleGrid');
    grid.innerHTML = '';

    // Crear fila de encabezados T1, T2, T3
    const headerRow = document.createElement('div');
    headerRow.className = 'header-row';

    const emptyCaja = document.createElement('div');
    emptyCaja.className = 'caja-number-header';
    emptyCaja.textContent = '#';
    headerRow.appendChild(emptyCaja);

    const t1Header = document.createElement('div');
    t1Header.className = 'turno-header';
    t1Header.innerHTML = 'T1 <span class="turno-counter" id="counter-t1">(0)</span>';
    headerRow.appendChild(t1Header);

    const t2Header = document.createElement('div');
    t2Header.className = 'turno-header';
    t2Header.innerHTML = 'T2 <span class="turno-counter" id="counter-t2">(0)</span>';
    headerRow.appendChild(t2Header);

    const t3Header = document.createElement('div');
    t3Header.className = 'turno-header';
    t3Header.innerHTML = 'T3 <span class="turno-counter" id="counter-t3">(0)</span>';
    headerRow.appendChild(t3Header);

    grid.appendChild(headerRow);

    // Cajas 1-26
    for (let i = 1; i <= 26; i++) {
        const row = document.createElement('div');
        row.className = 'caja-row';
        if (i === 26) row.classList.add('perfumeria');

        // Número de caja
        const cajaNumber = document.createElement('div');
        cajaNumber.className = 'caja-number';
        cajaNumber.innerHTML = i === 26 ? '26<br>💄' : i;
        row.appendChild(cajaNumber);

        // Crear 3 turnos
        for (let turno = 1; turno <= 3; turno++) {
            const turnoBlock = createTurnoBlock(i, turno);
            row.appendChild(turnoBlock);
        }

        grid.appendChild(row);
    }

    // 2 Filas sin número después de la 26
    const extraRow1 = createSpecialRow('', 27);
    grid.appendChild(extraRow1);

    const extraRow2 = createSpecialRow('', 28);
    grid.appendChild(extraRow2);

    // Fila Aux 1
    const auxRow1 = createSpecialRow('Aux. 1', 29);
    grid.appendChild(auxRow1);

    // Fila Aux 2
    const auxRow2 = createSpecialRow('Aux. 2', 30);
    grid.appendChild(auxRow2);

    // Fila At. al Cliente
    const atClienteRow = createSpecialRow('SAC', 31);
    grid.appendChild(atClienteRow);

    // Fila Tesorería
    const tesoreriaRow = createSpecialRow('Teso', 32);
    grid.appendChild(tesoreriaRow);
}

function createSpecialRow(label, cajaNum) {
    const row = document.createElement('div');
    row.className = 'caja-row special-row';

    // Label
    const cajaLabel = document.createElement('div');
    cajaLabel.className = 'caja-number special-label';
    cajaLabel.textContent = label;
    row.appendChild(cajaLabel);

    // Crear 3 turnos
    for (let turno = 1; turno <= 3; turno++) {
        const turnoBlock = createTurnoBlock(cajaNum, turno);
        row.appendChild(turnoBlock);
    }

    return row;
}

function createTurnoBlock(cajaNum, turnoNum) {
    const block = document.createElement('div');
    block.className = 'turno-block';

    // Container para nombre y horarios en la misma línea
    const turnoContent = document.createElement('div');
    turnoContent.className = 'turno-content';

    // Dropzone para nombre
    const dropzone = document.createElement('div');
    dropzone.className = 'name-dropzone';
    dropzone.textContent = 'Arrastrar';
    dropzone.dataset.caja = cajaNum;
    dropzone.dataset.turno = `turno${turnoNum}`;
    dropzone.dataset.dropzone = 'name';

    // Eventos drag and drop
    dropzone.addEventListener('dragover', handleDragOver);
    dropzone.addEventListener('dragleave', handleDragLeave);
    dropzone.addEventListener('drop', handleDrop);
    dropzone.addEventListener('dblclick', handleDropzoneDblClick);

    turnoContent.appendChild(dropzone);

    // Inputs de tiempo en la misma línea
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

// ========== GENERAR LISTA DE PERSONAL ==========
function generatePersonnelList() {
    const list = document.getElementById('personnelList');
    list.innerHTML = '';

    PERSONNEL.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'person-chip';
        chip.draggable = true;
        chip.dataset.name = name;
        chip.textContent = name;

        const icon = document.createElement('span');
        icon.textContent = '🖐️';
        chip.appendChild(icon);

        // Eventos drag
        chip.addEventListener('dragstart', handleDragStart);
        chip.addEventListener('dragend', handleDragEnd);

        // Evento doble click
        chip.addEventListener('dblclick', (e) => showPersonnelContextMenu(e, name));

        list.appendChild(chip);
    });
}

// ========== MENÚ CONTEXTUAL PARA PERSONAL ==========
function showPersonnelContextMenu(e, name) {
    e.preventDefault();

    const dayData = scheduleData[currentDay];

    // Verificar si la persona ya está asignada a algún turno
    let isAssigned = false;
    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            if (dayData.cajas[caja][turno].name === name) {
                isAssigned = true;
                break;
            }
        }
        if (isAssigned) break;
    }

    // Si ya está asignado a un turno, no mostrar el menú
    if (isAssigned) {
        alert(`${name} ya está asignado a un turno. Solo puedes asignar a Franco/Licencia/Vacaciones si no tiene turnos asignados.`);
        return;
    }

    // Verificar si ya está en alguna de las listas
    const isInFrancos = dayData.francos.includes(name);
    const isInLicencias = dayData.licencias.includes(name);
    const isInVacaciones = dayData.vacaciones.includes(name);

    if (isInFrancos || isInLicencias || isInVacaciones) {
        alert(`${name} ya está asignado a ${isInFrancos ? 'Franco' : isInLicencias ? 'Licencia' : 'Vacaciones'}.`);
        return;
    }

    // Crear menú contextual
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    const menuTitle = document.createElement('div');
    menuTitle.className = 'context-menu-title';
    menuTitle.textContent = `Asignar ${name} a:`;
    menu.appendChild(menuTitle);

    // Opción Franco
    const francoOption = document.createElement('div');
    francoOption.className = 'context-menu-item';
    francoOption.innerHTML = '🏖️ Franco';
    francoOption.addEventListener('click', () => {
        addToFrancos(name);
        menu.remove();
    });
    menu.appendChild(francoOption);

    // Opción Licencia
    const licenciaOption = document.createElement('div');
    licenciaOption.className = 'context-menu-item';
    licenciaOption.innerHTML = '🏥 Licencia';
    licenciaOption.addEventListener('click', () => {
        addToLicencias(name);
        menu.remove();
    });
    menu.appendChild(licenciaOption);

    // Opción Vacaciones
    const vacacionesOption = document.createElement('div');
    vacacionesOption.className = 'context-menu-item';
    vacacionesOption.innerHTML = '✈️ Vacaciones';
    vacacionesOption.addEventListener('click', () => {
        addToVacaciones(name);
        menu.remove();
    });
    menu.appendChild(vacacionesOption);

    // Opción Cancelar
    const cancelOption = document.createElement('div');
    cancelOption.className = 'context-menu-item context-menu-cancel';
    cancelOption.textContent = '✕ Cancelar';
    cancelOption.addEventListener('click', () => {
        menu.remove();
    });
    menu.appendChild(cancelOption);

    document.body.appendChild(menu);

    // Cerrar menú al hacer click fuera
    const closeMenu = (event) => {
        if (!menu.contains(event.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };

    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
}

// ========== DRAG AND DROP HANDLERS ==========
let draggedElement = null;
let draggedName = null;

function handleDragStart(e) {
    draggedElement = e.target;
    draggedName = e.target.dataset.name;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedElement = null;
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    e.target.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    e.target.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    e.preventDefault();

    e.target.classList.remove('drag-over');

    const dropzone = e.target;

    // Verificar si es dropzone de francos
    if (dropzone.dataset.dropzone === 'francos' || dropzone.closest('[data-dropzone="francos"]')) {
        addToFrancos(draggedName);
        return false;
    }

    // Verificar si es dropzone de licencias
    if (dropzone.dataset.dropzone === 'licencias' || dropzone.closest('[data-dropzone="licencias"]')) {
        addToLicencias(draggedName);
        return false;
    }

    // Verificar si es dropzone de vacaciones
    if (dropzone.dataset.dropzone === 'vacaciones' || dropzone.closest('[data-dropzone="vacaciones"]')) {
        addToVacaciones(draggedName);
        return false;
    }

    // Verificar si es dropzone de nombre
    if (dropzone.dataset.dropzone === 'name') {
        const cajaNum = parseInt(dropzone.dataset.caja);
        const turnoKey = dropzone.dataset.turno;

        // Si ya tiene un nombre asignado, no permitir sobrescribir
        if (dropzone.classList.contains('has-name')) {
            alert('Esta posición ya tiene un nombre asignado. Usa doble click para quitarlo primero.');
            return false;
        }

        // Validar si la persona ya está asignada
        if (isPersonAlreadyAssigned(draggedName, cajaNum, turnoKey)) {
            // Verificar si es horario cortado válido
            if (!canBeHorarioCortado(draggedName, cajaNum, turnoKey)) {
                alert(`${draggedName} ya está asignado en otra caja. Solo se permite repetir en horario cortado (sin superposición de horarios).`);
                return false;
            }
        }

        // Asignar nombre
        scheduleData[currentDay].cajas[cajaNum][turnoKey].name = draggedName;
        dropzone.textContent = draggedName;
        dropzone.classList.add('has-name');

        // Hacer el dropzone arrastrable
        makeDropzoneDraggable(dropzone);

        updatePersonnelStatus();
        saveToLocalStorage(); // Guardar cambios
    }

    return false;
}

// Doble click en dropzone para quitar nombre
function handleDropzoneClick(e) {
    // Ya no hace nada con click simple
}

function handleDropzoneDblClick(e) {
    const dropzone = e.target;
    if (dropzone.classList.contains('has-name')) {
        const cajaNum = parseInt(dropzone.dataset.caja);
        const turnoKey = dropzone.dataset.turno;

        scheduleData[currentDay].cajas[cajaNum][turnoKey].name = '';
        dropzone.textContent = 'Arrastrar';
        dropzone.classList.remove('has-name');

        updatePersonnelStatus();
        saveToLocalStorage(); // Guardar cambios
    }
}

// ========== VALIDACIÓN DE ASIGNACIÓN ==========
// Hacer un dropzone arrastrable cuando tiene nombre
function makeDropzoneDraggable(dropzone) {
    dropzone.draggable = true;
    dropzone.style.cursor = 'move';

    dropzone.addEventListener('dragstart', function (e) {
        draggedElement = dropzone;
        draggedName = dropzone.textContent;
        dropzone.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/html', dropzone.textContent);
    });

    dropzone.addEventListener('dragend', function (e) {
        dropzone.classList.remove('dragging');
    });
}

function isPersonAlreadyAssigned(name, excludeCaja, excludeTurno) {
    const dayData = scheduleData[currentDay];

    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            // Excluir la caja y turno actual
            if (parseInt(caja) === excludeCaja && turno === excludeTurno) {
                continue;
            }

            if (dayData.cajas[caja][turno].name === name) {
                return true;
            }
        }
    }

    return false;
}

function canBeHorarioCortado(name, newCaja, newTurno) {
    // Verificar si se puede asignar el nombre considerando horario cortado
    // El horario cortado es válido si no hay superposición de horarios

    const dayData = scheduleData[currentDay];
    const newTurnoData = dayData.cajas[newCaja][newTurno];

    // Si no hay horarios definidos aún, permitir la asignación
    if (!newTurnoData.entrada || !newTurnoData.salida) {
        return true; // Permitir porque aún no se han definido los horarios
    }

    // Buscar otros turnos donde esta persona esté asignada
    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            if (dayData.cajas[caja][turno].name === name) {
                const existingTurno = dayData.cajas[caja][turno];

                // Si el turno existente no tiene horarios, permitir
                if (!existingTurno.entrada || !existingTurno.salida) {
                    return true;
                }

                // Verificar que no haya superposición
                // Caso 1: El nuevo turno termina antes o cuando empieza el existente
                if (newTurnoData.salida <= existingTurno.entrada) {
                    continue; // OK, no hay superposición
                }

                // Caso 2: El nuevo turno empieza después o cuando termina el existente
                if (newTurnoData.entrada >= existingTurno.salida) {
                    continue; // OK, no hay superposición
                }

                // Hay superposición
                return false;
            }
        }
    }

    return true; // No hay conflictos
}

// ========== ACTUALIZAR ESTADO DEL PERSONAL ==========
function updateTurnoCounters() {
    const dayData = scheduleData[currentDay];
    const counters = { turno1: 0, turno2: 0, turno3: 0 };

    // Contar cuántas cajas tienen nombre asignado por turno
    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            if (dayData.cajas[caja][turno].name) {
                counters[turno]++;
            }
        }
    }

    // Actualizar los contadores en el DOM
    const counter1 = document.getElementById('counter-t1');
    const counter2 = document.getElementById('counter-t2');
    const counter3 = document.getElementById('counter-t3');

    if (counter1) counter1.textContent = `(${counters.turno1})`;
    if (counter2) counter2.textContent = `(${counters.turno2})`;
    if (counter3) counter3.textContent = `(${counters.turno3})`;
}

function updateRepeatedNamesWarning() {
    const dayData = scheduleData[currentDay];
    const nameCount = {};

    // Contar cuántas veces aparece cada nombre
    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            const name = dayData.cajas[caja][turno].name;
            if (name) {
                nameCount[name] = (nameCount[name] || 0) + 1;
            }
        }
    }

    // Limpiar todas las advertencias primero
    document.querySelectorAll('.name-dropzone.has-name').forEach(dropzone => {
        dropzone.classList.remove('repeated-warning');
    });

    // Marcar los nombres que aparecen 3 o más veces
    for (let name in nameCount) {
        if (nameCount[name] >= 3) {
            // Buscar todos los dropzones con este nombre y marcarlos
            document.querySelectorAll('.name-dropzone.has-name').forEach(dropzone => {
                if (dropzone.textContent === name) {
                    dropzone.classList.add('repeated-warning');
                }
            });
        }
    }
}

function updatePersonnelStatus() {
    const dayData = scheduleData[currentDay];
    const personnelSchedules = {}; // Objeto para almacenar los horarios de cada persona

    // Recopilar nombres usados y sus horarios
    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            const turnoData = dayData.cajas[caja][turno];
            const name = turnoData.name;

            if (name) {
                if (!personnelSchedules[name]) {
                    personnelSchedules[name] = [];
                }

                // Agregar horario si al menos uno de los dos está definido
                if (turnoData.entrada || turnoData.salida) {
                    personnelSchedules[name].push({
                        entrada: turnoData.entrada || '--:--',
                        salida: turnoData.salida || '--:--',
                        caja: caja,
                        turno: turno
                    });
                }
            }
        }
    }

    // Agregar nombres en francos
    dayData.francos.forEach(name => {
        if (!personnelSchedules[name]) {
            personnelSchedules[name] = [];
        }
    });

    // Agregar nombres en licencias
    dayData.licencias.forEach(name => {
        if (!personnelSchedules[name]) {
            personnelSchedules[name] = [];
        }
    });

    // Agregar nombres en vacaciones
    dayData.vacaciones.forEach(name => {
        if (!personnelSchedules[name]) {
            personnelSchedules[name] = [];
        }
    });

    // Actualizar chips
    const chips = document.querySelectorAll('.person-chip');
    chips.forEach(chip => {
        const name = chip.dataset.name;

        // Limpiar contenido previo
        chip.innerHTML = '';

        // Nombre
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        chip.appendChild(nameSpan);

        if (personnelSchedules[name]) {
            chip.classList.add('used');

            // Contenedor de horarios
            const scheduleInfo = document.createElement('div');
            scheduleInfo.className = 'schedule-info';

            if (personnelSchedules[name].length > 0) {
                // Agrupar y mostrar todos los horarios
                const scheduleTexts = [];
                personnelSchedules[name].forEach((schedule) => {
                    if (schedule.entrada !== '--:--' && schedule.salida !== '--:--') {
                        scheduleTexts.push(`${schedule.entrada} a ${schedule.salida}`);
                    } else if (schedule.entrada !== '--:--') {
                        scheduleTexts.push(`Desde ${schedule.entrada}`);
                    } else if (schedule.salida !== '--:--') {
                        scheduleTexts.push(`Hasta ${schedule.salida}`);
                    }
                });

                if (scheduleTexts.length > 0) {
                    const scheduleItem = document.createElement('div');
                    scheduleItem.className = 'schedule-item';
                    scheduleItem.textContent = scheduleTexts.join(' | ');
                    scheduleInfo.appendChild(scheduleItem);
                }
            }

            // Mostrar franco si aplica
            if (dayData.francos.includes(name)) {
                const francoLabel = document.createElement('div');
                francoLabel.className = 'schedule-item franco-label';
                francoLabel.textContent = '🏖️ Franco';
                scheduleInfo.appendChild(francoLabel);
            }

            // Mostrar licencia si aplica
            if (dayData.licencias.includes(name)) {
                const licenciaLabel = document.createElement('div');
                licenciaLabel.className = 'schedule-item licencia-label';
                licenciaLabel.textContent = '🏥 Licencia';
                scheduleInfo.appendChild(licenciaLabel);
            }

            // Mostrar vacaciones si aplica
            if (dayData.vacaciones.includes(name)) {
                const vacacionLabel = document.createElement('div');
                vacacionLabel.className = 'schedule-item vacacion-label';
                vacacionLabel.textContent = '✈️ Vacaciones';
                scheduleInfo.appendChild(vacacionLabel);
            }

            chip.appendChild(scheduleInfo);
        } else {
            chip.classList.remove('used');

            // Icono de disponible
            const icon = document.createElement('span');
            icon.textContent = '🖐️';
            chip.appendChild(icon);
        }
    });

    // Actualizar contadores de turnos
    updateTurnoCounters();

    // Actualizar advertencias de nombres repetidos
    updateRepeatedNamesWarning();
}

// ========== MANEJO DE FRANCOS ==========
function addToFrancos(name) {
    const dayData = scheduleData[currentDay];

    if (!dayData.francos.includes(name)) {
        dayData.francos.push(name);
        renderFrancos();
        updatePersonnelStatus();
        saveToLocalStorage(); // Guardar cambios
    }
}

function removeFromFrancos(name) {
    const dayData = scheduleData[currentDay];
    const index = dayData.francos.indexOf(name);

    if (index > -1) {
        dayData.francos.splice(index, 1);
        renderFrancos();
        updatePersonnelStatus();
        saveToLocalStorage(); // Guardar cambios
    }
}

function renderFrancos() {
    const francosList = document.getElementById('francosList');
    francosList.innerHTML = '';

    const dayData = scheduleData[currentDay];

    dayData.francos.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'franco-chip';
        chip.textContent = name;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => removeFromFrancos(name));

        chip.appendChild(removeBtn);
        francosList.appendChild(chip);
    });
}

// ========== LICENCIAS ==========
function addToLicencias(name) {
    const dayData = scheduleData[currentDay];

    if (!dayData.licencias.includes(name)) {
        dayData.licencias.push(name);
        renderLicencias();
        updatePersonnelStatus();
        saveToLocalStorage(); // Guardar cambios
    }
}

function removeFromLicencias(name) {
    const dayData = scheduleData[currentDay];
    const index = dayData.licencias.indexOf(name);

    if (index > -1) {
        dayData.licencias.splice(index, 1);
        renderLicencias();
        updatePersonnelStatus();
        saveToLocalStorage(); // Guardar cambios
    }
}

function renderLicencias() {
    const licenciasList = document.getElementById('licenciasList');
    licenciasList.innerHTML = '';

    const dayData = scheduleData[currentDay];

    dayData.licencias.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'licencia-chip';
        chip.textContent = name;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => removeFromLicencias(name));

        chip.appendChild(removeBtn);
        licenciasList.appendChild(chip);
    });
}

// ========== VACACIONES ==========
function addToVacaciones(name) {
    const dayData = scheduleData[currentDay];

    if (!dayData.vacaciones.includes(name)) {
        dayData.vacaciones.push(name);
        renderVacaciones();
        updatePersonnelStatus();
        saveToLocalStorage(); // Guardar cambios
    }
}

function removeFromVacaciones(name) {
    const dayData = scheduleData[currentDay];
    const index = dayData.vacaciones.indexOf(name);

    if (index > -1) {
        dayData.vacaciones.splice(index, 1);
        renderVacaciones();
        updatePersonnelStatus();
        saveToLocalStorage(); // Guardar cambios
    }
}

function renderVacaciones() {
    const vacacionesList = document.getElementById('vacacionesList');
    vacacionesList.innerHTML = '';

    const dayData = scheduleData[currentDay];

    dayData.vacaciones.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'vacacion-chip';
        chip.textContent = name;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => removeFromVacaciones(name));

        chip.appendChild(removeBtn);
        vacacionesList.appendChild(chip);
    });
}

// ========== MANEJO DE CAMBIOS DE TIEMPO ==========
function handleTimeChange(e) {
    const input = e.target;
    const cajaNum = parseInt(input.dataset.caja);
    const turnoKey = input.dataset.turno;
    const field = input.dataset.field;

    scheduleData[currentDay].cajas[cajaNum][turnoKey][field] = input.value;

    // Actualizar la barra lateral para reflejar los nuevos horarios
    updatePersonnelStatus();
    saveToLocalStorage(); // Guardar cambios
}

// ========== CAMBIO DE DÍA ==========
function setupEventListeners() {
    // Tabs de días
    const dayTabs = document.querySelectorAll('.day-tab');
    dayTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            currentDay = parseInt(this.dataset.day);

            // Actualizar tabs activos
            dayTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Cargar horario del día
            loadSchedule(currentDay);
        });
    });

    // Botón exportar PDF
    document.getElementById('exportPDF').addEventListener('click', exportToPDF);

    // Botón exportar Backup
    document.getElementById('exportBackup').addEventListener('click', exportToJSON);

    // Botón importar Backup
    document.getElementById('importBackup').addEventListener('click', importFromJSON);

    // Botón limpiar datos
    document.getElementById('clearData').addEventListener('click', clearLocalStorage);

    // Dropzone de francos
    const francosDropzone = document.getElementById('francosDropzone');
    francosDropzone.addEventListener('dragover', handleDragOver);
    francosDropzone.addEventListener('dragleave', handleDragLeave);
    francosDropzone.addEventListener('drop', handleDrop);

    // Dropzone de licencias
    const licenciasDropzone = document.getElementById('licenciasDropzone');
    licenciasDropzone.addEventListener('dragover', handleDragOver);
    licenciasDropzone.addEventListener('dragleave', handleDragLeave);
    licenciasDropzone.addEventListener('drop', handleDrop);

    // Dropzone de vacaciones
    const vacacionesDropzone = document.getElementById('vacacionesDropzone');
    vacacionesDropzone.addEventListener('dragover', handleDragOver);
    vacacionesDropzone.addEventListener('dragleave', handleDragLeave);
    vacacionesDropzone.addEventListener('drop', handleDrop);
}

// ========== CARGAR HORARIO DEL DÍA ==========
function loadSchedule(day) {
    const dayData = scheduleData[day];

    // Limpiar todo
    document.querySelectorAll('.name-dropzone').forEach(dropzone => {
        dropzone.textContent = 'Arrastrar';
        dropzone.classList.remove('has-name');
        dropzone.draggable = false;
        dropzone.style.cursor = 'pointer';
    });

    document.querySelectorAll('.time-input').forEach(input => {
        input.value = '';
    });

    // Cargar datos
    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            const turnoData = dayData.cajas[caja][turno];

            // Nombre
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

            // Horarios
            if (turnoData.entrada) {
                const entradaInput = document.querySelector(
                    `.time-input[data-caja="${caja}"][data-turno="${turno}"][data-field="entrada"]`
                );
                if (entradaInput) entradaInput.value = turnoData.entrada;
            }

            if (turnoData.salida) {
                const salidaInput = document.querySelector(
                    `.time-input[data-caja="${caja}"][data-turno="${turno}"][data-field="salida"]`
                );
                if (salidaInput) salidaInput.value = turnoData.salida;
            }
        }
    }

    // Cargar francos
    renderFrancos();
    renderLicencias();
    renderVacaciones();
    updatePersonnelStatus();
    updateTurnoCounters();
    updateRepeatedNamesWarning();
}

// ========== EXPORTAR A PDF ==========
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // Obtener el día actual
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const currentDayName = dayNames[currentDay];

    // Obtener la fecha seleccionada
    const dateInput = document.getElementById('weekDate');
    const selectedDate = dateInput.value || new Date().toISOString().split('T')[0];

    const dayData = scheduleData[currentDay];

    // Calcular contadores de turnos
    const turnoCounters = { turno1: 0, turno2: 0, turno3: 0 };
    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            if (dayData.cajas[caja][turno].name) {
                turnoCounters[turno]++;
            }
        }
    }

    // Encabezado
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`${currentDayName} - ${selectedDate}`, 105, 15, { align: 'center' });

    // Línea separadora
    doc.setDrawColor(74, 144, 226);
    doc.setLineWidth(1);
    doc.line(20, 18, 190, 18);

    // Preparar datos de la tabla
    const tableData = [];

    // Cajas 1-26
    for (let i = 1; i <= 26; i++) {
        const cajaData = dayData.cajas[i];
        const row = [
            i === 26 ? '26 - PERFUMERIA' : i.toString(),
            formatTurnoForPDF(cajaData.turno1),
            formatTurnoForPDF(cajaData.turno2),
            formatTurnoForPDF(cajaData.turno3)
        ];
        tableData.push(row);
    }

    // 2 Filas sin número (27 y 28)
    for (let i = 27; i <= 28; i++) {
        const cajaData = dayData.cajas[i];
        const row = [
            '',
            formatTurnoForPDF(cajaData.turno1),
            formatTurnoForPDF(cajaData.turno2),
            formatTurnoForPDF(cajaData.turno3)
        ];
        tableData.push(row);
    }

    // Filas especiales
    const specialRows = [
        { num: 29, label: 'Aux. 1' },
        { num: 30, label: 'Aux. 2' },
        { num: 31, label: 'At. Cliente' },
        { num: 32, label: 'Tesorería' }
    ];

    specialRows.forEach(special => {
        const cajaData = dayData.cajas[special.num];
        const row = [
            special.label,
            formatTurnoForPDF(cajaData.turno1),
            formatTurnoForPDF(cajaData.turno2),
            formatTurnoForPDF(cajaData.turno3)
        ];
        tableData.push(row);
    });

    // Crear tabla con autoTable
    doc.autoTable({
        startY: 22,
        head: [[
            '#',
            `T1 (${turnoCounters.turno1})`,
            `T2 (${turnoCounters.turno2})`,
            `T3 (${turnoCounters.turno3})`
        ]],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [74, 144, 226],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 7,
            cellPadding: 2
        },
        columnStyles: {
            0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 50 },
            2: { cellWidth: 50 },
            3: { cellWidth: 50 }
        },
        didParseCell: function (data) {
            // Colorear fila de perfumería (caja 26)
            if (data.row.index === 25 && data.section === 'body') {
                data.cell.styles.fillColor = [255, 224, 178];
            }

            // Colorear filas especiales (últimas 4)
            if (data.row.index >= 28 && data.section === 'body') {
                data.cell.styles.fillColor = [232, 245, 233];
                if (data.column.index === 0) {
                    data.cell.styles.textColor = [67, 160, 71];
                }
            }

            // Resaltar nombres asignados
            if (data.section === 'body' && data.column.index > 0) {
                const cellText = data.cell.text[0];
                if (cellText && cellText.trim() !== '' && cellText.trim() !== '-') {
                    // Si hay un nombre (el texto incluye un nombre)
                    const lines = cellText.split('\n');
                    if (lines.length > 0 && lines[0].trim() !== '') {
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        },
        margin: { left: 20, right: 20 }
    });

    // Obtener la posición Y final de la tabla
    let finalY = doc.lastAutoTable.finalY + 5;

    // Verificar si hay espacio suficiente, si no, agregar nueva página
    if (finalY > 260) {
        doc.addPage();
        finalY = 20;
    }

    // Sección de Francos (altura reducida a ~2 filas)
    const francosHeight = 15;
    doc.setFillColor(232, 245, 233);
    doc.roundedRect(20, finalY, 170, francosHeight, 3, 3, 'FD');

    // Borde izquierdo verde
    doc.setFillColor(102, 187, 106);
    doc.rect(20, finalY, 4, francosHeight, 'F');

    // Título de Francos
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(67, 160, 71);
    doc.text('FRANCOS', 26, finalY + 5);

    // Lista de francos
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(67, 160, 71);

    if (dayData.francos.length === 0) {
        doc.setFont(undefined, 'italic');
        doc.text('No hay francos asignados', 26, finalY + 11);
    } else {
        const francosText = dayData.francos.join('  |  ');
        const splitText = doc.splitTextToSize(francosText, 160);
        doc.text(splitText, 26, finalY + 11);
    }

    // Guardar PDF
    doc.save(`Horarios_${currentDayName}_${selectedDate}.pdf`);
}


// Función auxiliar para formatear turno
function formatTurnoForPDF(turnoData) {
    if (!turnoData.name) {
        return '-';
    }

    let text = turnoData.name;

    if (turnoData.entrada && turnoData.salida) {
        text += ` (${turnoData.entrada} - ${turnoData.salida})`;
    } else if (turnoData.entrada) {
        text += ` (${turnoData.entrada} -)`;
    } else if (turnoData.salida) {
        text += ` (- ${turnoData.salida})`;
    }

    return text;
}

// Variable global para almacenar los datos del personal
let personnelData = {
    personnel: [],
    metadata: {
        total: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
        version: "1.0"
    }
};

// ========== MODAL DE GESTIÓN ==========
function openPersonnelModal() {
    const modal = document.getElementById('personnelModal');
    modal.classList.add('show');
    loadPersonnelData();
    renderPersonnelTable();
}

function closePersonnelModal() {
    const modal = document.getElementById('personnelModal');
    modal.classList.remove('show');
}

// ========== CARGAR DATOS DE PERSONAL ==========
function loadPersonnelData() {
    // Convertir el array PERSONNEL actual a formato de datos
    if (personnelData.personnel.length === 0) {
        // Primera vez: crear desde PERSONNEL
        personnelData.personnel = PERSONNEL.map((name, index) => ({
            id: index + 1,
            name: name,
            active: true
        }));
        personnelData.metadata.total = personnelData.personnel.length;
    }
}

// ========== RENDERIZAR TABLA ==========
function renderPersonnelTable() {
    const tbody = document.getElementById('personnelTableBody');
    tbody.innerHTML = '';

    // Ordenar por ID
    const sortedPersonnel = [...personnelData.personnel].sort((a, b) => a.id - b.id);

    sortedPersonnel.forEach(person => {
        const row = createPersonnelRow(person);
        tbody.appendChild(row);
    });

    updatePersonnelStats();
}

function createPersonnelRow(person) {
    const row = document.createElement('tr');
    row.dataset.id = person.id;
    if (!person.active) row.classList.add('inactive');

    row.innerHTML = `
        <td>${person.id}</td>
        <td>
            <span class="name-display">${person.name}</span>
            <input type="text" class="name-edit" value="${person.name}" style="display: none;">
        </td>
        <td>
            <span class="status-badge ${person.active ? 'active' : 'inactive'}">
                ${person.active ? '✓ Activo' : '✗ Inactivo'}
            </span>
        </td>
        <td>
            <div class="personnel-actions">
                <button class="btn-edit" onclick="editPerson(${person.id})">✏️ Editar</button>
                <button class="btn-save" onclick="savePerson(${person.id})" style="display: none;">💾 Guardar</button>
                <button class="btn-cancel" onclick="cancelEdit(${person.id})" style="display: none;">✖️ Cancelar</button>
                <button class="btn-toggle" onclick="togglePersonActive(${person.id})">
                    ${person.active ? '🚫 Desactivar' : '✓ Activar'}
                </button>
                <button class="btn-delete" onclick="deletePerson(${person.id})">🗑️ Eliminar</button>
            </div>
        </td>
    `;

    return row;
}

// ========== ACTUALIZAR ESTADÍSTICAS ==========
function updatePersonnelStats() {
    const total = personnelData.personnel.length;
    const active = personnelData.personnel.filter(p => p.active).length;
    const inactive = total - active;

    document.getElementById('personnelTotal').textContent = `Total: ${total}`;
    document.getElementById('personnelActive').textContent = `Activos: ${active}`;
    document.getElementById('personnelInactive').textContent = `Inactivos: ${inactive}`;
}

// ========== AGREGAR PERSONA ==========
function addPerson() {
    const name = prompt('Ingresa el nombre o apellido de la nueva persona:');
    if (!name || name.trim() === '') return;

    // Buscar el ID más alto
    const maxId = personnelData.personnel.reduce((max, p) => Math.max(max, p.id), 0);

    const newPerson = {
        id: maxId + 1,
        name: name.trim(),
        active: true
    };

    personnelData.personnel.push(newPerson);
    personnelData.metadata.total = personnelData.personnel.length;
    personnelData.metadata.lastUpdated = new Date().toISOString().split('T')[0];

    renderPersonnelTable();
    updatePERSONNELArray();
    generatePersonnelList();

    alert(`✅ ${name} ha sido agregado correctamente.`);
}

// ========== EDITAR PERSONA ==========
function editPerson(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const nameDisplay = row.querySelector('.name-display');
    const nameEdit = row.querySelector('.name-edit');
    const btnEdit = row.querySelector('.btn-edit');
    const btnSave = row.querySelector('.btn-save');
    const btnCancel = row.querySelector('.btn-cancel');

    nameDisplay.style.display = 'none';
    nameEdit.style.display = 'block';
    nameEdit.focus();
    nameEdit.select();

    btnEdit.style.display = 'none';
    btnSave.style.display = 'inline-block';
    btnCancel.style.display = 'inline-block';
}

function savePerson(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const nameEdit = row.querySelector('.name-edit');
    const newName = nameEdit.value.trim();

    if (newName === '') {
        alert('El nombre no puede estar vacío.');
        return;
    }

    // Actualizar en los datos
    const person = personnelData.personnel.find(p => p.id === id);
    if (person) {
        person.name = newName;
        personnelData.metadata.lastUpdated = new Date().toISOString().split('T')[0];
    }

    renderPersonnelTable();
    updatePERSONNELArray();
    generatePersonnelList();

    alert(`✅ Cambios guardados correctamente.`);
}

function cancelEdit(id) {
    renderPersonnelTable();
}

// ========== ACTIVAR/DESACTIVAR PERSONA ==========
function togglePersonActive(id) {
    const person = personnelData.personnel.find(p => p.id === id);
    if (person) {
        person.active = !person.active;
        personnelData.metadata.lastUpdated = new Date().toISOString().split('T')[0];
        renderPersonnelTable();
        updatePERSONNELArray();
        generatePersonnelList();
    }
}

// ========== ELIMINAR PERSONA ==========
function deletePerson(id) {
    const person = personnelData.personnel.find(p => p.id === id);
    if (!person) return;

    const confirmation = confirm(`¿Estás seguro de que deseas ELIMINAR permanentemente a "${person.name}"?\n\nEsta acción no se puede deshacer.`);
    if (!confirmation) return;

    personnelData.personnel = personnelData.personnel.filter(p => p.id !== id);
    personnelData.metadata.total = personnelData.personnel.length;
    personnelData.metadata.lastUpdated = new Date().toISOString().split('T')[0];

    renderPersonnelTable();
    updatePERSONNELArray();
    generatePersonnelList();

    alert(`✅ ${person.name} ha sido eliminado correctamente.`);
}

// ========== ACTUALIZAR ARRAY PERSONNEL ==========
function updatePERSONNELArray() {
    // Actualizar el array global PERSONNEL con los datos activos
    PERSONNEL.length = 0; // Limpiar array
    personnelData.personnel
        .filter(p => p.active)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(p => PERSONNEL.push(p.name));
}

// ========== EXPORTAR JSON ==========
function exportPersonnelToJSON() {
    const dataStr = JSON.stringify(personnelData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `personnel_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert(`✅ Archivo JSON exportado correctamente.\n\n📁 Reemplaza el archivo "crew/personnel.json" con el archivo descargado para que los cambios sean permanentes.`);
}

// ========== IMPORTAR JSON ==========
function importPersonnelFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);

                // Validar estructura
                if (importedData.personnel && Array.isArray(importedData.personnel)) {
                    personnelData = importedData;
                    renderPersonnelTable();
                    updatePERSONNELArray();
                    generatePersonnelList();
                    alert('✅ Personal importado correctamente.');
                } else {
                    alert('❌ El archivo no tiene el formato correcto.');
                }
            } catch (error) {
                console.error('Error al importar:', error);
                alert('❌ Error al leer el archivo. Asegúrate de que sea un archivo JSON válido.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ========== EVENT LISTENERS PARA EL MODAL ==========
function setupPersonnelModalListeners() {
    // Botón para abrir modal
    document.getElementById('managePersonnel').addEventListener('click', openPersonnelModal);

    // Botón cerrar modal
    document.querySelector('.close-modal').addEventListener('click', closePersonnelModal);

    // Cerrar al hacer click fuera del modal
    document.getElementById('personnelModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closePersonnelModal();
        }
    });

    // Botón agregar persona
    document.getElementById('addPersonBtn').addEventListener('click', addPerson);

    // Botón exportar JSON
    document.getElementById('exportPersonnelJSON').addEventListener('click', exportPersonnelToJSON);

    // Botón importar JSON
    document.getElementById('importPersonnelJSON').addEventListener('click', importPersonnelFromJSON);
}

// ========== AGREGAR A LA INICIALIZACIÓN ==========
// Esta función debe llamarse después de que se cargue el DOM
// Se agregará al final del archivo main.js existente
-e
// Inicializar listeners del modal de personal
setupPersonnelModalListeners();