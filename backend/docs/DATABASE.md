# Persistencia y modelo de datos

PostgreSQL es la única fuente persistente. Prisma define el esquema en [`../prisma/schema.prisma`](../prisma/schema.prisma); la migración inicial se encuentra en [`../prisma/migrations/20261109190000_initial/migration.sql`](../prisma/migrations/20261109190000_initial/migration.sql).

## Relaciones e invariantes

- `Property` requiere `Owner` y `User` agente responsable. Tiene modalidad/estado/tipo enum, importes decimales BOB, medidas decimales, características e imágenes.
- `Favorite` impone unicidad por `(clientId, propertyId)`.
- `Inquiry` y `Visit` relacionan cliente, inmueble, agente y oportunidad. Una oportunidad admite múltiples consultas y visitas.
- `Opportunity` relaciona cliente, propiedad y agente, contiene etapa y fecha de último contacto, y puede originar una operación.
- `FollowUp` conserva responsable, vencimiento, fecha de finalización y estado.
- `Operation` es única por oportunidad y enlaza explícitamente propiedad, cliente y agente.
- `Commission` es única por operación y agente, conserva el porcentaje aplicado y su monto calculado.
- Las claves foráneas históricas usan `RESTRICT`, evitando borrar físicamente registros relacionados. La baja de propiedad es lógica (`isDeleted` y estado `INACTIVA`).
- Índices cubren búsquedas por estado/modalidad/tipo, zona/precio, agente, cliente, fechas y etapas.

## Porcentaje de comisión

No existe una tasa por defecto. Un administrador configura la tasa vigente mediante `POST /commissions/configuration`; una operación no puede registrarse hasta que esté configurada. La operación y comisión se crean en transacción; la comisión conserva una copia del porcentaje usado. El value object [`Money`](../src/domain/value-objects/money.ts) calcula el importe con aritmética entera en centavos y redondeo a dos decimales.

## Entorno, migración y seed

1. Copia `.env.example` como `.env` y configura credenciales PostgreSQL válidas, secreto JWT y credenciales exclusivas de desarrollo para el seed.
2. Crea una base `inmo360` y usuario PostgreSQL de desarrollo con permisos de migración.
3. Desde `backend/`, ejecuta:

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate dev
npx prisma migrate status
npx prisma db seed
```

El seed es idempotente para los registros demo y marca claramente nombres, direcciones, descripción, oportunidad y visita como demostrativos. No se incluyen porcentajes de comisión. El archivo `.env` no se versiona ni debe sobrescribirse después de introducir los secretos locales.
