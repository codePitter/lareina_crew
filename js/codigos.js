// ========== DATOS GLOBALES ==========
let scheduleCodes = [];
let editingIndex = null;
let rawScheduleCodes = {}; // Para almacenar el JSON original

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🔢 Iniciando sistema de gestión de códigos...');

    // Cargar códigos desde JSON
    await loadCodesFromJSON();

    setupEventListeners();
    renderCodesTable();
    updateStats();

    console.log('✅ Sistema iniciado correctamente');
});

// ========== CARGAR CÓDIGOS DESDE JSON ==========
async function loadCodesFromJSON() {
    try {
        const response = await fetch('crew/schedule_codes.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        rawScheduleCodes = await response.json();

        // Convertir el formato JSON a formato de la tabla
        scheduleCodes = [];
        for (let schedule in rawScheduleCodes) {
            const code = rawScheduleCodes[schedule].codigo;
            const description = rawScheduleCodes[schedule].description || '';

            // Convertir formato: "08:00-12:00+17:00-21:00" a "08:00 A 12:00 Y 17:00 A 21:00"
            const scheduleDisplay = schedule.replace(/-/g, ' A ').replace(/\+/g, ' Y ');

            scheduleCodes.push({
                code: code.padStart(5, '0'), // Formato con 5 dígitos
                schedule: scheduleDisplay,
                description: description,
                hours: calculateTotalHours(scheduleDisplay)
            });
        }

        // Ordenar por código
        scheduleCodes.sort((a, b) => a.code.localeCompare(b.code));

        console.log(`✅ ${scheduleCodes.length} códigos cargados desde JSON`);

        // Guardar en localStorage para persistencia
        saveCodesToLocalStorage();

    } catch (error) {
        console.error('❌ Error al cargar códigos desde JSON:', error);
        console.log('📥 Cargando códigos desde localStorage...');
        loadCodesFromLocalStorage();
    }
}

// ========== MENU HAMBURGUESA ==========
function setupEventListeners() {
    // Hamburguesa menu
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');

    if (hamburgerBtn && sideMenu && menuOverlay) {
        hamburgerBtn.addEventListener('click', () => {
            const isOpen = sideMenu.classList.contains('open');

            if (isOpen) {
                sideMenu.classList.remove('open');
                menuOverlay.classList.remove('active');
                hamburgerBtn.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                sideMenu.classList.add('open');
                menuOverlay.classList.add('active');
                hamburgerBtn.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });

        function closeMenu() {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('active');
            hamburgerBtn.classList.remove('active');
            document.body.style.overflow = '';
        }

        menuOverlay.addEventListener('click', closeMenu);

        // Botones del menú
        document.getElementById('menuAddCode')?.addEventListener('click', () => {
            closeMenu();
            openAddModal();
        });

        document.getElementById('menuImport')?.addEventListener('click', () => {
            closeMenu();
            importCodes();
        });

        document.getElementById('menuExport')?.addEventListener('click', () => {
            closeMenu();
            exportCodes();
        });

        document.getElementById('menuClearAll')?.addEventListener('click', () => {
            closeMenu();
            clearAllCodes();
        });

        // Tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sideMenu.classList.contains('open')) {
                closeMenu();
            }
        });
    }

    // Header buttons
    document.getElementById('importBtn').addEventListener('click', importCodes);
    document.getElementById('exportBtn').addEventListener('click', exportCodes);
    document.getElementById('excelBtn').addEventListener('click', exportToExcel);
    document.getElementById('printBtn').addEventListener('click', () => window.print());

    // Toolbar
    document.getElementById('addCodeBtn').addEventListener('click', openAddModal);
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('codeForm').addEventListener('submit', handleFormSubmit);

    // Calcular horas automáticamente
    document.getElementById('scheduleInput').addEventListener('input', calculateHours);

    // Cerrar modal al hacer clic fuera
    document.getElementById('codeModal').addEventListener('click', (e) => {
        if (e.target.id === 'codeModal') {
            closeModal();
        }
    });
}

// ========== FUNCIONES DE DATOS ==========
function loadCodesFromLocalStorage() {
    const saved = localStorage.getItem('scheduleCodes');
    if (saved) {
        try {
            scheduleCodes = JSON.parse(saved);
            console.log(`📥 Códigos cargados desde localStorage: ${scheduleCodes.length}`);
        } catch (error) {
            console.error('Error al cargar códigos:', error);
            scheduleCodes = [];
        }
    } else {
        scheduleCodes = [];
    }
}

