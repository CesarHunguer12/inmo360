# Plan de implementación de INMO360

Este plan establece un orden incremental para construir las dos aplicaciones independientes, mantener sus arquitecturas y entregar flujos respaldados por PostgreSQL. No implica que las funcionalidades ya estén implementadas. No se debe avanzar con requisitos, porcentajes, ponderaciones o datos reales que no hayan sido acordados.

## Etapas, dependencias y comprobaciones

| Orden | Etapa | Depende de | Comprobación para completar |
|---|---|---|---|
| 1 | Confirmar alcance, reglas y criterios de aceptación | Ninguna | Roles, permisos, flujos, campos, reglas de modalidad/estado, reportes y datos autorizados quedan documentados; no quedan decisiones de negocio inventadas. |
| 2 | Inicializar frontend y backend por separado | Etapa 1 | Frontend usa React, TypeScript y Tailwind; backend usa Node.js, NestJS y TypeScript. Cada aplicación instala, arranca y compila por separado. |
| 3 | Establecer arquitectura, configuración y calidad base | Etapa 2 | Capas Clean Architecture y Hexagonal identificables; reglas de negocio no dependen de frameworks; configuración por entorno, validación, formato/lint y pruebas iniciales operativos. |
| 4 | Definir modelo de dominio y contratos REST | Etapas 1 y 3 | Entidades, casos de uso, autorización, solicitudes/respuestas/errores y endpoints documentados; Swagger expone los contratos; `docs/API.md` y pruebas/colección Postman se mantienen coherentes. |
| 5 | Diseñar y configurar PostgreSQL/Prisma | Etapas 1 y 3 | Relaciones revisadas; `schema.prisma` contempla las entidades requeridas; `.env.example` no contiene secretos; `prisma validate` y generación pasan; migraciones se aplican y estado se verifica en PostgreSQL. |
| 6 | Implementar autenticación y autorización | Etapas 4 y 5 | Hash de contraseña y JWT configurados desde entorno; guards, roles y propiedad de registros comprobados por pruebas; rutas públicas y protegidas se comportan según los requisitos. |
| 7 | Implementar módulos de propiedades, usuarios y catálogo | Etapas 4, 5 y 6 | Operaciones REST y persistencia real; transiciones y baja lógica validadas; búsqueda pública solo incluye propiedades disponibles; permisos de cada rol cubiertos. |
| 8 | Implementar clientes, preferencias, favoritos, consultas y visitas | Etapas 4 a 7 | Validaciones, relaciones, estados y autorización probados; los registros se leen/escriben en PostgreSQL; UI muestra carga, error y vacío. |
| 9 | Implementar oportunidades, seguimiento, operaciones y comisiones | Etapas 4 a 8 | Etapas comerciales y seguimiento coherentes; operación ligada a propiedad/cliente/agente; comisión usa porcentaje configurado; transacciones y permisos probados. |
| 10 | Implementar recomendación y priorización separadas | Etapas 1, 7 y 8 para recomendaciones; etapas 1 y 9 para priorización | Compatibilidad entre 0 y 100 con criterios explicables y propiedades elegibles; prioridad alta/media/baja solo para oportunidades, con reglas y motivos; pruebas de límites y orden. |
| 11 | Completar reportes, experiencia frontend e integración | Etapas 6 a 10 | Reportes consultan PostgreSQL, filtros y permisos se aplican también en servidor, CSV refleja el filtro; gráficos coinciden con indicadores; UI responsive y sin acciones inertes. |
| 12 | Preparar documentación, seed y verificación de entrega | Etapas 1 a 11 | Seed de desarrollo inserta únicamente datos demostrativos en PostgreSQL; README y documentos de arquitectura, base de datos, API y pruebas están actualizados; suite relevante y compilaciones pasan. |

## Comandos de referencia

Los comandos exactos deben corresponder a los scripts declarados por cada aplicación cuando se inicialicen; no ejecutar comandos de fases aún no implementadas.

### Frontend

Desde `frontend/`:

```powershell
npm install
npm run dev
npm run build
npm test
```

### Backend

Desde `backend/`:

```powershell
npm install
npm run start:dev
npm run build
npm test
```

Los scripts `dev`, `build`, `test` y `start:dev` deben definirse/documentarse en sus aplicaciones según sus herramientas. No ejecutes comandos que no estén disponibles; actualiza este plan si la configuración acordada usa nombres distintos.

### PostgreSQL y Prisma

Con PostgreSQL instalado y en ejecución, crea una base de datos de desarrollo (por ejemplo, con `CREATE DATABASE inmo360;` en `psql`) y configura la URL correspondiente en un `.env` local ignorado por Git. Nunca pongas credenciales reales en el repositorio.

Desde `backend/`, después de definir Prisma:

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate dev --name init
npx prisma migrate status
npx prisma db seed
```

La migración inicial debe ejecutarse únicamente contra la base de datos de desarrollo configurada. El seed solo inserta datos demostrativos en PostgreSQL; no sustituye la persistencia por datos hardcodeados en React.

### API y validación integrada

- Ejecuta las pruebas backend con `npm test` y pruebas de extremo a extremo con el script definido en `backend/package.json`.
- Valida los endpoints documentados en Swagger y la colección de Postman. Si se configura Newman, el comando de referencia es `npx newman run <coleccion.postman_collection.json> -e <entorno.postman_environment.json>`; no guardes tokens o contraseñas reales en la colección.
- Ejecuta el build de frontend y las pruebas frontend con sus scripts declarados.

## Reglas para avanzar

- Respeta las dependencias de la tabla y verifica cada criterio antes de continuar.
- Mantén frontend y backend ejecutables/configurables de manera independiente.
- Prueba reglas de dominio sin infraestructura; prueba adaptadores y flujos REST en sus límites; comprueba integración con PostgreSQL real de desarrollo.
- Ninguna prueba de persistencia debe depender de una base de datos ficticia.
- Mantén `README.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md`, `docs/TESTING.md` y la colección de Postman sincronizados con lo implementado.
- Los datos reales solo se incorporan cuando sean proporcionados o autorizados; los datos de seed se identifican como demostrativos.
