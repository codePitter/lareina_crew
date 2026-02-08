# 📋 Sistema de Gestión de Horarios

Sistema web interactivo para la gestión y organización de horarios de personal en comercios y empresas. Diseñado específicamente para facilitar la asignación de turnos, francos, licencias y vacaciones de forma visual e intuitiva.

![Sistema de Gestión de Horarios](https://img.shields.io/badge/version-2.0.0-orange) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ Características Principales

### 🎯 Gestión de Horarios

#### Página Principal (Crear Horarios)
- **32 posiciones de trabajo configurables**: Cajas numeradas del 1 al 32 (sin caja 28)
- **3 turnos por posición**: Turno 1 (Mañana), Turno 2 (Medio), Turno 3 (Tarde)
- **Horarios flexibles**: Entrada y salida personalizables en formato 24 horas
- **Horario cortado**: Permite asignar la misma persona a múltiples turnos sin superposición
- **Filas dinámicas**: Agrega filas personalizadas con etiquetas propias
- **Sistema de códigos automático**: Asigna códigos numéricos a cada combinación única de horarios

#### Vista de Horarios por Cajero/a
- **Tabla consolidada**: Visualiza todos los horarios de cada cajero/a en una semana
- **Filtros avanzados**: 
  - Por tipo de contrato (Full-time 48hs / Part-time 30-36hs)
  - Búsqueda por nombre de cajero/a
- **Cálculo automático de horas**:
  - Total de horas semanales
  - **Horas extras**: Muestra cuántas horas de más o de menos tiene cada persona
- **Códigos de horario**: Sistema de códigos para identificar rápidamente combinaciones de turnos
- **Gestión de códigos**: Edita y personaliza los códigos de horarios
- **Exportación a Excel**: Descarga los horarios en formato .xlsx

### 🖱️ Interfaz Drag & Drop
- Arrastra nombres desde la barra lateral a las cajas
- Duplica asignaciones para horarios cortados
- Doble clic para quitar asignaciones
- Visualización en tiempo real de horarios asignados
- Detección automática de conflictos de horarios

### 📅 Gestión Semanal
- **7 días**: Planificación de Lunes a Domingo
- Navegación rápida entre días con tabs
- Selector de fecha para identificar la semana
- Cada día guarda su configuración independiente
- Vista consolidada de toda la semana por empleado

### 🏖️ Estados de Personal
- **Francos**: Días libres del personal (zona visible en área principal)
- **Licencias**: Ausencias médicas o personales (sidebar)
- **Vacaciones**: Períodos de descanso (sidebar)
- Indicadores visuales con horarios asignados
- Sin duplicados: Una persona no puede estar en dos estados simultáneamente

### 👥 Gestión de Personal
- **Base de datos de personal**: JSON con información completa de empleados
- **Información por empleado**:
  - ID único
  - Nombre completo
  - Estado (Activo/Inactivo)
  - Tipo de contrato (Full-time/Part-time)
  - Horas semanales contratadas
- **Operaciones**:
  - Agregar nuevos empleados
  - Editar información existente
  - Activar/Desactivar empleados
  - Eliminar empleados
  - Exportar/Importar JSON de personal

### 💾 Persistencia de Datos
- **Guardado automático**: Los datos se guardan en localStorage
- **Backup/Restore**: Exporta e importa configuraciones en formato JSON
- **Exportación PDF**: Genera documentos imprimibles de los horarios
- **Exportación Excel**: Descarga horarios por cajero en .xlsx
- **Importación desde ODS**: Carga horarios desde archivos LibreOffice Calc
- **Botón Limpiar**: Resetea todos los horarios con confirmación

## 🎨 Diseño

El sistema utiliza una paleta de colores moderna y profesional:

### Colores Principales
- **Azul primario** (#4A90E2): Elementos principales y encabezados
- **Azul secundario** (#357ABD): Hover y estados activos
- **Verde** (#66BB6A): Acciones exitosas, horas extras positivas
- **Naranja** (#FF9800): Advertencias y elementos especiales
- **Rojo** (#EF5350): Alertas y déficit de horas
- **Teal/Turquesa** (#00BCD4): Acentos y elementos destacados

### Características del Diseño
- Diseño responsive optimizado para desktop
- Interfaz limpia y moderna
- Tablas con scroll independiente
- Efectos hover suaves
- Indicadores de estado con colores semafóricos

## 🚀 Instalación

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- No requiere servidor backend
- No requiere instalación de dependencias

### Pasos de Instalación

1. **Clona el repositorio**
```bash
git clone https://github.com/codePitter/lareina_crew.git
cd lareina_crew
```

2. **Estructura de archivos**
```
lareina_crew/
│
├── index.html                  # Página principal - Crear Horarios
├── planilla-horarios.html       # Página - Horarios por Cajero/a
├── css/
│   ├── style.css               # Estilos página principal
│   └── planilla-horarios.css    # Estilos vista cajeros
├── js/
│   ├── main.js                 # Lógica página principal
│   └── planilla-horarios.js     # Lógica vista cajeros
├── crew/
│   └── personnel.json          # Base de datos de personal
└── README.md                   # Este archivo
```

3. **Abre el sistema**
- Simplemente abre `index.html` en tu navegador
- O usa un servidor local:
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (http-server)
npx http-server
```

4. **¡Listo!** 🎉
Navega a `http://localhost:8000` si usas servidor local, o simplemente abre el archivo HTML.

## 📖 Guía de Uso

### 1️⃣ Asignar Turnos (index.html)
1. Selecciona el día en los tabs (LUN, MAR, MIÉ, etc.)
2. Arrastra un nombre desde la barra lateral "Personal Disponible"
3. Suéltalo en el turno correspondiente (T1, T2, T3)
4. Completa los horarios de entrada y salida
5. El nombre se marcará como "usado" en la barra lateral

### 2️⃣ Horario Cortado
1. Arrastra un nombre ya asignado a otro turno del mismo día
2. El sistema validará automáticamente que no haya superposición
3. Se permite si los horarios no se superponen (ej: 8:00-13:30 y 17:00-21:00)
4. Si hay conflicto, el sistema mostrará una alerta

### 3️⃣ Quitar Asignaciones
- **Doble clic** en un turno asignado para quitarlo
- El nombre volverá a estar disponible en la barra lateral

### 4️⃣ Gestionar Estados
- **Francos**: Arrastra a la zona de francos (parte inferior del área principal)
- **Licencias**: Arrastra a la zona de licencias (sidebar derecho)
- **Vacaciones**: Arrastra a la zona de vacaciones (sidebar derecho)
- Click en **✕** para quitar del estado

### 5️⃣ Agregar Filas Dinámicas
1. Click en el botón "➕ Agregar Fila"
2. Ingresa una etiqueta personalizada (ej: "Supervisor", "Gerencia")
3. La nueva fila se agregará al final
4. Click en "✕ Eliminar" para quitar la fila

### 6️⃣ Ver Horarios por Cajero (planilla-horarios.html)
1. Click en el botón "📊 Ver Horarios por Cajero"
2. Selecciona la semana que deseas ver
3. Usa los filtros:
   - **Tipo de contrato**: Full-time o Part-time
   - **Buscar**: Filtra por nombre
4. Visualiza:
   - Horarios de toda la semana para cada persona
   - Códigos de horario asignados
   - Total de horas trabajadas
   - **Horas extras** (positivas o negativas)

### 7️⃣ Gestionar Personal
1. Click en "👥 Gestionar Personal"
2. **Agregar**: Click en "➕ Agregar Persona"
3. **Editar**: Click en "✏️ Editar" junto al empleado
4. **Activar/Desactivar**: Click en el botón de estado
5. **Eliminar**: Click en "🗑️ Eliminar" (requiere confirmación)
6. **Exportar/Importar**: Usa los botones para guardar/cargar el JSON

### 8️⃣ Gestionar Códigos de Horario
1. En planilla-horarios.html, click en "⚙️ Gestionar Códigos"
2. Visualiza todos los códigos generados automáticamente
3. Edita el número de código si deseas personalizarlo
4. Guarda los cambios
5. Exporta/Importa códigos según necesites

### 9️⃣ Exportar y Guardar
- **📥 PDF**: Genera un documento PDF del día actual (index.html)
- **📥 Exportar Excel**: Descarga tabla de horarios en .xlsx (planilla-horarios.html)
- **💾 Guardar**: Descarga un archivo JSON con todos los horarios
- **📂 Cargar**: Restaura un backup previo
- **🗑️ Limpiar**: Borra todos los datos (requiere confirmación)

### 🔟 Importar Horarios desde ODS
1. Prepara un archivo .ods con la siguiente estructura:
   - Columnas: Caja, Horario, Nombre
   - Una hoja por día de la semana
2. Click en "📂 Cargar" en index.html
3. Selecciona el archivo .ods
4. El sistema importará automáticamente los horarios

## 🔧 Validaciones del Sistema

### ✅ Validación de Duplicados
- Una persona NO puede estar en dos turnos simultáneos del mismo día
- Una persona NO puede tener turno Y estar en Franco/Licencia/Vacaciones
- Se permite horario cortado solo si no hay superposición de horarios
- El sistema resalta conflictos en rojo automáticamente

### ⏰ Validación de Horarios
- Los horarios se validan automáticamente al asignar
- Formato 24 horas estándar (HH:MM)
- Detección de superposición entre turnos
- Cálculo automático de horas trabajadas

### 💾 Persistencia
- Los datos se guardan automáticamente en cada cambio
- Se recuperan al recargar la página
- Compatible con localStorage del navegador
- Máximo ~5MB de almacenamiento disponible

### 📊 Cálculo de Horas Extras
- Se calcula: **Total Horas Trabajadas - Horas Contrato**
- **Positivo (verde)**: Horas extras trabajadas
- **Negativo (rojo)**: Déficit de horas
- **Cero**: Horas exactas del contrato

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica y moderna
- **CSS3**: Variables CSS, Flexbox, Grid, animaciones
- **JavaScript (Vanilla ES6+)**: Lógica sin frameworks
  - Drag & Drop API
  - localStorage API
  - Async/Await
  - Módulos ES6

### Librerías
- **jsPDF** (2.5.1): Generación de documentos PDF
- **jsPDF-AutoTable** (3.5.31): Creación de tablas en PDF
- **SheetJS (xlsx)** (0.18.5): Exportación a Excel (.xlsx)

### Formatos de Datos
- **JSON**: Almacenamiento y transferencia de datos
- **ODS**: Importación desde LibreOffice Calc
- **XLSX**: Exportación a Excel
- **PDF**: Documentos imprimibles

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Resoluciones
- ✅ Optimizado para 1920x1080 (Full HD)
- ✅ Compatible con 1366x768 y superiores
- ⚠️ Responsive limitado en móviles (diseñado para desktop)

### Características del Navegador
- localStorage habilitado (requerido)
- JavaScript habilitado (requerido)
- Drag & Drop API (requerido)

## 🎯 Casos de Uso

### 🏪 Comercios Minoristas
- Gestión de cajeros por turno
- Control de personal en diferentes secciones
- Planificación semanal de coberturas
- Seguimiento de horas extras
- Cumplimiento de contratos laborales

### 🏢 Empresas de Servicio
- Asignación de personal por área
- Control de turnos rotativos
- Gestión de ausencias y francos
- Reportes de horas trabajadas

### 🏥 Centros de Atención
- Organización de personal de atención
- Control de horarios escalonados
- Gestión de coberturas por especialidad

### 🍔 Restaurantes y Cafeterías
- Turnos de cocina y sala
- Control de horarios de mozos
- Gestión de personal por sección

## 📊 Características Técnicas

### Estructura de Datos - Horarios

```javascript
scheduleData = {
  0: { // Día (0=Lun, 1=Mar, ..., 6=Dom)
    cajas: {
      "1": { // Número de caja (string)
        turno1: { 
          name: 'Apellido Nombre', 
          entrada: '08:00', 
          salida: '13:30' 
        },
        turno2: { name: '', entrada: '', salida: '' },
        turno3: { 
          name: 'Apellido Nombre', 
          entrada: '17:00', 
          salida: '21:00' 
        }
      },
      // ... hasta caja 32
    },
    francos: ['Apellido1', 'Apellido2'],
    licencias: ['Apellido3'],
    vacaciones: ['Apellido4']
  },
  // ... días 1-6
}
```

### Estructura de Datos - Personal

```javascript
{
  "personnel": [
    {
      "id": 1,
      "name": "Apellido Nombre",
      "active": true,
      "contractType": "Full-time", // o "Part-time"
      "weeklyHours": 48 // o 30, 36
    },
    // ... más empleados
  ],
  "metadata": {
    "total": 54,
    "lastUpdated": "2026-01-29",
    "version": "2.0"
  }
}
```

### Estructura de Códigos de Horario

```javascript
{
  "1": {
    "code": "1",
    "description": "Mañana y Tarde",
    "segments": [
      { "start": "09:00", "end": "13:00" },
      { "start": "17:00", "end": "21:00" }
    ],
    "totalHours": 8
  },
  // ... más códigos
}
```

### Almacenamiento localStorage

| Key | Contenido | Tamaño Aprox. |
|-----|-----------|---------------|
| `scheduleData` | Horarios de la semana | ~50KB |
| `personnelData` | Base de datos de personal | ~15KB |
| `scheduleCodes` | Códigos de horarios | ~5KB |
| **Total** | | **~70KB** |

### Performance
- Carga inicial: < 500ms
- Guardado automático: < 100ms
- Renderizado de tabla: < 300ms (54 empleados)
- Exportación PDF: < 2s
- Exportación Excel: < 1s

## 🔄 Flujo de Trabajo Recomendado

1. **Configuración inicial**
   - Cargar/actualizar base de datos de personal (👥 Gestionar Personal)
   - Verificar contratos y horas semanales

2. **Planificación semanal**
   - Seleccionar semana en el selector de fecha
   - Asignar turnos día por día usando drag & drop
   - Marcar francos, licencias y vacaciones

3. **Revisión y ajustes**
   - Ir a "📊 Ver Horarios por Cajero"
   - Revisar horas totales y extras de cada persona
   - Ajustar según necesidad

4. **Guardado y distribución**
   - Guardar backup en JSON
   - Exportar PDF para imprimir
   - Exportar Excel para compartir

5. **Semana siguiente**
   - Cambiar fecha de semana
   - Opcionalmente importar semana anterior como base
   - Realizar ajustes necesarios

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Ideas para Contribuir
- 📱 Mejorar responsividad móvil
- 🌐 Internacionalización (i18n)
- 📊 Reportes y estadísticas avanzadas
- 🔔 Sistema de notificaciones
- 👥 Gestión de múltiples usuarios/roles
- 🔐 Autenticación y permisos
- 📧 Envío automático de horarios por email
- 📅 Integración con Google Calendar
- 💰 Cálculo de costos laborales
- 📈 Gráficos de distribución de horas

## 🐛 Reporte de Bugs

Si encuentras un bug, por favor abre un [issue](https://github.com/codePitter/lareina_crew/issues) incluyendo:

- **Descripción clara** del problema
- **Pasos para reproducir** el error
- **Comportamiento esperado** vs actual
- **Screenshots o videos** (si aplica)
- **Información del navegador**:
  - Navegador y versión
  - Sistema operativo
  - Resolución de pantalla
- **Datos de prueba** (si es posible)

## 📝 Changelog

### Versión 2.0.0 (Enero 2026) - Actual
✅ **Nuevas funcionalidades:**
- Vista de horarios consolidada por cajero/a
- Cálculo automático de horas extras
- Sistema de códigos de horarios
- Filtros avanzados (contrato, búsqueda)
- Exportación a Excel (.xlsx)
- Gestión completa de personal
- Importación desde ODS
- Mejoras en el diseño y UX
- Optimización de rendimiento

### Versión 1.0.0 (Inicial)
- Gestión básica de horarios por día
- Drag & Drop de personal
- Estados: Francos, Licencias, Vacaciones
- Exportación PDF
- Backup/Restore JSON

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Pitter** - *Desarrollo Completo* - [codePitter](https://github.com/codePitter)

## 🙏 Agradecimientos

- Diseño inspirado en sistemas modernos de gestión de recursos humanos
- Comunidad de desarrolladores por feedback y sugerencias
- Usuarios beta testers por identificar mejoras
- Bibliotecas open source utilizadas

## 📧 Contacto

Para preguntas, sugerencias o soporte:

- **Email**: pitterbck@gmail.com
- **GitHub Issues**: [Crear Issue](https://github.com/codePitter/lareina_crew/issues)
- **LinkedIn**: [hpqode](https://linkedin.com/in/hpqode)

## 💡 Tips y Trucos

### Atajos de Teclado
- **Doble clic** en turno: Eliminar asignación
- **Drag & Drop**: Asignar personal

### Mejores Prácticas
- Guarda backups semanales en JSON
- Revisa horas extras antes de finalizar la semana
- Mantén actualizada la base de datos de personal
- Usa códigos de horario para identificar patrones comunes
- Exporta a Excel para análisis detallados

### Solución de Problemas Comunes

**Problema**: No se guardan los cambios
- **Solución**: Verifica que localStorage esté habilitado en tu navegador

**Problema**: Conflictos de horarios no detectados
- **Solución**: Asegúrate de que los horarios estén en formato HH:MM correcto

**Problema**: Personal no aparece en la lista
- **Solución**: Verifica que esté marcado como "Activo" en Gestionar Personal

**Problema**: Horas extras incorrectas
- **Solución**: Verifica las horas semanales del contrato en el archivo personnel.json

---

⭐ **Si te resulta útil este proyecto, ¡dale una estrella en GitHub!**

**Made with ❤️ for better schedule management**

🚀 **Versión 2.0** - Sistema completo de gestión de horarios con análisis de horas extras