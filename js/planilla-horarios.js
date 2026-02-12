// // ========== VARIABLES GLOBALES ==========
let PERSONNEL = [];
let scheduleData = {};
let scheduleCodes = {};
let viewMode = 'codes';
let managersSchedule = {};

// ========== FUNCIONES DE CARGA DEL SISTEMA UNIFICADO ==========
function loadScheduleData() {
    try {
        const savedData = UnifiedStorage.getSection('cajeros', 'scheduleData');
        if (savedData && Object.keys(savedData).length > 0) {
            scheduleData = savedData;
            console.log('✅ Horarios de cajeros cargados para la tabla');
            return true;
        } else {
            console.log('ℹ️ No hay horarios de cajeros guardados');
            scheduleData = {};
        }
    } catch (error) {
        console.error('❌ Error al cargar horarios de cajeros:', error);
        scheduleData = {};
    }
    return false;
}

function loadManagersSchedule() {
    try {
        const savedData = UnifiedStorage.getSection('encargados', 'scheduleData');
        if (savedData && Object.keys(savedData).length > 0) {
            managersSchedule = savedData;
            console.log('✅ Horarios de encargados cargados para la tabla');
            transformManagersData();
            return true;
        } else {
            console.log('ℹ️ No hay horarios de encargados guardados');
            managersSchedule = {};
        }
    } catch (error) {
        console.error('❌ Error al cargar horarios de encargados:', error);
        managersSchedule = {};
    }
    return false;
}

function transformManagersData() {
    if (!managersSchedule || Object.keys(managersSchedule).length === 0) {
        console.log('ℹ️ No hay datos de encargados para transformar');
        return;
    }

    const transformedData = {};

    for (let day = 0; day < 7; day++) {
        const dayData = managersSchedule[day];
        if (!dayData || !dayData.cajas) continue;

        const managersMap = new Map();

        for (let caja in dayData.cajas) {
            for (let turnoKey in dayData.cajas[caja]) {
                const turnoData = dayData.cajas[caja][turnoKey];
                if (turnoData.name) {
                    const name = turnoData.name;
                    if (!managersMap.has(name)) {
                        managersMap.set(name, { name: name, shifts: {} });
                    }
                    if (turnoData.entrada && turnoData.salida) {
                        const manager = managersMap.get(name);
                        manager.shifts[turnoKey] = {
                            entrada: turnoData.entrada,
                            salida: turnoData.salida
                        };
                    }
                }
            }
        }

        transformedData[day] = {
            managers: Array.from(managersMap.values()),
            francos: dayData.francos || [],
            licencias: dayData.licencias || [],
            vacaciones: dayData.vacaciones || []
        };
    }

    managersSchedule = transformedData;
    console.log('✅ Datos de encargados transformados correctamente');
}

function loadScheduleCodesUnified() {
    try {
        const savedCodes = UnifiedStorage.getSection('codes');
        if (savedCodes && Object.keys(savedCodes).length > 0) {
            scheduleCodes = savedCodes;
            console.log('✅ Códigos cargados:', Object.keys(scheduleCodes).length);
            return true;
        }

        const oldCodes = localStorage.getItem('scheduleCodes');
        if (oldCodes) {
            try {
                const parsed = JSON.parse(oldCodes);
                scheduleCodes = parsed;
                UnifiedStorage.updateSection('codes', null, scheduleCodes);
                console.log('✅ Códigos migrados al sistema unificado');
                return true;
            } catch (e) {
                console.error('❌ Error al migrar códigos:', e);
            }
        }

        console.log('ℹ️ No hay códigos guardados');
        scheduleCodes = {};
    } catch (error) {
        console.error('❌ Error al cargar códigos:', error);
        scheduleCodes = {};
    }
    return false;
}

function saveScheduleCodesUnified() {
    try {
        UnifiedStorage.updateSection('codes', null, scheduleCodes);
        console.log('✅ Códigos guardados en sistema unificado');
        return true;
    } catch (error) {
        console.error('❌ Error al guardar códigos:', error);
        return false;
    }
}

// ========== CARGA DE PERSONAL ==========
async function loadPersonnelData() {
    try {
        // Intentar auto-migrar si no hay personal
        await PersonnelManager.autoMigrateIfNeeded();

        // Cargar todo el personal activo
        const allPersonnel = PersonnelManager.getAllActive();

        // ⭐ CRÍTICO: Asignar a la variable global
        PERSONNEL = allPersonnel;

        console.log(`✅ Personal cargado desde PersonnelManager: ${PERSONNEL.length} personas`);
        console.log('📋 Personal:', PERSONNEL);

        return true;
    } catch (error) {
        console.error('❌ Error al cargar personal:', error);
        PERSONNEL = [];
        return false;
    }
}

