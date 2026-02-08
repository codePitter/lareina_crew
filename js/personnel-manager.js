// ========== MÓDULO CENTRALIZADO DE PERSONAL ==========
// Este módulo maneja la carga del personal desde UnifiedStorage
// TODAS las páginas deben usar este módulo para obtener el personal

const PersonnelManager = {
    // Cargar personal desde UnifiedStorage
    loadPersonnel() {
        try {
            const systemData = UnifiedStorage.loadAll();
            
            // Si existe personal en el sistema unificado, usarlo
            if (systemData.personnel && Array.isArray(systemData.personnel) && systemData.personnel.length > 0) {
                console.log('✅ Personal cargado desde UnifiedStorage:', systemData.personnel.length);
                return systemData.personnel;
            }
            
            // Si no hay personal, devolver array vacío
            console.warn('⚠️ No hay personal en UnifiedStorage. Usa personal.html para agregar personal.');
            return [];
        } catch (error) {
            console.error('❌ Error al cargar personal:', error);
            return [];
        }
    },

    // Obtener solo cajeros activos (sin encargados)
    getActiveCashiers() {
        const personnel = this.loadPersonnel();
        return personnel
            .filter(person => person.active && !person.isManager)
            .sort((a, b) => a.name.localeCompare(b.name));
    },

    // Obtener solo encargados activos
    getActiveManagers() {
        const personnel = this.loadPersonnel();
        return personnel
            .filter(person => person.active && person.isManager)
            .sort((a, b) => a.name.localeCompare(b.name));
    },

    // Obtener todo el personal activo (cajeros + encargados)
    getAllActive() {
        const personnel = this.loadPersonnel();
        return personnel
            .filter(person => person.active)
            .sort((a, b) => a.name.localeCompare(b.name));
    },

    // Obtener persona por ID
    getPersonById(id) {
        const personnel = this.loadPersonnel();
        return personnel.find(person => person.id === id);
    },

    // Obtener persona por nombre
    getPersonByName(name) {
        const personnel = this.loadPersonnel();
        return personnel.find(person => person.name === name);
    },

    // Obtener nombres de cajeros activos (para compatibilidad)
    getCashierNames() {
        return this.getActiveCashiers().map(person => person.name);
    },

    // Obtener nombres de encargados activos (para compatibilidad)
    getManagerNames() {
        return this.getActiveManagers().map(person => person.name);
    },

    // Obtener todos los nombres activos (para compatibilidad)
    getAllActiveNames() {
        return this.getAllActive().map(person => person.name);
    },

    // Importar personal desde JSON (para migración inicial)
    async importFromJSON(jsonUrl = 'crew/personnel.json') {
        try {
            const response = await fetch(jsonUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();

            if (!data.personnel || !Array.isArray(data.personnel)) {
                throw new Error('Formato de JSON inválido');
            }

            // Guardar en UnifiedStorage
            const systemData = UnifiedStorage.loadAll();
            systemData.personnel = data.personnel;
            systemData.metadata = data.metadata || {
                total: data.personnel.length,
                lastUpdated: new Date().toISOString().split('T')[0],
                version: '2.1'
            };

            UnifiedStorage.saveAll(systemData);

            console.log('✅ Personal importado desde JSON a UnifiedStorage:', data.personnel.length);
            return true;
        } catch (error) {
            console.error('❌ Error al importar personal desde JSON:', error);
            return false;
        }
    },

    // Verificar si hay personal cargado
    hasPersonnel() {
        const personnel = this.loadPersonnel();
        return personnel.length > 0;
    },

    // Migración automática desde JSON si no hay personal
    async autoMigrateIfNeeded() {
        if (!this.hasPersonnel()) {
            console.log('🔄 No hay personal en UnifiedStorage. Intentando migrar desde JSON...');
            const success = await this.importFromJSON();
            
            if (success) {
                console.log('✅ Migración automática completada');
            } else {
                console.warn('⚠️ No se pudo migrar. Por favor, usa personal.html para agregar personal.');
            }
            
            return success;
        }
        return true;
    }
};

// Auto-migrar al cargar si es necesario
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async function () {
        await PersonnelManager.autoMigrateIfNeeded();
    });
}
