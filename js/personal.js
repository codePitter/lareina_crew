// ========== GESTIÓN DE PERSONAL ==========
// Este módulo maneja la gestión completa del personal del sistema

// Estado global
let personnel = [];
let filteredPersonnel = [];
let editingPersonId = null;

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Iniciando módulo de Gestión de Personal...');
    
    // Cargar personal
    loadPersonnel();
    
    // Inicializar event listeners
    initializeEventListeners();
    
    // Renderizar tabla inicial
    renderPersonnelTable();
    updateStats();
});

// ========== CARGAR PERSONAL ==========
function loadPersonnel() {
    try {
        const systemData = UnifiedStorage.loadAll();
        
        // Intentar cargar desde el sistema unificado
        if (systemData.personnel && Array.isArray(systemData.personnel)) {
            personnel = systemData.personnel;
            console.log('✅ Personal cargado desde sistema unificado:', personnel.length);
        } else {
            // Si no existe, crear estructura vacía
            personnel = [];
            console.log('ℹ️ No hay personal guardado. Iniciando con lista vacía.');
        }
        
        filteredPersonnel = [...personnel];
    } catch (error) {
        console.error('❌ Error al cargar personal:', error);
        personnel = [];
        filteredPersonnel = [];
    }
}

// ========== GUARDAR PERSONAL ==========
function savePersonnel() {
    try {
        const systemData = UnifiedStorage.loadAll();
        systemData.personnel = personnel;
        systemData.metadata = {
            total: personnel.length,
            lastUpdated: new Date().toISOString().split('T')[0],
            version: '2.1'
        };
        
        UnifiedStorage.saveAll(systemData);
        console.log('💾 Personal guardado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al guardar personal:', error);
        alert('Error al guardar los datos. Por favor, intente nuevamente.');
        return false;
    }
}

// ========== EVENT LISTENERS ==========
function initializeEventListeners() {
    // Menú hamburguesa
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            sideMenu.classList.toggle('active');
            menuOverlay.classList.toggle('active');
        });
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', () => {
            hamburgerBtn.classList.remove('active');
            sideMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
        });
    }
    
    // Botones del menú lateral
    document.getElementById('menuAddPerson')?.addEventListener('click', () => openAddPersonModal());
    document.getElementById('menuExportJSON')?.addEventListener('click', () => exportPersonnelJSON());
    document.getElementById('menuImportJSON')?.addEventListener('click', () => importPersonnelJSON());
    
    // Botones de acción principales
    document.getElementById('addPersonBtn')?.addEventListener('click', () => openAddPersonModal());
    document.getElementById('exportJSONBtn')?.addEventListener('click', () => exportPersonnelJSON());
    document.getElementById('importJSONBtn')?.addEventListener('click', () => importPersonnelJSON());
    
    // Filtros
    document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
    document.getElementById('typeFilter')?.addEventListener('change', applyFilters);
    document.getElementById('contractFilter')?.addEventListener('change', applyFilters);
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    
    // Modal
    document.getElementById('closePersonModal')?.addEventListener('click', closePersonModal);
    document.getElementById('cancelPersonEdit')?.addEventListener('click', closePersonModal);
    document.getElementById('personForm')?.addEventListener('submit', handlePersonSubmit);
    
    // Importar archivo
    document.getElementById('importFileInput')?.addEventListener('change', handleFileImport);
    
    // Cerrar modal al hacer click fuera
    document.getElementById('personModal')?.addEventListener('click', function (e) {
        if (e.target.id === 'personModal') {
            closePersonModal();
        }
    });
    
    // Actualizar horas según contrato
    document.getElementById('personContract')?.addEventListener('change', function() {
        const hoursSelect = document.getElementById('personHours');
        if (this.value === 'Full-time') {
            hoursSelect.value = '48';
        } else {
            hoursSelect.value = '30';
        }
    });
}

