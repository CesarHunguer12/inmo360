# Instrucciones permanentes de Copilot para INMO360

Actúa como arquitecto de software y desarrollador full-stack. Trabaja sobre el proyecto universitario Inmo360 con una solución organizada, funcional, mantenible y coherente con estas reglas. No entregues una demostración visual desconectada de la persistencia.

## Contexto del proyecto

Inmo360 es una plataforma web para la gestión y comercialización inmobiliaria en La Paz, Bolivia. Su alcance contempla venta, alquiler, anticrético y administración de propiedades; propietarios, agentes, clientes y usuarios; búsqueda, filtros, preferencias, favoritos y recomendaciones; consultas, visitas, oportunidades, operaciones, comisiones, paneles e informes.

Implementa funcionalidades solo con requisitos definidos. No inventes datos reales, reglas de negocio, porcentajes, criterios ni configuraciones que no hayan sido acordados.

## Separación de aplicaciones y arquitecturas

El repositorio contiene dos aplicaciones independientes, cada una con su configuración y dependencias. Se integran mediante una API REST.

### Frontend

- Tecnologías: React, TypeScript y Tailwind CSS.
- Aplica Clean Architecture con límites claros:
  - `domain`: entidades, tipos de dominio e interfaces/puertos de repositorio.
  - `application`: casos de uso y modelos de entrada/salida.
  - `infrastructure`: cliente HTTP, adaptadores y repositorios que consumen la API.
  - `presentation`: páginas, componentes, layouts, rutas, formularios y vistas.
- Mantén la lógica de negocio fuera de páginas y componentes. No realices consultas improvisadas a la base de datos desde la UI.

### Backend

- Tecnologías: Node.js, NestJS y TypeScript.
- Aplica Arquitectura Hexagonal con límites claros:
  - `domain`: entidades, reglas de negocio y puertos.
  - `application`: casos de uso y servicios de aplicación.
  - `adapters/inbound`: controladores HTTP, autenticación y entrada de solicitudes.
  - `adapters/outbound`: repositorios, persistencia y adaptadores Prisma.
  - `infrastructure`: configuración, seguridad, base de datos y ensamblado de dependencias.
- Los controladores no contienen reglas de negocio; los casos de uso no dependen directamente de Prisma. Los puertos permiten sustituir adaptadores de persistencia sin cambiar las reglas de dominio.

No mezcles las arquitecturas ni concentres el sistema en archivos gigantes. Las dependencias deben dirigirse hacia el dominio y las abstracciones internas.

## Tecnologías y herramientas obligatorias

- Frontend: React + TypeScript + Tailwind CSS.
- Backend: Node.js + NestJS + TypeScript.
- Persistencia: PostgreSQL como única fuente persistente y Prisma ORM.
- Integración: API REST.
- Autenticación: JWT.
- Autorización: control de acceso basado en roles, aplicado y verificado por el backend.
- Documentación y pruebas de API: Swagger y Postman.
- Control de versiones: Git y GitHub.

No sustituyas estas tecnologías ni reemplaces NestJS o PostgreSQL con Firebase, Supabase como backend completo, PHP, Laravel, MongoDB u otra arquitectura. No uses bases de datos ficticias.

## Roles, permisos y acceso

Los roles iniciales son `ADMINISTRADOR`, `AGENTE` y `CLIENTE`. El propietario es una entidad asociada a inmuebles; no presupongas que inicia sesión en esta versión. Los invitados pueden consultar el catálogo público.

- **ADMINISTRADOR:** panel general; gestión de usuarios y roles, agentes, clientes, propietarios y propiedades; consulta global de visitas, oportunidades y operaciones; reportes, comisiones y estadísticas generales.
- **AGENTE:** panel y estadísticas de su cartera; administración de propiedades asignadas; gestión de propietarios y clientes relacionados; consultas, agenda y visitas; oportunidades y su priorización; operaciones y comisiones.
- **CLIENTE:** registro, inicio de sesión y perfil; catálogo y filtros; preferencias, recomendaciones y favoritos; consultas; solicitudes y seguimiento de visitas.
- **INVITADO:** catálogo público y detalle de propiedades disponibles; registro e inicio de sesión como cliente.

Enforce permisos en el backend. Ocultar controles en React no es autorización. Verifica además la propiedad de los registros: un agente no puede modificar inmuebles de otro agente sin autorización. No confíes en roles enviados por el frontend.

## Reglas de negocio

- Modalidades inmobiliarias: `VENTA`, `ALQUILER` y `ANTICRETICO`.
- Estados de propiedad, como mínimo: `DISPONIBLE`, `RESERVADA`, `NO_DISPONIBLE` e `INACTIVA`.
- Las bajas de propiedades son lógicas; no borres físicamente esos registros.
- Etapas de oportunidad: `NUEVA`, `CONTACTADA`, `INTERESADA`, `VISITA_PROGRAMADA`, `VISITADA`, `NEGOCIACION`, `CONCRETADA` y `PERDIDA`.
- Estados de visita: `PENDIENTE`, `CONFIRMADA`, `REPROGRAMADA`, `CANCELADA` y `REALIZADA`.
- El seguimiento conserva fecha, responsable y estado.
- Toda operación se relaciona con propiedad, cliente y agente. Calcula la comisión a partir del monto y del porcentaje configurado, sin inventar porcentajes.

