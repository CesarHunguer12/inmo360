# API REST de INMO360

Base local: `http://localhost:3001`. Swagger/OpenAPI interactivo: `/api/docs`; el documento JSON se publica en `/api/docs-json`. La aplicación debe tener PostgreSQL configurado para arrancar.

Las rutas protegidas requieren `Authorization: Bearer <JWT>`. El backend verifica el token y vuelve a consultar el usuario activo y su rol desde PostgreSQL. Los permisos no dependen de valores enviados por el cliente.

## Rutas

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/register` | Público; solo crea clientes |
| POST | `/auth/login` | Público; límite de solicitudes |
| GET | `/auth/me` | Autenticado |
| POST | `/auth/logout` | Autenticado; logout stateless, descartar el token en el cliente |
| GET | `/properties` | Público; solo propiedades disponibles y no dadas de baja; filtros `modality`, `type`, `zone` |
| GET | `/properties/:id` | Público; detalle disponible |
| GET | `/properties/managed` | Administrador/agente; el agente ve sus asignadas |
| POST | `/properties` | Administrador/agente |
| PATCH | `/properties/:id` | Administrador/agente; agente solo su propiedad |
| PATCH | `/properties/:id/status` | Administrador/agente; agente solo su propiedad |
| GET, POST | `/owners` | Administrador/agente; lista de agentes limitada a propietarios asociados |
| GET | `/clients`, `/clients/:id` | Administrador/agente; agentes solo clientes con relación en su cartera |
| PATCH | `/users/:id/role` | Administrador |
| GET | `/users`, `/users/:id` | Administrador; nunca devuelve `passwordHash` |
| POST | `/users` | Administrador; crea cuentas de agente/cliente/administrador, guarda contraseña con bcrypt y rechaza correo duplicado |
| PATCH | `/users/:id` | Administrador; edita correo, nombre, teléfono o rol; protege al único administrador activo |
| PATCH | `/users/:id/status` | Administrador; activa/desactiva; no permite desactivar al único administrador activo |
| GET | `/owners/:id` | Administrador/agente; detalle con propiedades relacionadas; agente ve solo sus propiedades |
| PATCH | `/owners/:id` | Administrador/agente; agente solo puede modificar propietarios vinculados a sus propiedades |
| GET, POST | `/properties/:propertyId/images` | Administrador/agente asignado; consulta y agrega asociaciones URL de imágenes |
| PATCH, DELETE | `/properties/:propertyId/images/:imageId` | Administrador/agente asignado; edita o elimina la asociación, no borra el archivo remoto |
| GET, PUT | `/preferences/me` | Cliente autenticado |
| GET | `/recommendations/me` | Cliente autenticado |
| GET, POST, DELETE | `/favorites`, `/favorites/:id` | Cliente autenticado |
| POST | `/inquiries` | Cliente; crea/relaciona oportunidad |
| GET | `/inquiries/agent` | Administrador/agente; agentes solo consultas asignadas |
| PATCH | `/inquiries/:id` | Administrador/agente; agentes solo consultas asignadas |
| POST, GET | `/visits` | Cliente crea; administrador/agente/cliente consultan su alcance |
| GET | `/visits/agent` | Administrador/agente |
| PATCH | `/visits/:id` | Administrador/agente; agentes solo visitas asignadas |
| GET | `/opportunities` | Administrador/agente/cliente, con alcance por identidad |
| GET | `/opportunities/prioritized` | Administrador/agente |
| PATCH | `/opportunities/:id/stage` | Administrador/agente; agente solo asignadas |
| POST, PATCH | `/follow-ups`, `/follow-ups/:id` | Administrador/agente; agente solo sus asignaciones |
| POST, GET | `/operations` | Administrador/agente; agente solo su cartera |
| GET | `/commissions` | Administrador/agente; agente solo sus comisiones |
| POST | `/commissions/configuration` | Administrador; configura el porcentaje de comisión |
| PATCH | `/commissions/:id` | Administrador/agente; agente solo sus comisiones |
| GET | `/dashboard/admin` | Administrador |
| GET | `/dashboard/agent` | Agente |
| GET | `/reports/summary` | Administrador/agente; filtros opcionales `from`, `to` |
| GET | `/reports/export.csv` | Administrador/agente; exporta operaciones del mismo alcance y período |
| GET | `/reports/properties`, `/reports/inquiries`, `/reports/visits`, `/reports/opportunities`, `/reports/operations`, `/reports/commissions`, `/reports/agents` | Administrador/agente; filtros opcionales `from`, `to`; el agente ve solamente su cartera |
| GET | `/reports/:report/export.csv` | Administrador/agente; CSV para `properties`, `inquiries`, `visits`, `opportunities`, `operations`, `commissions` o `agents`; respeta fechas y cartera |

Las imágenes continúan almacenándose como URL HTTP/HTTPS; no se reciben archivos ni se guardan binarios. La baja de una fotografía elimina únicamente su asociación en PostgreSQL.

DTO con `class-validator`, transformación de parámetros y rechazo de campos no permitidos se aplican globalmente. Swagger documenta los DTO y la autenticación Bearer. La colección de solicitudes se encuentra en [`../postman/INMO360.postman_collection.json`](../postman/INMO360.postman_collection.json).