function saveCodesToLocalStorage() {
    localStorage.setItem('scheduleCodes', JSON.stringify(scheduleCodes));
    console.log('💾 Códigos guardados');
}

// ========== RENDERIZADO DE TABLA ==========
function renderCodesTable(codes = scheduleCodes) {
    const tbody = document.getElementById('codesTableBody');

    if (codes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>No hay códigos registrados</h3>
                    <p>Agrega tu primer código haciendo clic en "Agregar Código"</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = codes.map((code, index) => `
        <tr>
            <td class="code-cell">${code.code}</td>
            <td class="schedule-cell">${code.schedule}</td>
            <td class="description-cell">${code.description || '-'}</td>
            <td class="hours-cell">${code.hours || calculateTotalHours(code.schedule)} h</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-edit" onclick="editCode(${index})">✏️ Editar</button>
                    <button class="btn-delete" onclick="deleteCode(${index})">🗑️ Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ========== CALCULAR HORAS ==========
function calculateTotalHours(schedule) {
    if (!schedule) return 0;

    const segments = schedule.toUpperCase().split(' Y ');
    let totalMinutes = 0;

    segments.forEach(segment => {
        const match = segment.match(/(\d{1,2}):(\d{2})\s*A\s*(\d{1,2}):(\d{2})/);
        if (match) {
            const [_, startHour, startMin, endHour, endMin] = match.map(Number);
            const startInMinutes = startHour * 60 + startMin;
            const endInMinutes = endHour * 60 + endMin;
            totalMinutes += endInMinutes - startInMinutes;
        }
    });

    return (totalMinutes / 60).toFixed(1);
}

function calculateHours() {
    const scheduleInput = document.getElementById('scheduleInput');
    const hoursInput = document.getElementById('hoursInput');
    const schedule = scheduleInput.value;

    if (schedule) {
        const hours = calculateTotalHours(schedule);
        hoursInput.value = hours;
    } else {
        hoursInput.value = '';
    }
}

// ========== MODAL ==========
function openAddModal() {
    editingIndex = null;
    document.getElementById('modalTitle').textContent = '➕ Agregar Nuevo Código';
    document.getElementById('codeForm').reset();
    document.getElementById('codeModal').classList.add('active');
}

function openEditModal(index) {
    editingIndex = index;
    const code = scheduleCodes[index];

    document.getElementById('modalTitle').textContent = '✏️ Editar Código';
    document.getElementById('codeInput').value = code.code;
    document.getElementById('scheduleInput').value = code.schedule;
    document.getElementById('descriptionInput').value = code.description || '';
    document.getElementById('hoursInput').value = code.hours || calculateTotalHours(code.schedule);
    document.getElementById('codeModal').classList.add('active');
}

function closeModal() {
    document.getElementById('codeModal').classList.remove('active');
    document.getElementById('codeForm').reset();
    editingIndex = null;
}

function handleFormSubmit(e) {
    e.preventDefault();

    const code = document.getElementById('codeInput').value.trim();
    const schedule = document.getElementById('scheduleInput').value.trim();
    const description = document.getElementById('descriptionInput').value.trim();
    const hours = calculateTotalHours(schedule);

    const newCode = { code, schedule, description, hours };

    if (editingIndex !== null) {
        // Editar código existente
        scheduleCodes[editingIndex] = newCode;
    } else {
        // Agregar nuevo código
        scheduleCodes.push(newCode);
    }

    // Ordenar por código
    scheduleCodes.sort((a, b) => a.code.localeCompare(b.code));

    saveCodesToLocalStorage();
    renderCodesTable();
    updateStats();
    closeModal();
}

// ========== CRUD OPERATIONS ==========
function editCode(index) {
    openEditModal(index);
}

function deleteCode(index) {
    const code = scheduleCodes[index];
    if (confirm(`¿Estás seguro de eliminar el código ${code.code}?`)) {
        scheduleCodes.splice(index, 1);
        saveCodesToLocalStorage();
        renderCodesTable();
        updateStats();
    }
}

function clearAllCodes() {
    if (confirm('⚠️ ¿Estás seguro de eliminar TODOS los códigos? Esta acción no se puede deshacer.')) {
        if (confirm('Esta es tu última advertencia. ¿Realmente quieres eliminar todos los códigos?')) {
            scheduleCodes = [];
            saveCodesToLocalStorage();
            renderCodesTable();
            updateStats();
        }
    }
}

// ========== BÚSQUEDA ==========
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();

    if (!searchTerm) {
        renderCodesTable();
        return;
    }

    const filtered = scheduleCodes.filter(code =>
        code.code.toLowerCase().includes(searchTerm) ||
        code.schedule.toLowerCase().includes(searchTerm) ||
        (code.description && code.description.toLowerCase().includes(searchTerm))
    );

    renderCodesTable(filtered);
}

// ========== ESTADÍSTICAS ==========
function updateStats() {
    document.getElementById('totalCodes').textContent = `Total: ${scheduleCodes.length} códigos`;
}

// ========== IMPORTAR/EXPORTAR ==========
function exportCodes() {
    // Exportar en formato schedule_codes.json
    const exportData = {};

    scheduleCodes.forEach(code => {
        // Convertir de "08:00 A 12:00 Y 17:00 A 21:00" a "08:00-12:00+17:00-21:00"
        const scheduleKey = code.schedule.replace(/ A /g, '-').replace(/ Y /g, '+').replace(/ /g, '');
        const cleanCode = code.code.replace(/^0+/, '') || '0';

        exportData[scheduleKey] = {
            codigo: cleanCode,
            alternativas: []
        };
    });

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule_codes_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    console.log('📥 Códigos exportados en formato schedule_codes.json');
}

function importCodes() {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);

                // Detectar formato
                if (Array.isArray(imported)) {
                    // Formato antiguo: Array de objetos
                    handleArrayImport(imported);
                } else if (typeof imported === 'object') {
                    // Formato schedule_codes.json
                    handleScheduleCodesImport(imported);
                } else {
                    alert('❌ Formato de archivo inválido');
                }
            } catch (error) {
                alert('❌ Error al leer el archivo: ' + error.message);
            }
        };
        reader.readAsText(file);
        fileInput.value = '';
    };
}

function handleArrayImport(imported) {
    if (confirm(`¿Deseas REEMPLAZAR (${scheduleCodes.length} códigos actuales) o COMBINAR con los ${imported.length} códigos importados?`)) {
        // Combinar
        scheduleCodes = [...scheduleCodes, ...imported];
        // Eliminar duplicados por código
        const unique = new Map();
        scheduleCodes.forEach(code => unique.set(code.code, code));
        scheduleCodes = Array.from(unique.values());
    } else {
        // Reemplazar
        scheduleCodes = imported;
    }

    scheduleCodes.sort((a, b) => a.code.localeCompare(b.code));
    saveCodesToLocalStorage();
    renderCodesTable();
    updateStats();
    alert(`✅ Importación exitosa: ${scheduleCodes.length} códigos cargados`);
}

function handleScheduleCodesImport(imported) {
    // Convertir formato schedule_codes.json a formato de tabla
    const newCodes = [];
    for (let schedule in imported) {
        const code = imported[schedule].codigo;
        const description = imported[schedule].description || '';

        // Convertir formato
        const scheduleDisplay = schedule.replace(/-/g, ' A ').replace(/\+/g, ' Y ');

        newCodes.push({
            code: code.padStart(5, '0'),
            schedule: scheduleDisplay,
            description: description,
            hours: calculateTotalHours(scheduleDisplay)
        });
    }

    if (confirm(`¿Deseas REEMPLAZAR (${scheduleCodes.length} códigos actuales) o COMBINAR con los ${newCodes.length} códigos importados?`)) {
        // Combinar
        scheduleCodes = [...scheduleCodes, ...newCodes];
        // Eliminar duplicados por código
        const unique = new Map();
        scheduleCodes.forEach(code => unique.set(code.code, code));
        scheduleCodes = Array.from(unique.values());
    } else {
        // Reemplazar
        scheduleCodes = newCodes;
    }

    scheduleCodes.sort((a, b) => a.code.localeCompare(b.code));
    saveCodesToLocalStorage();
    renderCodesTable();
    updateStats();
    alert(`✅ Importación exitosa: ${scheduleCodes.length} códigos cargados`);
}

function exportToExcel() {
    // Preparar datos para Excel
    const data = [
        ['Código', 'Horario', 'Descripción', 'Horas'],
        ...scheduleCodes.map(code => [
            code.code,
            code.schedule,
            code.description || '',
            code.hours || calculateTotalHours(code.schedule)
        ])
    ];

    // Crear worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Crear workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Códigos de Horarios');

    // Descargar
    XLSX.writeFile(wb, `codigos-horarios-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Hacer funciones globales para onclick
window.editCode = editCode;
window.deleteCode = deleteCode;