## Algoritmos: recomendación y priorización

Son mecanismos distintos; no mezcles sus puntajes ni sus objetivos.

**Recomendación de propiedades**

- Compara preferencias del cliente con atributos de propiedades disponibles.
- Usa criterios configurables y documentados; el usuario debe acordar los pesos/reglas no especificados.
- Calcula compatibilidad de 0 a 100, ordena de mayor a menor y explica coincidencias y diferencias.
- Excluye propiedades inactivas y no disponibles.
- Descríbelo como algoritmo multicriterio basado en reglas y ponderaciones, no como inteligencia artificial.

**Priorización comercial**

- Se aplica a oportunidades, no a propiedades.
- Considera la etapa, el tiempo desde el último contacto y actividades pendientes.
- Clasifica como prioridad alta, media o baja con reglas documentadas y muestra sus motivos.
- No afirmes que predice la probabilidad real de cerrar una venta.

## PostgreSQL y Prisma

- Diseña un modelo relacional coherente con claves primarias/foráneas, restricciones, índices y relaciones apropiadas. Revisa las relaciones y evita duplicar datos antes de definir el esquema definitivo.
- Contempla al menos las entidades/tablas `User`, `Property`, `PropertyImage`, `Owner`, `ClientPreference`, `Favorite`, `Inquiry`, `Visit`, `Opportunity`, `FollowUp`, `Operation` y `Commission`.
- Entrega `schema.prisma`, migraciones, seed de desarrollo, `.env.example` e instrucciones para crear la base de datos y ejecutar migraciones y seed.
- Los datos demostrativos se insertan en PostgreSQL mediante el seed y deben identificarse como demostrativos. No pongas arrays de propiedades, usuarios ni estadísticas ficticias en páginas React.
- Incorpora datos reales de la inmobiliaria únicamente si fueron proporcionados o autorizados.

## Seguridad

- Hashea contraseñas con bcrypt o equivalente seguro. Firma JWT con secreto leído desde variables de entorno.
- Valida DTO y entradas; aplica guards, autorización por roles y protección de rutas.
- Limita CORS al origen configurado. Usa manejo seguro de errores, Helmet y limitación de solicitudes de autenticación cuando corresponda.
- No expongas contraseñas, tokens ni secretos en respuestas o logs, y no agregues secretos reales al repositorio.
- Usa transacciones cuando una operación modifique varios registros relacionados.
- No afirmes que el sistema es invulnerable ni que está listo para producción sin auditoría y pruebas adecuadas.

## Diseño visual y experiencia

Construye una identidad profesional para Inmo360: azul profundo para navegación y elementos principales; azul eléctrico para acciones y enlaces; fondos gris muy claro; tarjetas blancas; tipografía moderna y jerarquía clara. Mantén iconografía consistente, tablas legibles, formularios validados y responsive para escritorio, tablet y móvil.

Incluye estados de carga, error y ausencia de resultados. La referencia visual es un portal inmobiliario público junto a un panel de trabajo de agente; úsala como inspiración, no la copies literalmente ni limites el sistema a una sola pantalla. No afirmes que una propiedad está verificada si no existe un proceso real que lo respalde.

## Reportes

Construye reportes con consultas reales a PostgreSQL para propiedades por estado/modalidad, consultas recibidas, visitas por período/estado, oportunidades por etapa/prioridad, operaciones, comisiones generadas/pendientes y actividad por agente.

Incluye filtros por período y permisos según rol; permite exportar a CSV los resultados filtrados. Gráficos e indicadores deben representar los mismos datos, no cifras escritas manualmente.

## Calidad de implementación

- No entregues solo pantallas visuales, dejes botones sin acción, sustituyas el backend por datos simulados ni ocultes errores de API.
- No afirmes que una operación se guardó sin confirmación de PostgreSQL.
- Evita funcionalidades duplicadas. Inspecciona los archivos existentes antes de crear, modificar o eliminar; no destruyas código existente.
- Cada módulo debe cubrir, según corresponda, pantalla, lógica de aplicación, endpoint, persistencia, validaciones, autorización, estados de carga/error y pruebas apropiadas.
- Mantén las aplicaciones ejecutables por separado y actualiza la documentación y pruebas relacionadas con cada cambio.

## Documentación del proyecto

Mantén actualizados `README.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md` y `docs/TESTING.md`. Mantén también una colección de Postman o pruebas de endpoints. Identifica las credenciales de demostración claramente como solo para desarrollo y nunca uses secretos reales en documentación o configuración versionada.
