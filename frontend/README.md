# INMO360 Frontend

Aplicación React + TypeScript + Vite + Tailwind CSS. La UI se comunica únicamente con la API REST NestJS; no accede a PostgreSQL.

## Requisitos y comandos

Requiere Node.js 20 o posterior. Desde `frontend/`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

La aplicación local se sirve en `http://localhost:5173`. `VITE_API_URL` apunta por defecto a `http://localhost:3001`; si se configura otra dirección, modifica únicamente el `.env` local. El backend debe tener habilitado CORS para `http://localhost:5173`. No guardes secretos ni tokens en el repositorio.

```powershell
npm run build
npm test
npm run preview
```

## Capas

- `src/domain`: entidades y puertos de repositorio sin dependencia de React o Axios.
- `src/application`: casos de uso de autenticación y propiedades.
- `src/infrastructure`: cliente HTTP Axios e implementaciones REST de repositorios.
- `src/presentation`: páginas, componentes, layouts, rutas y proveedores de sesión.

## Rutas principales

- `/`: portada pública con propiedades destacadas de `GET /properties`.
- `/properties`: catálogo y filtros respaldados por el catálogo REST.
- `/properties/:id`: detalle de disponibilidad, imágenes, características, favoritos, consultas y solicitudes de visitas.
- `/login`, `/register`: autenticación de cliente mediante `/auth/login` y `/auth/register`.
- `/admin`, `/agent`, `/client`: entradas protegidas por rol al panel correspondiente; el permiso real sigue validándose en NestJS.
- `/app`: panel correspondiente al usuario autenticado y su rol.
- `/app/properties`: lectura/alta/edición usando `/properties/managed`, `POST /properties`, `PATCH /properties/:id`.
- `/app/users`: cuentas y roles administrativas usando `/users`, `POST /users`, `PATCH /users/:id/role` y `PATCH /users/:id/status`.
- `/app/owners`, `/app/clients`: registros reales de propietarios/clientes; el alta de propietarios guarda cambios vía `POST /owners`.
- `/app/recommendations`, `/app/preferences`, `/app/favorites`: funciones de cliente respaldadas por la API.
- `/app/reports`: reportes por módulo y exportación CSV.

El registro público envía únicamente `fullName`, `email`, `password` y `phone` opcional a `POST /auth/register`; no permite escoger rol. NestJS crea la cuenta como `CLIENTE`. La contraseña debe medir entre 12 y 72 bytes UTF-8, igual que el DTO del backend; el formulario también verifica la confirmación.

Los roles que recibe el frontend solo organizan la navegación. Cada endpoint y relación de propiedad se vuelve a autorizar en NestJS. El JWT permanece localmente y la identidad se verifica con `GET /auth/me` al recargar la aplicación; una respuesta 401 invalida la sesión local. Si el backend no responde, se conserva el token para no confundir un problema de red con una sesión inválida y se muestra el error en la pantalla de acceso.

El backend actual no expone una lectura de historial de consultas para un cliente ni un endpoint de edición de propietarios/fotografías desde la pantalla correspondiente; la interfaz no simula esos flujos. Las fotografías se administran por URL, no se cargan archivos. Las vistas de actividad usan únicamente endpoints documentados.
