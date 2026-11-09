# INMO360 Backend

API REST de INMO360 construida con Node.js, NestJS, TypeScript, Prisma y PostgreSQL. El código aplica Arquitectura Hexagonal: controladores HTTP delegan en casos de uso; los casos de uso dependen de puertos; los adaptadores Prisma implementan esos puertos.

Guías específicas: [API](docs/API.md), [base de datos](docs/DATABASE.md) y [pruebas](docs/TESTING.md).

## Requisitos

- Node.js 20 o posterior y npm.
- PostgreSQL 15 o posterior disponible localmente.
- Una base de datos y un usuario de desarrollo con permisos para crear tablas y ejecutar migraciones.

## Preparación en Windows PowerShell

Desde la raíz del monorepo:

```powershell
if (-not (Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
Set-Location backend
npm install
```

Edita `backend/.env` con la URL de PostgreSQL, un secreto JWT aleatorio de al menos 32 caracteres y un origen frontend permitido. El `.env` local está excluido de Git.

Por ejemplo, crea una base vacía y un usuario de desarrollo en PostgreSQL como administrador de PostgreSQL:

```sql
CREATE USER inmo360 WITH PASSWORD 'cambia_este_valor_local';
CREATE DATABASE inmo360 OWNER inmo360;
```

Actualiza `DATABASE_URL` con las credenciales locales correspondientes. No reutilices contraseñas de ejemplo ni subas secretos.

## Migraciones, cliente y seed

Desde `backend/`:

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate dev
npx prisma migrate status
npx prisma db seed
```

La migración inicial se incluye en `prisma/migrations/`. El seed necesita `DEMO_ADMIN_*`, `DEMO_AGENT_*` y `DEMO_CLIENT_*` en `.env`; usa credenciales exclusivas de desarrollo. Inserta personas, propietario, preferencia, propiedad, oportunidad y visita claramente marcados `DEMO`. No configura una comisión: un administrador debe definir explícitamente el porcentaje con `POST /commissions/configuration`.

## Ejecución y verificación

```powershell
npm run start:dev
```

- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/api/docs`
- Build: `npm run build`
- Pruebas unitarias: `npm test`
- Pruebas e2e: `npm run test:e2e`

La API verifica `DATABASE_URL` y `JWT_SECRET` al arrancar. La base PostgreSQL debe estar disponible; no se sustituye por una base simulada. Conserva tu `.env` local; no lo sobrescribas con el archivo de ejemplo después de configurarlo.

## Autenticación

`POST /auth/register` crea solo clientes. `POST /auth/login` devuelve un JWT Bearer. Las rutas protegidas verifican la firma y reconsultan usuario/rol activo en PostgreSQL, para que los permisos no dependan del rol enviado por el cliente ni queden obsoletos al cambiar el rol. `POST /auth/logout` es stateless: el cliente debe descartar el token; este deja de servir al expirar o desactivar la cuenta.

## Módulos y rutas implementados

| Módulo | Rutas principales |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Propiedades | `GET /properties`, `GET /properties/:id`, `GET /properties/managed`, `POST /properties`, `PATCH /properties/:id`, `PATCH /properties/:id/status` |
| Propietarios | `GET /owners`, `GET /owners/:id`, `POST /owners`, `PATCH /owners/:id` |
| Usuarios/agentes | `GET /users`, `GET /users/:id`, `POST /users`, `PATCH /users/:id`, `PATCH /users/:id/status`, `PATCH /users/:id/role` |
| Fotografías | `GET/POST /properties/:propertyId/images`, `PATCH/DELETE /properties/:propertyId/images/:imageId` (asociaciones URL, sin carga binaria) |
| Preferencias/recomendación | `GET /preferences/me`, `PUT /preferences/me`, `GET /recommendations/me` |
| Favoritos | `GET /favorites`, `POST /favorites`, `DELETE /favorites/:id` |
| Consultas | `POST /inquiries`, `GET /inquiries/agent`, `PATCH /inquiries/:id` |
| Visitas | `POST /visits`, `GET /visits`, `GET /visits/agent`, `PATCH /visits/:id` |
| Oportunidades/seguimientos | `GET /opportunities`, `GET /opportunities/prioritized`, `PATCH /opportunities/:id/stage`, `POST /follow-ups`, `PATCH /follow-ups/:id` |
| Operaciones/comisiones | `POST /operations`, `GET /operations`, `GET /commissions`, `POST /commissions/configuration`, `PATCH /commissions/:id` |
| Paneles e informes | `GET /dashboard/admin`, `GET /dashboard/agent`, `GET /reports/summary`, reportes por módulo y CSV en `/reports/:report/export.csv` |

Roles y asignaciones se verifican en el backend. Las propiedades de catálogo solo devuelven registros disponibles y no dados de baja. Favoritos son únicos por cliente y propiedad. Operaciones, comisión, cierre de oportunidad y cambio de disponibilidad de propiedad se guardan en una transacción.

La gestión de usuarios es administrativa; las respuestas no incluyen hashes de contraseñas y no se puede desactivar o degradar al único administrador activo. Los agentes solo pueden editar propietarios asociados a propiedades asignadas y administrar las fotografías de sus propiedades.

## Algoritmos iniciales

### Recomendación

Ponderaciones configuradas en `src/application/use-cases/recommend-properties.use-case.ts`:

| Criterio | Peso |
|---|---:|
| Presupuesto | 25 |
| Zona | 20 |
| Modalidad | 15 |
| Tipo | 10 |
| Dormitorios | 8 |
| Baños | 5 |
| Superficie | 7 |
| Garaje | 4 |
| Características | 6 |
| **Total** | **100** |

La fórmula es `redondear(100 × suma(peso × grado_de_coincidencia) / suma(pesos_aplicables))`. Los criterios sin preferencia configurada se excluyen del denominador; las características usan la proporción de las preferidas encontradas. Si no hay preferencias aplicables, la puntuación es 0. No representa probabilidad ni garantiza una elección correcta.

### Priorización

Configurada en `src/application/use-cases/prioritize-opportunities.use-case.ts`: puntos por etapa (10–30); recencia del contacto (10 puntos desde 3 días, 20 desde 7, 30 desde 14); hasta 15 puntos por consultas, 30 por visitas y 30 por seguimientos pendientes. El total se limita a 100; prioridad alta desde 70, media desde 40 y baja por debajo de 40. Oportunidades concretadas o perdidas se excluyen. Es una regla de atención, no una predicción de cierre.

## Colección de Postman

Importa `postman/INMO360.postman_collection.json`. Define `baseUrl` como `http://localhost:3001`; la colección guarda el token de desarrollo en la variable local `token` tras iniciar sesión.
