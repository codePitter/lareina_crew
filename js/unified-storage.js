// ========== SISTEMA DE ALMACENAMIENTO UNIFICADO ==========
// Este módulo centraliza TODO el almacenamiento del sistema

const UnifiedStorage = {
    // Clave única para todo el sistema
    STORAGE_KEY: 'caramboScheduleSystem',

    // Estructura de datos unificada
    getEmptyStructure() {
        return {
            version: '2.0',
            lastSaved: null,
            week: null,
            cajeros: {
                scheduleData: {},
                dynamicRows: []
            },
            encargados: {
                scheduleData: {},
                dynamicRows: []
            },
            codes: []
        };
    },

    // Cargar TODO el sistema
    loadAll() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                console.log('✅ Sistema completo cargado:', data.version);
                return data;
            }
        } catch (error) {
            console.error('❌ Error al cargar sistema:', error);
        }
        return this.getEmptyStructure();
    },

    // Guardar TODO el sistema
    saveAll(data) {
        try {
            data.lastSaved = new Date().toISOString();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            console.log('💾 Sistema guardado:', data.lastSaved);
            return true;
        } catch (error) {
            console.error('❌ Error al guardar sistema:', error);
            return false;
        }
    },

    // Actualizar SOLO una sección sin tocar las demás
    updateSection(section, subsection, data) {
        try {
            const current = this.loadAll();

            if (subsection) {
                // Actualizar sub-sección (ej: cajeros.scheduleData)
                if (!current[section]) current[section] = {};
                current[section][subsection] = data;
            } else {
                // Actualizar sección completa (ej: codes)
                current[section] = data;
            }

            return this.saveAll(current);
        } catch (error) {
            console.error('❌ Error en updateSection:', error);
            return false;
        }
    },

    // Obtener solo una sección
    getSection(section, subsection) {
        try {
            const data = this.loadAll();

            if (subsection) {
                return data[section]?.[subsection] || (subsection === 'scheduleData' ? {} : []);
            } else {
                return data[section] || (section === 'codes' ? [] : {});
            }
        } catch (error) {
            console.error('❌ Error en getSection:', error);
            return subsection === 'scheduleData' ? {} : [];
        }
    },

    // Migrar datos antiguos al nuevo sistema
    migrateOldData() {
        console.log('🔄 Verificando migración de datos antiguos...');

        const unified = this.loadAll();
        let needsMigration = false;

        // Migrar scheduleData (cajeros)
        const oldScheduleData = localStorage.getItem('scheduleData');
        if (oldScheduleData && Object.keys(unified.cajeros.scheduleData).length === 0) {
            try {
                unified.cajeros.scheduleData = JSON.parse(oldScheduleData);
                needsMigration = true;
                console.log('  ✅ Migrado: scheduleData → cajeros.scheduleData');
            } catch (e) {
                console.error('  ❌ Error migrando scheduleData:', e);
            }
        }

        // Migrar dynamicRows (cajeros)
        const oldDynamicRows = localStorage.getItem('dynamicRows');
        if (oldDynamicRows && unified.cajeros.dynamicRows.length === 0) {
            try {
                unified.cajeros.dynamicRows = JSON.parse(oldDynamicRows);
                needsMigration = true;
                console.log('  ✅ Migrado: dynamicRows → cajeros.dynamicRows');
            } catch (e) {
                console.error('  ❌ Error migrando dynamicRows:', e);
            }
        }

        // Migrar managersScheduleData (encargados)
        const oldManagersData = localStorage.getItem('managersScheduleData');
        if (oldManagersData && Object.keys(unified.encargados.scheduleData).length === 0) {
            try {
                unified.encargados.scheduleData = JSON.parse(oldManagersData);
                needsMigration = true;
                console.log('  ✅ Migrado: managersScheduleData → encargados.scheduleData');
            } catch (e) {
                console.error('  ❌ Error migrando managersScheduleData:', e);
            }
        }

        // Migrar managersDynamicRows (encargados)
        const oldManagersDynamic = localStorage.getItem('managersDynamicRows');
        if (oldManagersDynamic && unified.encargados.dynamicRows.length === 0) {
            try {
                unified.encargados.dynamicRows = JSON.parse(oldManagersDynamic);
                needsMigration = true;
                console.log('  ✅ Migrado: managersDynamicRows → encargados.dynamicRows');
            } catch (e) {
                console.error('  ❌ Error migrando managersDynamicRows:', e);
            }
        }

        // Migrar scheduleCodes
        const oldCodes = localStorage.getItem('scheduleCodes');
        if (oldCodes && unified.codes.length === 0) {
            try {
                unified.codes = JSON.parse(oldCodes);
                needsMigration = true;
                console.log('  ✅ Migrado: scheduleCodes → codes');
            } catch (e) {
                console.error('  ❌ Error migrando scheduleCodes:', e);
            }
        }

        // Guardar datos migrados
        if (needsMigration) {
            this.saveAll(unified);
            console.log('✅ Migración completada. Datos unificados guardados.');

            // Hacer backup de claves antiguas antes de eliminar
            localStorage.setItem('backup_legacy_data_' + Date.now(), JSON.stringify({
                scheduleData: oldScheduleData,
                dynamicRows: oldDynamicRows,
                managersScheduleData: oldManagersData,
                managersDynamicRows: oldManagersDynamic,
                scheduleCodes: oldCodes
            }));

            console.log('📦 Backup de datos antiguos creado.');
        } else {
            console.log('✅ No se necesita migración.');
        }

        return unified;
    },

    // Limpiar TODO el sistema
    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('🗑️ Sistema limpiado completamente');
    },

    // Exportar todo para backup
    exportAll() {
        const data = this.loadAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_completo_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('📥 Backup completo exportado');
    },

    // Importar backup completo
    importAll(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            // Validar estructura
            if (!data.version || !data.cajeros || !data.encargados) {
                throw new Error('Formato de backup inválido');
            }

            this.saveAll(data);
            console.log('📤 Backup importado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error al importar backup:', error);
            return false;
        }
    }
};

// Auto-migrar al cargar
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
        UnifiedStorage.migrateOldData();
    });
}