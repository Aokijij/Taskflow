# TaskFlow

TaskFlow es una aplicación de gestión de tareas construida con React y Supabase.  
Está pensada para organizar trabajo personal y colaborativo en una interfaz moderna, visual y clara.

## Vista general

TaskFlow permite:

- Gestionar tareas personales y grupales.
- Organizar tareas por estado, prioridad y categoría.
- Trabajar con grupos compartidos e invitaciones.
- Visualizar fechas en calendario.
- Sincronizar tareas con Google Calendar.
- Consultar estadísticas y workflow visual.
- Recibir alertas del navegador para tareas próximas o atrasadas.

## Funcionalidades principales

### Tareas personales

- Crear, editar y eliminar tareas.
- Asignar prioridad, fecha y categoría.
- Ver tareas activas y completadas recientes.

### Tareas grupales

- Crear grupos con color propio.
- Invitar personas por correo.
- Solicitar acceso por código.
- Aprobar o rechazar entradas al grupo.
- Asignar tareas a miembros del grupo.

### Categorías persistentes

- Las categorías se mantienen incluso si se quedan sin tareas.
- Las categorías inactivas pueden reutilizarse al crear nuevas tareas.
- Una categoría sin tareas relacionadas puede eliminarse.

### Workflow

- Vista enfocada en tareas pendientes, completadas y atrasadas.
- Tarjetas visuales con distinta urgencia según el estado.

### Calendario

- Visualización mensual, semanal y diaria.
- Filtros por estado, categoría y prioridad.
- Conexión con Google Calendar.

### Perfil

- Edición de datos personales.
- Cambio de contraseña.
- Configuración de alertas del navegador.

### Onboarding y ayuda contextual

- Onboarding inicial para nuevas personas usuarias.
- Ayuda integrada en cada vista para explicar su función.

## Stack del proyecto

- React
- React Router
- React Bootstrap
- React Toastify
- Recharts
- FullCalendar
- Supabase

## Estructura general

```bash
src/
  components/
  contexts/
  application/
  infrastructure/
  pages/
  services/
  utils/
  css/

supabase/
  functions/
  schema.sql
```

## Variables de entorno

Crea un archivo `.env` en la raíz con:

```env
REACT_APP_SUPABASE_URL=tu_supabase_url
REACT_APP_SUPABASE_ANON_KEY=tu_supabase_anon_key
REACT_APP_GOOGLE_CLIENT_ID=tu_google_client_id
```

## Instalación

```bash
npm install
```

## Desarrollo local

```bash
npm start
```

La app corre en:

[http://localhost:3000](http://localhost:3000)

## Build de producción

```bash
npm run build
```

## Tests

```bash
npm test -- --watchAll=false
```

## Configuración de Supabase

Para que la app funcione completa necesitas:

- Crear el proyecto en Supabase.
- Aplicar el archivo `supabase/schema.sql`.
- Configurar autenticación con email/password.
- Configurar Google OAuth si vas a usar Google Calendar o login con Google.
- Desplegar las Edge Functions si vas a usar sincronización y recordatorios.

## Sincronización con Google Calendar

La integración usa:

- OAuth con Google
- Edge Functions de Supabase
- Estado de conexión por usuario

Funciones relacionadas:

- `google-calendar-exchange`
- `google-calendar-sync`
- `send-task-reminders`

## Estado actual del producto

TaskFlow ya incluye:

- Dashboard principal
- Workflow
- Calendario
- Estadísticas
- Perfil
- Grupos
- Categorías
- Portada pública
- Onboarding inicial

## Próximas ideas

- Planes premium reales
- Más automatizaciones
- Mejoras de notificaciones por correo
- Más controles para grupos y permisos

## Autor

Proyecto realizado por **Jose Blanquicett**.

GitHub:

[https://github.com/Aokijij](https://github.com/Aokijij)