// Funciones helper
function getPersonById(id) {
    return PersonnelManager.getPersonById(id);
}

function getPersonByName(name) {
    return PersonnelManager.getPersonByName(name);
}

// ========== FUNCIONES WRAPPER PARA COMPATIBILIDAD ==========
function loadScheduleFromLocalStorage() {
    return loadScheduleData();
}

function loadManagersScheduleFromLocalStorage() {
    return loadManagersSchedule();
}

async function loadScheduleCodesFromJSON() {
    try {
        const response = await fetch('crew/schedule_codes.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        scheduleCodes = data;
        UnifiedStorage.updateSection('codes', null, scheduleCodes);
        console.log(`✅ Códigos cargados: ${Object.keys(scheduleCodes).length} combinaciones`);
        return true;
    } catch (error) {
        console.error('❌ Error al cargar schedule_codes.json:', error);
        return loadScheduleCodesUnified();
    }
}

// ========== GENERACIÓN DE CÓDIGOS ==========
function getScheduleSignature(daySchedule) {
    // Crear una firma única para identificar el horario
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

    // Ordenar y unir para crear firma única
    signatures.sort();
    return signatures.join(' / ');
}

function calculateHours(timeRange) {
    // Puede recibir: "08:00-16:00" o "08:00-13:00+17:00-21:00"
    if (!timeRange || typeof timeRange !== 'string') return 0;

    const segments = timeRange.split('+');
    let totalMinutes = 0;

    segments.forEach(segment => {
        const [start, end] = segment.split('-');
        if (!start || !end) return;

        const [sh, sm] = start.trim().split(':').map(Number);
        const [eh, em] = end.trim().split(':').map(Number);

        if (
            isNaN(sh) || isNaN(sm) ||
            isNaN(eh) || isNaN(em)
        ) return;

        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;

        if (endMin > startMin) {
            totalMinutes += endMin - startMin;
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
        hours: calculateHours(signature) || 0,
        schedule: signature.replace(/\+/g, ' / ')
    };
}

function getCodeForPerson(personName, day) {
    if (!scheduleData[day]) {
        return { code: '-', hours: 0, schedule: '-', type: 'empty' };
    }

    const dayData = scheduleData[day];

    // 🔹 IMPORTANTE: personName es el NOMBRE completo de la persona
    // porque en index.html se guarda con person.name

    // Verificar francos
    if (dayData.francos && dayData.francos.includes(personName)) {
        return { code: 'F', hours: 0, schedule: 'Franco', type: 'franco' };
    }

    // Verificar licencias
    if (dayData.licencias && dayData.licencias.includes(personName)) {
        return { code: 'L', hours: 0, schedule: 'Licencia', type: 'licencia' };
    }

    // Verificar vacaciones
    if (dayData.vacaciones && dayData.vacaciones.includes(personName)) {
        return { code: 'V', hours: 0, schedule: 'Vacaciones', type: 'vacaciones' };
    }

    // Buscar en todas las cajas los turnos de esta persona
    let segments = [];

    for (let caja in dayData.cajas) {
        for (let turno in dayData.cajas[caja]) {
            const turnoData = dayData.cajas[caja][turno];
            // 🔹 Aquí comparamos con personName (que es el nombre completo)
            if (turnoData.name === personName) {
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

function getCodeForManager(manager, day) {
    // 👔 Función para obtener código y horario de un encargado
    if (!managersSchedule[day]) {
        return { code: '-', hours: 0, schedule: '-', type: 'empty' };
    }

    const dayData = managersSchedule[day];

    // Verificar estados especiales (franco, licencia, vacaciones)
    if (dayData.francos && dayData.francos.includes(manager.name)) {
        return { code: 'F', hours: 0, schedule: 'Franco', type: 'franco' };
    }

    if (dayData.licencias && dayData.licencias.includes(manager.name)) {
        return { code: 'L', hours: 0, schedule: 'Licencia', type: 'licencia' };
    }

    if (dayData.vacaciones && dayData.vacaciones.includes(manager.name)) {
        return { code: 'V', hours: 0, schedule: 'Vacaciones', type: 'vacaciones' };
    }

    // Obtener los turnos del encargado
    let segments = [];

    if (manager.shifts) {
        for (let turno in manager.shifts) {
            const shift = manager.shifts[turno];
            if (shift.entrada && shift.salida) {
                segments.push(`${shift.entrada}-${shift.salida}`);
            }
        }
    }

    if (segments.length === 0) {
        return { code: '-', hours: 0, schedule: '-', type: 'empty' };
    }

    // Ordenar y crear firma
    segments.sort();
    const signature = segments.join('+');

    return { ...lookupCode(signature), type: 'manager' };
}

// ========== GENERACIÓN DE LA TABLA ==========
function generateScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    tbody.innerHTML = '';

    const contractFilter = document.getElementById('contractFilter').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase();

    let filteredPersonnel = PERSONNEL;

    // Aplicar filtros
    if (contractFilter !== 'all') {
        // 🔹 IMPORTANTE: comparar con weeklyHours, no con contractType
        filteredPersonnel = filteredPersonnel.filter(p => p.weeklyHours === parseInt(contractFilter));
    }

    if (searchText) {
        filteredPersonnel = filteredPersonnel.filter(p =>
            p.name.toLowerCase().includes(searchText)
        );
    }

    // Ordenar por horas de contrato (menor a mayor) y luego por nombre
    filteredPersonnel.sort((a, b) => {
        // Primero por horas (30hs, 36hs, 48hs)
        if (a.weeklyHours !== b.weeklyHours) {
            return a.weeklyHours - b.weeklyHours; // Menor a mayor
        }
        // Si tienen las mismas horas, ordenar alfabéticamente
        return a.name.localeCompare(b.name);
    });

    // ========== AGREGAR CAJEROS (SIN ENCARGADOS) ==========
    // 🔹 FILTRAR SOLO CAJEROS: excluir encargados (isManager === true)
    const cashiersOnly = filteredPersonnel.filter(person => !person.isManager);

    cashiersOnly.forEach(person => {
        const row = document.createElement('tr');
        row.className = person.contractType === 'Full-time' ? 'full-time' : 'part-time';

        // Contrato
        const contractCell = document.createElement('td');
        contractCell.className = 'contract-cell';
        contractCell.innerHTML = `<span class="contract-badge ${person.contractType === 'Full-time' ? 'full-time' : 'part-time'}">${person.contractType} - ${person.weeklyHours}hs</span>`;
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
            // 🔹 IMPORTANTE: pasar person.name (el nombre completo)
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

            totalWeekHours += Number(codeInfo.hours) || 0;
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

    // ========== AGREGAR ENCARGADOS 👔 ==========
    // 🔹 Obtener TODOS los encargados de PERSONNEL (los que tienen isManager === true)
    const managers = filteredPersonnel.filter(person => person.isManager);

    // Ordenar por nombre
    managers.sort((a, b) => a.name.localeCompare(b.name));

    // Agregar filas de encargados
    managers.forEach(manager => {
        const row = document.createElement('tr');
        row.className = 'manager-row';

        // Contrato (Encargado)
        const contractCell = document.createElement('td');
        contractCell.className = 'contract-cell manager-badge';
        contractCell.innerHTML = `<span class="contract-badge manager-badge">👔 Encargado - 48hs</span>`;
        row.appendChild(contractCell);

        // ID
        const idCell = document.createElement('td');
        idCell.className = 'id-cell';
        idCell.textContent = manager.id; // 🔹 Usar el ID real del encargado
        row.appendChild(idCell);

        // Nombre
        const nameCell = document.createElement('td');
        nameCell.className = 'name-cell manager-name';
        nameCell.textContent = manager.name; // 🔹 Usar manager.name
        row.appendChild(nameCell);

        // Días de la semana
        let totalWeekHours = 0;
        for (let day = 0; day < 7; day++) {
            const dayCell = document.createElement('td');

            // Buscar los datos del encargado para este día
            let managerData = null;

            if (managersSchedule[day] && managersSchedule[day].managers) {
                managerData = managersSchedule[day].managers.find(m => m.name === manager.name); // 🔹 Usar manager.name
            }

            if (managerData) {
                // Obtener código y horarios
                const codeInfo = getCodeForManager(managerData, day);

                dayCell.className = `code-cell ${codeInfo.type}`;

                if (viewMode === 'codes') {
                    dayCell.textContent = codeInfo.code;
                    dayCell.title = codeInfo.schedule;
                } else {
                    dayCell.innerHTML = `
                            <div class="code-with-schedule">
                                <div class="code-part">${codeInfo.code}</div>
                                <div class="schedule-part">${codeInfo.schedule}</div>
                            </div>
                        `;
                    dayCell.classList.add('schedule-view');
                }

                totalWeekHours += Number(codeInfo.hours) || 0;
            } else {
                // Verificar si está en estados especiales sin horarios
                let specialState = null;

                if (managersSchedule[day]) {
                    if (managersSchedule[day].francos && managersSchedule[day].francos.includes(manager.name)) { // 🔹 Usar manager.name
                        specialState = { code: 'F', type: 'franco', schedule: 'Franco' };
                    } else if (managersSchedule[day].licencias && managersSchedule[day].licencias.includes(manager.name)) { // 🔹 Usar manager.name
                        specialState = { code: 'L', type: 'licencia', schedule: 'Licencia' };
                    } else if (managersSchedule[day].vacaciones && managersSchedule[day].vacaciones.includes(manager.name)) { // 🔹 Usar manager.name
                        specialState = { code: 'V', type: 'vacaciones', schedule: 'Vacaciones' };
                    }
                }

                if (specialState) {
                    dayCell.className = `code-cell ${specialState.type}`;

                    if (viewMode === 'codes') {
                        dayCell.textContent = specialState.code;
                        dayCell.title = specialState.schedule;
                    } else {
                        dayCell.innerHTML = `
                                <div class="code-with-schedule">
                                    <div class="code-part">${specialState.code}</div>
                                    <div class="schedule-part">${specialState.schedule}</div>
                                </div>
                            `;
                        dayCell.classList.add('schedule-view');
                    }
                } else {
                    dayCell.className = 'code-cell empty';
                    dayCell.textContent = '-';
                }
            }

            row.appendChild(dayCell);
        }

        // Total de horas (Encargados siempre 48hs)
        const totalCell = document.createElement('td');
        totalCell.className = 'total-cell manager-hours';

        if (totalWeekHours < 48) {
            totalCell.classList.add('under-hours');
        } else if (totalWeekHours > 48) {
            totalCell.classList.add('over-hours');
        }

        totalCell.textContent = `${totalWeekHours}h / 48h`;
        row.appendChild(totalCell);

        // Horas extras
        const extraHoursCell = document.createElement('td');
        extraHoursCell.className = 'extra-hours-cell';
        const extraHours = totalWeekHours - 48;

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

// ========== LEYENDA DE CÓDIGOS ==========
function generateLegend() {
    const legendContent = document.getElementById('legendContent');
    legendContent.innerHTML = '';

    // Agregar códigos especiales
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

    // Agregar códigos de horarios
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

// ========== MODAL DE CÓDIGOS ==========
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
        'Contrato', 'ID', 'Cajero/a', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Total Hrs'
    ]);

    // Datos
    PERSONNEL.forEach(person => {
        const row = [
            `${person.contractType} - ${person.weeklyHours}hs`,
            person.id,
            person.name
        ];

        let totalWeekHours = 0;
        for (let day = 0; day < 7; day++) {
            // 🔹 IMPORTANTE: pasar person.name (el nombre completo)
            const codeInfo = getCodeForPerson(person.name, day);
            row.push(codeInfo.code);
            totalWeekHours += codeInfo.hours;
        }

        row.push(`${totalWeekHours}h / ${person.weeklyHours}h`);
        scheduleData.push(row);
    });

    // Agregar encargados
    if (managersSchedule && Object.keys(managersSchedule).length > 0) {
        scheduleData.push([]); // Fila vacía separadora
        scheduleData.push(['👔 ENCARGADOS', '', '', '', '', '', '', '', '', '', '']);

        const allManagers = new Map();
        for (let day in managersSchedule) {
            const dayData = managersSchedule[day];
            if (dayData.managers) {
                dayData.managers.forEach(manager => {
                    if (!allManagers.has(manager.name)) {
                        allManagers.set(manager.name, manager);
                    }
                });
            }
        }

        Array.from(allManagers.values()).sort((a, b) => a.name.localeCompare(b.name)).forEach(manager => {
            const row = [
                '👔 Encargado - 48hs',
                '-',
                manager.name
            ];

            let totalWeekHours = 0;
            for (let day = 0; day < 7; day++) {
                let codeInfo = { code: '-', hours: 0 };
                if (managersSchedule[day]) {
                    const found = managersSchedule[day].managers.find(m => m.name === manager.name);
                    if (found) {
                        codeInfo = getCodeForManager(found, day);
                    }
                }
                row.push(codeInfo.code);
                totalWeekHours += codeInfo.hours;
            }

            row.push(`${totalWeekHours}h / 48h`);
            scheduleData.push(row);
        });
    }

    const ws1 = XLSX.utils.aoa_to_sheet(scheduleData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Horarios');

    // Hoja 2: Leyenda de Códigos
    const legendData = [];
    legendData.push(['Código', 'Horario', 'Horas']);

    // Códigos especiales
    legendData.push(['F', 'Franco', '0h']);
    legendData.push(['L', 'Licencia', '0h']);
    legendData.push(['V', 'Vacaciones', '0h']);
    legendData.push(['-', 'Sin asignar', '0h']);

    // Códigos de horarios
    const sortedCodes = Object.values(scheduleCodes).sort((a, b) => a.code - b.code);
    sortedCodes.forEach(codeData => {
        legendData.push([codeData.code, codeData.schedule, `${codeData.hours}h`]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(legendData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Códigos');

    // Obtener fecha
    const dateInput = document.getElementById('weekDate');
    const selectedDate = dateInput.value || new Date().toISOString().split('T')[0];

    // Descargar
    XLSX.writeFile(wb, `Horarios_Cajeros_${selectedDate}.xlsx`);
}

// ========== EXPORTAR/IMPORTAR CÓDIGOS ==========
function exportCodesToJSON() {
    const dataStr = JSON.stringify(scheduleCodes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codigos_horarios_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('✅ Códigos exportados correctamente');
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
                    alert('✅ Códigos importados correctamente');
                } else {
                    alert('❌ El archivo no tiene el formato correcto');
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
    // Botón de impresión
    document.getElementById('printScheduleBtn').addEventListener('click', printSchedule);

    // Botones principales
    document.getElementById('manageCodesBtn').addEventListener('click', openCodesModal);
    document.getElementById('manageCodesMainBtn').addEventListener('click', openCodesModal);
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
    document.getElementById('saveScheduleBtn').addEventListener('click', () => {
        alert('✅ Los códigos se cargan automáticamente desde schedule_codes.json');
    });

    // Modal de códigos
    document.getElementById('closeCodesModal').addEventListener('click', closeCodesModal);
    document.getElementById('codesModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeCodesModal();
        }
    });

    // Botones del modal de códigos
    document.getElementById('exportCodesBtn').addEventListener('click', exportCodesToJSON);
    document.getElementById('importCodesBtn').addEventListener('click', importCodesFromJSON);
    document.getElementById('addNewCodeBtn').addEventListener('click', openAddCodeModal);
    document.getElementById('searchCodesInput').addEventListener('input', filterCodesTable);

    // Modal de edición de código individual
    document.getElementById('closeCodeEditModal').addEventListener('click', closeCodeEditModal);
    document.getElementById('cancelCodeEdit').addEventListener('click', closeCodeEditModal);
    document.getElementById('codeEditForm').addEventListener('submit', saveCodeEdit);
    document.getElementById('codeScheduleInput').addEventListener('input', updateCodeHoursPreview);
    document.getElementById('codeEditModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeCodeEditModal();
        }
    });

    // Botón de cambio de vista
    document.getElementById('viewToggleBtn').addEventListener('click', toggleViewMode);

    // Filtros
    document.getElementById('contractFilter').addEventListener('change', generateScheduleTable);
    document.getElementById('searchInput').addEventListener('input', generateScheduleTable);

    // Fecha - Restaurar última guardada o usar lunes de la semana actual
    const dateInput = document.getElementById('weekDate');
    const savedDate = localStorage.getItem('lastWeekDate');

    if (savedDate) {
        dateInput.value = savedDate;
    } else {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - daysToSubtract);
        dateInput.valueAsDate = monday;
    }

    // Agregar listener para forzar selección de lunes y guardar
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

        // Guardar la fecha seleccionada
        localStorage.setItem('lastWeekDate', input.value);

        // Recargar datos al cambiar fecha
        loadManagersScheduleFromLocalStorage();
        generateScheduleTable();
    });
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 Iniciando sistema de horarios por cajero...');

    // Cargar datos
    await loadPersonnelData();  // ✅ CORRECTO (antes era loadPersonnelFromJSON)
    loadScheduleFromLocalStorage();
    loadManagersScheduleFromLocalStorage();
    await loadScheduleCodesFromJSON();

    // Inicializar interfaz
    setupEventListeners();
    setupHamburgerMenu();
    setupSortableHeaders();
    generateScheduleTable();
    generateLegend();

    console.log('✅ Sistema iniciado correctamente');
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

// ========== VARIABLES PARA MODAL DE CÓDIGOS ==========
let currentEditingSchedule = null;
let filteredCodes = null;

// ========== ABRIR/CERRAR MODALES ==========
function openCodesModal() {
    const modal = document.getElementById('codesModal');
    modal.classList.add('show');
    modal.style.display = 'flex';
    renderCodesTable();
    document.body.style.overflow = 'hidden';
}

function closeCodesModal() {
    const modal = document.getElementById('codesModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.getElementById('searchCodesInput').value = '';
    filteredCodes = null;
    document.body.style.overflow = '';
}

function openAddCodeModal() {
    currentEditingSchedule = null;
    document.getElementById('codeEditModalTitle').textContent = '➕ Agregar Código';
    document.getElementById('codeNumberInput').value = '';
    document.getElementById('codeScheduleInput').value = '';
    document.getElementById('codeHoursDisplay').value = '';
    document.getElementById('codeEditModal').classList.add('show');
    document.getElementById('codeEditModal').style.display = 'flex';
}

function openEditCodeModal(schedule) {
    currentEditingSchedule = schedule;
    const codeData = scheduleCodes[schedule];

    document.getElementById('codeEditModalTitle').textContent = '✏️ Editar Código';
    document.getElementById('codeNumberInput').value = codeData.codigo;
    document.getElementById('codeScheduleInput').value = schedule;
    document.getElementById('codeHoursDisplay').value = calculateHours(schedule).toFixed(2) + 'h';
    document.getElementById('codeEditModal').classList.add('show');
    document.getElementById('codeEditModal').style.display = 'flex';
}

function closeCodeEditModal() {
    const modal = document.getElementById('codeEditModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.getElementById('codeEditForm').reset();
    currentEditingSchedule = null;
}

// ========== RENDERIZAR TABLA DE CÓDIGOS ==========
function renderCodesTable() {
    const tbody = document.getElementById('codesTableBody');
    tbody.innerHTML = '';

    // Convertir scheduleCodes a array
    const codesArray = [];
    for (let schedule in scheduleCodes) {
        const code = scheduleCodes[schedule].codigo;
        codesArray.push({
            schedule: schedule,
            code: code,
            hours: calculateHours(schedule)
        });
    }

    // Ordenar por código
    codesArray.sort((a, b) => {
        const numA = parseInt(a.code) || 0;
        const numB = parseInt(b.code) || 0;
        return numA - numB;
    });

    // Aplicar filtro si existe
    const displayCodes = filteredCodes || codesArray;

    // Renderizar filas
    displayCodes.forEach(codeData => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="code-cell">${codeData.code}</td>
            <td class="schedule-cell">${codeData.schedule.replace(/\+/g, ' / ')}</td>
            <td class="hours-cell">${codeData.hours.toFixed(2)}h</td>
            <td class="actions-cell">
                <button class="btn-edit-small" onclick="openEditCodeModal('${codeData.schedule.replace(/'/g, "\\'")}')">✏️</button>
                <button class="btn-delete-small" onclick="deleteCodeConfirm('${codeData.schedule.replace(/'/g, "\\'")}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Actualizar contador
    document.getElementById('codesCount').textContent = `Total: ${displayCodes.length} códigos`;

    // Mensaje si no hay códigos
    if (displayCodes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: #6b7280;">
                    ${filteredCodes ? '🔍 No se encontraron códigos con ese criterio' : '📋 No hay códigos cargados'}
                </td>
            </tr>
        `;
    }
}

// ========== FILTRAR TABLA ==========
function filterCodesTable(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (!searchTerm) {
        filteredCodes = null;
        renderCodesTable();
        return;
    }

    // Filtrar códigos
    const codesArray = [];
    for (let schedule in scheduleCodes) {
        const code = scheduleCodes[schedule].codigo;
        const scheduleDisplay = schedule.replace(/\+/g, ' / ');

        if (code.includes(searchTerm) || scheduleDisplay.toLowerCase().includes(searchTerm)) {
            codesArray.push({
                schedule: schedule,
                code: code,
                hours: calculateHours(schedule)
            });
        }
    }

    filteredCodes = codesArray;
    renderCodesTable();
}

// ========== GUARDAR/EDITAR CÓDIGO ==========
function saveCodeEdit(e) {
    e.preventDefault();

    const codeNumber = document.getElementById('codeNumberInput').value.trim();
    const scheduleInput = document.getElementById('codeScheduleInput').value.trim();

    if (!codeNumber || !scheduleInput) {
        alert('❌ Por favor completa todos los campos requeridos');
        return;
    }

    // Validar formato de horario
    const schedulePattern = /^\d{2}:\d{2}-\d{2}:\d{2}(\+\d{2}:\d{2}-\d{2}:\d{2})*$/;
    if (!schedulePattern.test(scheduleInput)) {
        alert('❌ Formato de horario inválido.\n\nFormato correcto:\n• Un turno: 08:00-12:00\n• Dos turnos: 08:00-12:00+17:00-21:00');
        return;
    }

    // Si estamos editando y el horario cambió, eliminar el anterior
    if (currentEditingSchedule && currentEditingSchedule !== scheduleInput) {
        delete scheduleCodes[currentEditingSchedule];
    }

    // Guardar el código
    scheduleCodes[scheduleInput] = {
        codigo: codeNumber,
        alternativas: scheduleCodes[scheduleInput]?.alternativas || []
    };

    // Guardar en localStorage
    saveCodesToLocalStorage();

    // Actualizar vista
    renderCodesTable();
    generateScheduleTable();
    generateLegend();
    closeCodeEditModal();

    console.log(`✅ Código ${currentEditingSchedule ? 'actualizado' : 'agregado'}: ${scheduleInput} → ${codeNumber}`);
}

// ========== ELIMINAR CÓDIGO ==========
function deleteCodeConfirm(schedule) {
    const code = scheduleCodes[schedule].codigo;
    const scheduleDisplay = schedule.replace(/\+/g, ' / ');

    if (confirm(`¿Eliminar el código ${code}?\n\nHorario: ${scheduleDisplay}\n\nEsta acción no se puede deshacer.`)) {
        delete scheduleCodes[schedule];
        saveCodesToLocalStorage();
        renderCodesTable();
        generateScheduleTable();
        generateLegend();
        console.log(`🗑️ Código eliminado: ${schedule}`);
    }
}

// ========== ACTUALIZAR PREVIEW DE HORAS ==========
function updateCodeHoursPreview() {
    const scheduleInput = document.getElementById('codeScheduleInput').value.trim();
    const hoursDisplay = document.getElementById('codeHoursDisplay');

    if (!scheduleInput) {
        hoursDisplay.value = '';
        return;
    }

    try {
        const hours = calculateHours(scheduleInput);
        hoursDisplay.value = hours.toFixed(2) + 'h';
    } catch (error) {
        hoursDisplay.value = 'Formato inválido';
    }
}

// ========== GUARDAR CÓDIGOS EN LOCALSTORAGE ==========
function saveCodesToLocalStorage() {
    saveScheduleCodesUnified();
}

// ========== HACER FUNCIONES GLOBALES ==========
window.openEditCodeModal = openEditCodeModal;
window.deleteCodeConfirm = deleteCodeConfirm;

// ========== FUNCIÓN AUXILIAR PARA OBTENER CÓDIGOS USADOS ==========
function getUsedCodesThisWeek() {
    const usedCodes = new Set();

    for (let day = 0; day < 7; day++) {
        if (!scheduleData[day]) continue;

        const dayData = scheduleData[day];

        // Recorrer todas las cajas
        for (let caja in dayData.cajas) {
            for (let turno in dayData.cajas[caja]) {
                const turnoData = dayData.cajas[caja][turno];
                if (turnoData.name && turnoData.entrada && turnoData.salida) {
                    const signature = `${turnoData.entrada}-${turnoData.salida}`;
                    usedCodes.add(signature);
                }
            }
        }
    }

    // Convertir a array de objetos con código, horario y horas
    const result = Array.from(usedCodes).map(signature => {
        const codeInfo = lookupCode(signature);
        return {
            code: codeInfo.code,
            schedule: codeInfo.schedule,
            hours: codeInfo.hours
        };
    });

    return result;
}

// ========== FUNCIÓN HELPER PARA DEBUG ==========
function debugStorage() {
    if (typeof UnifiedStorage === 'undefined') {
        console.error('❌ UnifiedStorage no está disponible');
        return null;
    }

    const allData = UnifiedStorage.loadAll();
    console.log('=== SISTEMA DE ALMACENAMIENTO ===');
    console.log('Versión:', allData.version);
    console.log('Última actualización:', allData.lastSaved);
    console.log('Semana:', allData.week);
    console.log('');
    console.log('Cajeros:');
    console.log('  - Días con horarios:', Object.keys(allData.cajeros.scheduleData).length);
    console.log('  - Cajas dinámicas:', allData.cajeros.dynamicRows.length);
    console.log('');
    console.log('Encargados:');
    console.log('  - Días con horarios:', Object.keys(allData.encargados.scheduleData).length);
    console.log('  - Cajas dinámicas:', allData.encargados.dynamicRows.length);
    console.log('');
    console.log('Códigos:', Object.keys(allData.codes || {}).length);
    console.log('');
    console.log('Objeto completo:', allData);
    return allData;
}

// Hacer la función disponible globalmente para debugging
if (typeof window !== 'undefined') {
    window.debugStorage = debugStorage;
}

// ========== FUNCIÓN DE IMPRESIÓN ==========
function printSchedule() {
    // Simplemente llamar a window.print()
    // Los estilos CSS @media print se encargan del resto
    window.print();
}

// ========== FUNCIONALIDAD DE ORDENAMIENTO DE TABLA ==========
function setupSortableHeaders() {
    const sortableHeaders = document.querySelectorAll('.schedule-table th.sortable');

    // Marcar la columna "Contrato" como ordenada ascendentemente por defecto
    const contratoHeader = document.querySelector('.schedule-table th.sortable[data-column="contrato"]');
    if (contratoHeader) {
        contratoHeader.classList.add('asc');
    }

    sortableHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const column = this.dataset.column;
            const tbody = document.getElementById('scheduleTableBody');
            const rows = Array.from(tbody.querySelectorAll('tr'));

            // Determinar dirección del ordenamiento
            let direction = 'asc';
            if (this.classList.contains('asc')) {
                direction = 'desc';
            }

            // Remover clases de todos los headers
            sortableHeaders.forEach(h => {
                h.classList.remove('asc', 'desc');
            });

            // Agregar clase al header actual
            this.classList.add(direction);

            // Ordenar las filas
            rows.sort((rowA, rowB) => {
                let valueA, valueB;

                switch (column) {
                    case 'contrato':
                        // Extraer las horas del texto (ej: "Part-time - 30hs" -> 30, "Encargado - 48hs" -> 48)
                        const hoursMatchA = rowA.cells[0].textContent.match(/(\d+)hs/);
                        const hoursMatchB = rowB.cells[0].textContent.match(/(\d+)hs/);
                        valueA = hoursMatchA ? parseInt(hoursMatchA[1]) : 0;
                        valueB = hoursMatchB ? parseInt(hoursMatchB[1]) : 0;

                        // Si las horas son iguales, ordenar alfabéticamente por nombre
                        if (valueA === valueB) {
                            const nameA = rowA.cells[2].textContent.trim().toLowerCase();
                            const nameB = rowB.cells[2].textContent.trim().toLowerCase();
                            return direction === 'asc' ?
                                nameA.localeCompare(nameB) :
                                nameB.localeCompare(nameA);
                        }

                        return direction === 'asc' ? valueA - valueB : valueB - valueA;

                    case 'id':
                        valueA = parseInt(rowA.cells[1].textContent) || 0;
                        valueB = parseInt(rowB.cells[1].textContent) || 0;
                        return direction === 'asc' ? valueA - valueB : valueB - valueA;

                    case 'nombre':
                        valueA = rowA.cells[2].textContent.trim().toLowerCase();
                        valueB = rowB.cells[2].textContent.trim().toLowerCase();
                        return direction === 'asc' ?
                            valueA.localeCompare(valueB) :
                            valueB.localeCompare(valueA);

                    case 'total':
                        // Extraer solo el número de horas trabajadas (ej: "40h / 48h" -> 40)
                        const totalA = rowA.cells[10].textContent.match(/(\d+)h\s*\//);
                        const totalB = rowB.cells[10].textContent.match(/(\d+)h\s*\//);
                        valueA = totalA ? parseInt(totalA[1]) : 0;
                        valueB = totalB ? parseInt(totalB[1]) : 0;
                        return direction === 'asc' ? valueA - valueB : valueB - valueA;

                    case 'extras':
                        // Extraer horas extras (puede ser +5h, -3h, o 0h)
                        const extrasTextA = rowA.cells[11].textContent.trim();
                        const extrasTextB = rowB.cells[11].textContent.trim();
                        valueA = parseInt(extrasTextA.replace('h', '')) || 0;
                        valueB = parseInt(extrasTextB.replace('h', '')) || 0;
                        return direction === 'asc' ? valueA - valueB : valueB - valueA;

                    default:
                        return 0;
                }
            });

            // Reordenar el DOM
            rows.forEach(row => tbody.appendChild(row));
        });
    });
}