// ========== RENDERIZAR TABLA ==========
function renderPersonnelTable() {
    const tbody = document.getElementById('personnelTableBody');
    
    if (!tbody) return;
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    // Si no hay personal
    if (filteredPersonnel.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <div class="empty-state-text">No hay personal para mostrar</div>
                        <div class="empty-state-subtext">Agrega nuevo personal usando el botón "➕ Agregar Personal"</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordenar por ID
    filteredPersonnel.sort((a, b) => a.id - b.id);
    
    // Renderizar cada persona
    filteredPersonnel.forEach(person => {
        const row = document.createElement('tr');
        
        const statusClass = person.active ? 'status-active' : 'status-inactive';
        const statusText = person.active ? 'Activo' : 'Inactivo';
        
        const typeClass = person.isManager ? 'type-manager' : 'type-cashier';
        const typeText = person.isManager ? 'Encargado/a' : 'Cajero/a';
        
        row.innerHTML = `
            <td class="id-cell">${person.id}</td>
            <td class="name-cell">${person.name}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td><span class="type-badge ${typeClass}">${typeText}</span></td>
            <td class="contract-cell">${person.contractType}</td>
            <td class="hours-cell">${person.weeklyHours}h</td>
            <td class="actions-cell">
                <button class="btn-edit" onclick="editPerson(${person.id})">✏️ Editar</button>
                <button class="btn-delete" onclick="deletePerson(${person.id})">🗑️ Eliminar</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// ========== ACTUALIZAR ESTADÍSTICAS ==========
function updateStats() {
    const total = personnel.length;
    const active = personnel.filter(p => p.active).length;
    const managers = personnel.filter(p => p.isManager).length;
    
    document.getElementById('totalPersonnel').textContent = `Total: ${total}`;
    document.getElementById('activePersonnel').textContent = `Activos: ${active}`;
    document.getElementById('managersCount').textContent = `Encargados: ${managers}`;
}

// ========== FILTROS ==========
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const contractFilter = document.getElementById('contractFilter').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    
    filteredPersonnel = personnel.filter(person => {
        // Filtro de estado
        if (statusFilter === 'active' && !person.active) return false;
        if (statusFilter === 'inactive' && person.active) return false;
        
        // Filtro de tipo
        if (typeFilter === 'manager' && !person.isManager) return false;
        if (typeFilter === 'cashier' && person.isManager) return false;
        
        // Filtro de contrato
        if (contractFilter !== 'all' && person.contractType !== contractFilter) return false;
        
        // Búsqueda por texto
        if (searchText) {
            const nameMatch = person.name.toLowerCase().includes(searchText);
            const idMatch = person.id.toString().includes(searchText);
            if (!nameMatch && !idMatch) return false;
        }
        
        return true;
    });
    
    renderPersonnelTable();
}

// ========== MODAL - AGREGAR PERSONAL ==========
function openAddPersonModal() {
    editingPersonId = null;
    
    document.getElementById('personModalTitle').textContent = '➕ Agregar Personal';
    document.getElementById('personForm').reset();
    
    // Habilitar campo ID
    document.getElementById('personId').disabled = false;
    
    // Sugerir siguiente ID
    const maxId = personnel.length > 0 ? Math.max(...personnel.map(p => p.id)) : 0;
    document.getElementById('personId').value = maxId + 1;
    
    // Abrir modal
    document.getElementById('personModal').classList.add('active');
}

// ========== MODAL - EDITAR PERSONAL ==========
function editPerson(id) {
    const person = personnel.find(p => p.id === id);
    if (!person) return;
    
    editingPersonId = id;
    
    document.getElementById('personModalTitle').textContent = '✏️ Editar Personal';
    
    // Rellenar formulario
    document.getElementById('personId').value = person.id;
    document.getElementById('personId').disabled = true; // No permitir cambiar ID
    document.getElementById('personName').value = person.name;
    document.getElementById('personActive').value = person.active.toString();
    document.getElementById('personIsManager').value = person.isManager.toString();
    document.getElementById('personContract').value = person.contractType;
    document.getElementById('personHours').value = person.weeklyHours;
    
    // Abrir modal
    document.getElementById('personModal').classList.add('active');
}

// ========== MODAL - CERRAR ==========
function closePersonModal() {
    document.getElementById('personModal').classList.remove('active');
    editingPersonId = null;
}

// ========== FORMULARIO - SUBMIT ==========
function handlePersonSubmit(e) {
    e.preventDefault();
    
    const personData = {
        id: parseInt(document.getElementById('personId').value),
        name: document.getElementById('personName').value.trim(),
        active: document.getElementById('personActive').value === 'true',
        isManager: document.getElementById('personIsManager').value === 'true',
        contractType: document.getElementById('personContract').value,
        weeklyHours: parseInt(document.getElementById('personHours').value)
    };
    
    // Validar ID único (solo al agregar)
    if (editingPersonId === null) {
        const idExists = personnel.some(p => p.id === personData.id);
        if (idExists) {
            alert(`El ID ${personData.id} ya existe. Por favor, usa otro ID.`);
            return;
        }
    }
    
    // Agregar o actualizar
    if (editingPersonId === null) {
        // Agregar nuevo
        personnel.push(personData);
        console.log('✅ Nuevo personal agregado:', personData.name);
    } else {
        // Actualizar existente
        const index = personnel.findIndex(p => p.id === editingPersonId);
        if (index !== -1) {
            personnel[index] = personData;
            console.log('✅ Personal actualizado:', personData.name);
        }
    }
    
    // Guardar y actualizar
    if (savePersonnel()) {
        filteredPersonnel = [...personnel];
        renderPersonnelTable();
        updateStats();
        closePersonModal();
        
        const action = editingPersonId === null ? 'agregado' : 'actualizado';
        alert(`Personal ${action} correctamente: ${personData.name}`);
    }
}

// ========== ELIMINAR PERSONAL ==========
function deletePerson(id) {
    const person = personnel.find(p => p.id === id);
    if (!person) return;
    
    const confirmDelete = confirm(
        `¿Estás seguro de eliminar a ${person.name}?\n\n` +
        `Esta acción no se puede deshacer.`
    );
    
    if (confirmDelete) {
        personnel = personnel.filter(p => p.id !== id);
        
        if (savePersonnel()) {
            filteredPersonnel = [...personnel];
            renderPersonnelTable();
            updateStats();
            console.log('🗑️ Personal eliminado:', person.name);
            alert(`${person.name} ha sido eliminado correctamente.`);
        }
    }
}

// ========== EXPORTAR JSON ==========
function exportPersonnelJSON() {
    const exportData = {
        personnel: personnel,
        metadata: {
            total: personnel.length,
            lastUpdated: new Date().toISOString().split('T')[0],
            version: '2.1'
        }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log('📥 Personal exportado a JSON');
}

// ========== IMPORTAR JSON ==========
function importPersonnelJSON() {
    document.getElementById('importFileInput').click();
}

function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function (event) {
        try {
            const importedData = JSON.parse(event.target.result);
            
            // Validar estructura
            if (!importedData.personnel || !Array.isArray(importedData.personnel)) {
                throw new Error('Formato de archivo inválido');
            }
            
            // Validar cada persona
            const isValid = importedData.personnel.every(person => {
                return person.id !== undefined &&
                       person.name &&
                       person.active !== undefined &&
                       person.isManager !== undefined &&
                       person.contractType &&
                       person.weeklyHours;
            });
            
            if (!isValid) {
                throw new Error('Los datos del archivo no son válidos');
            }
            
            // Confirmar importación
            const confirmImport = confirm(
                `¿Importar ${importedData.personnel.length} personas?\n\n` +
                `ADVERTENCIA: Esto reemplazará todos los datos actuales.`
            );
            
            if (confirmImport) {
                personnel = importedData.personnel;
                
                if (savePersonnel()) {
                    filteredPersonnel = [...personnel];
                    renderPersonnelTable();
                    updateStats();
                    applyFilters();
                    console.log('📂 Personal importado correctamente');
                    alert(`${personnel.length} personas importadas correctamente.`);
                }
            }
        } catch (error) {
            console.error('❌ Error al importar:', error);
            alert(`Error al importar archivo: ${error.message}`);
        }
        
        // Limpiar input
        e.target.value = '';
    };
    
    reader.readAsText(file);
}

// ========== FUNCIONES GLOBALES ==========
// Hacer funciones accesibles globalmente para onclick
window.editPerson = editPerson;
window.deletePerson = deletePerson;
