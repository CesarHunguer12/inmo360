# Pruebas y verificaciones

Desde `backend/`:

```powershell
npm run build
npm test
npm run test:e2e
npm run lint
npx prisma validate
npx prisma generate
```

- Unitarias: hashing/registro y autenticación por puertos, hash de dinero/comisión, guard de roles, rol vigente consultado desde repositorio, compatibilidad de propiedades y prioridad comercial.
- E2E HTTP: registro, validación de login, ruta de usuario actual y documento OpenAPI.
- La prueba de Swagger sustituye el proveedor Prisma para verificar rutas/documentación sin persistencia; no es una prueba de integración PostgreSQL.
- Pruebas de migración, seed y flujos REST conectados a PostgreSQL requieren `.env` con una base local real disponible.
- La exportación CSV debe verificarse con filtros/rol de administrador y con aislamiento de datos para agente cuando se prepare un entorno de integración.
- Hay pruebas de casos de uso para administración de usuarios/reportes y pruebas HTTP para permisos/DTO de usuarios y rutas Swagger.
- `test/postgres.integration.e2e-spec.ts` ejecuta CRUD de usuarios y propietarios, fotografías, aislamiento de agente y consultas/CSV de reportes directamente contra PostgreSQL. Está desactivada si no se define `TEST_DATABASE_URL` y rechaza cualquier base cuyo nombre no termine en `_test`. Solo limpia los registros que crea la propia prueba.

### Ejecutar integración PostgreSQL de forma segura (Windows PowerShell)

Use una base PostgreSQL exclusiva de pruebas, distinta de `inmo360_db`. Primero cree `inmo360_test` mediante las herramientas habituales de PostgreSQL, configure `TEST_DATABASE_URL` localmente (no en el repositorio) y aplique únicamente las migraciones versionadas a esa base:

```powershell
$env:TEST_DATABASE_URL = "<URL local de la base inmo360_test>"
$env:DATABASE_URL = $env:TEST_DATABASE_URL
npx prisma migrate deploy
npm run test:e2e
Remove-Item Env:\TEST_DATABASE_URL
Remove-Item Env:\DATABASE_URL
```

No ejecute este flujo apuntando a `inmo360_db` ni a una base con datos de uso normal. La suite no crea ni elimina bases, esquemas o tablas.

En la configuración local usada durante la preparación del backend también se consultó PostgreSQL mediante Prisma para verificar los registros demo y relaciones, y se hicieron solicitudes HTTP al servidor NestJS real para Swagger, catálogo, login de cliente, `/auth/me`, recomendaciones, dashboards por rol, propiedades del agente, preferencias, denegación de acceso al dashboard de agente para clientes y exportación CSV.

La verificación local de Prisma puede validar/generar cliente sin conectarse a una base, pero aplicar migraciones o ejecutar seed requiere credenciales PostgreSQL válidas.
