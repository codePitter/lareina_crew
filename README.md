# 📋 Sistema de Gestión de Horarios

Sistema web interactivo para la gestión y organización de horarios de personal en comercios y empresas. Diseñado específicamente para facilitar la asignación de turnos, francos, licencias y vacaciones de forma visual e intuitiva.

![Sistema de Gestión de Horarios](https://img.shields.io/badge/version-1.0.0-orange) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ Características Principales

### 🎯 Gestión de Horarios
- **29 posiciones de trabajo**: 26 cajas numeradas + Perfumería + Aux. 1 + Aux. 2 + At. Cliente
- **3 turnos por posición**: Turno 1, Turno 2 y Turno 3
- **Horarios flexibles**: Entrada y salida personalizables en formato 24 horas
- **Horario cortado**: Permite asignar la misma persona a múltiples turnos sin superposición

### 🖱️ Interfaz Drag & Drop
- Arrastra apellidos desde la barra lateral a las cajas
- Duplica asignaciones para horarios cortados
- Doble clic para quitar asignaciones
- Visualización en tiempo real de horarios asignados

### 📅 Gestión Semanal
- **7 días**: Planificación de Lunes a Domingo
- Navegación rápida entre días con tabs
- Selector de fecha para identificar la semana
- Cada día guarda su configuración independiente

### 🏖️ Estados de Personal
- **Francos**: Días libres del personal
- **Licencias**: Ausencias médicas o personales
- **Vacaciones**: Períodos de descanso
- Indicadores visuales en la barra lateral con horarios asignados

### 💾 Persistencia de Datos
- **Guardado automático**: Los datos se guardan en localStorage
- **Backup/Restore**: Exporta e importa configuraciones en formato JSON
- **Exportación PDF**: Genera documentos imprimibles de los horarios
- **Botón Limpiar**: Resetea todos los horarios con confirmación

## 🎨 Diseño

El sistema utiliza una paleta de colores moderna inspirada en tonos cálidos y profesionales:
- **Naranja primario** (#ff8c00): Elementos activos y acentos
- **Verde acento** (#3d5a3f): Elementos especiales y de soporte
- **Gris oscuro** (#2a2a2a): Fondo principal
- **Blanco**: Texto y contraste

Diseño responsive y optimizado para monitores de 19" y superiores.

## 🚀 Instalación

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- No requiere servidor backend
- No requiere instalación de dependencias

### Pasos de Instalación

1. **Clona el repositorio**
```bash
git clone https://github.com/codePitter/lareina_crew.git
cd sistema-gestion-horarios
```

2. **Estructura de archivos**
```
sistema-gestion-horarios/
│
├── index.html          # Archivo principal HTML
├── css/
│   └── style.css       # Estilos del sistema
├── js/
│   └── main.js         # Lógica de la aplicación
└── README.md           # Este archivo
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

### 1️⃣ Asignar Turnos
1. Arrastra un apellido desde la barra lateral
2. Suéltalo en el turno correspondiente (T1, T2, T3)
3. Completa los horarios de entrada y salida
4. El apellido se marcará como "usado" en la barra lateral

### 2️⃣ Horario Cortado
1. Arrastra un apellido ya asignado a otro turno
2. El sistema validará que no haya superposición de horarios
3. Se permite si los horarios no se superponen (ej: 8:00-13:30 y 13:30-21:30)

### 3️⃣ Quitar Asignaciones
- **Doble clic** en un turno asignado para quitarlo
- El apellido volverá a estar disponible en la barra lateral

### 4️⃣ Gestionar Estados
- **Francos**: Arrastra a la zona de francos (en el área principal)
- **Licencias**: Arrastra a la zona de licencias (en sidebar)
- **Vacaciones**: Arrastra a la zona de vacaciones (en sidebar)
- Click en **✕** para quitar del estado

### 5️⃣ Navegación entre Días
- Click en los tabs: **LUN**, **MAR**, **MIÉ**, **JUE**, **VIE**, **SÁB**, **DOM**
- Cada día mantiene su configuración independiente

### 6️⃣ Exportar y Guardar
- **📥 PDF**: Genera un documento PDF del día actual
- **💾 Backup**: Descarga un archivo JSON con todos los horarios
- **📂 Importar**: Restaura un backup previo
- **🗑️ Limpiar**: Borra todos los datos (requiere confirmación)

## 🔧 Validaciones del Sistema

### ✅ Validación de Duplicados
- Una persona NO puede estar en dos turnos simultáneos
- Una persona NO puede tener turno Y estar en Franco/Licencia/Vacaciones
- Se permite horario cortado solo si no hay superposición

### ⏰ Validación de Horarios
- Los horarios se validan automáticamente
- Si hay superposición, el sistema alerta al usuario
- Formato 24 horas estándar

### 💾 Persistencia
- Los datos se guardan automáticamente en cada cambio
- Se recuperan al recargar la página
- Compatible con localStorage del navegador

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Diseño moderno con variables CSS, Flexbox y Grid
- **JavaScript (Vanilla)**: Lógica de la aplicación sin frameworks
- **jsPDF**: Generación de documentos PDF
- **jsPDF-AutoTable**: Creación de tablas en PDF
- **localStorage API**: Persistencia de datos local

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Resoluciones
- ✅ Diseñado para monitores de 19" (1440x900)
- ✅ Compatible con resoluciones superiores
- ⚠️ Responsive limitado en móviles (optimizado para desktop)

## 🎯 Casos de Uso

### 🏪 Comercios Minoristas
- Gestión de cajeros por turno
- Control de personal en diferentes secciones
- Planificación semanal de coberturas

### 🏢 Empresas de Servicio
- Asignación de personal por área
- Control de turnos rotativos
- Gestión de ausencias y francos

### 🏥 Centros de Atención
- Organización de personal de atención
- Control de horarios escalonados
- Gestión de coberturas

## 📊 Características Técnicas

### Estructura de Datos
```javascript
scheduleData = {
  0: { // Día (0=Lun, 6=Dom)
    cajas: {
      1: { // Número de caja
        turno1: { name: '', entrada: '', salida: '' },
        turno2: { name: '', entrada: '', salida: '' },
        turno3: { name: '', entrada: '', salida: '' }
      },
      // ... hasta caja 29
    },
    francos: ['Apellido1', 'Apellido2'],
    licencias: ['Apellido3'],
    vacaciones: ['Apellido4']
  },
  // ... días 1-6
}
```

### Almacenamiento
- **Key**: `scheduleData`
- **Formato**: JSON stringificado
- **Tamaño**: ~50KB para semana completa
- **Ubicación**: localStorage del navegador

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
- 📊 Reportes y estadísticas
- 🔔 Sistema de notificaciones
- 👥 Gestión de múltiples usuarios
- 🔐 Autenticación y permisos

## 🐛 Reporte de Bugs

Si encuentras un bug, por favor abre un [issue](https://github.com/codePitter/lareina_crew/issues) incluyendo:
- Descripción del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots (si aplica)
- Navegador y versión

## 📝 Roadmap

### Versión 1.1 (Próxima)
- [ ] Exportación a Excel
- [ ] Templates de horarios
- [ ] Copia de día a día
- [ ] Notas por turno

### Versión 2.0 (Futuro)
- [ ] Backend con base de datos
- [ ] Múltiples comercios/sucursales
- [ ] Sistema de usuarios y permisos
- [ ] App móvil nativa
- [ ] Notificaciones por email

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Pitter** - *Desarrollo Inicial* - [codePitter](https://github.com/codePitter)

## 🙏 Agradecimientos

- Diseño inspirado en sistemas modernos de gestión
- Comunidad de desarrolladores por feedback
- Usuarios beta testers

## 📧 Contacto

Para preguntas, sugerencias o soporte:
- Email: pitterbck@gmail.com
- GitHub Issues: [Crear Issue](https://github.com/codePitter/lareina_crew/issues)
- LinkedIn: [hpqode](https://linkedin.com/in/hpqode)

---

⭐ Si te resulta útil este proyecto, ¡dale una estrella en GitHub!

**Made with ❤️ for better schedule management**