# Arquitectura de INMO360

INMO360 es un monorepo que contiene dos aplicaciones independientes. Cada una conserva sus propias dependencias, configuración y límites arquitectónicos. La integración entre ellas se realiza exclusivamente mediante una API REST.

## Frontend: Clean Architecture

El frontend utilizará React, TypeScript y Tailwind CSS. La organización por capas debe mantener las reglas de negocio aisladas de React, de las llamadas HTTP y de los detalles visuales:

- **Dominio:** entidades, objetos de valor y reglas de negocio independientes del framework.
- **Aplicación:** casos de uso y puertos que describen las operaciones que necesita la interfaz.
- **Infraestructura:** adaptadores que implementan los puertos, por ejemplo, clientes HTTP y mapeadores de datos de la API.
- **Presentación:** componentes, páginas y estado de interfaz de React, con Tailwind CSS para los estilos.

Las dependencias deben apuntar hacia el dominio y las abstracciones internas. La presentación no debe implementar reglas de negocio ni depender directamente de detalles de persistencia del backend.

## Backend: Arquitectura Hexagonal

El backend utilizará Node.js, NestJS y TypeScript. PostgreSQL será la base de datos y Prisma ORM se empleará como herramienta de persistencia:

- **Dominio:** modelo y reglas de negocio puros, sin dependencia de NestJS, Prisma ni PostgreSQL.
- **Aplicación:** casos de uso y puertos de entrada/salida que expresan las operaciones del sistema.
- **Adaptadores de entrada:** controladores REST de NestJS que validan y traducen solicitudes HTTP y delegan en casos de uso.
- **Adaptadores de salida:** implementaciones de puertos, como repositorios Prisma y otros servicios externos.
- **Infraestructura:** configuración y composición de adaptadores, Prisma y conexiones necesarias para ejecutar la aplicación.

Los controladores no deben contener lógica de negocio. Los casos de uso dependen de puertos, no de implementaciones concretas; los adaptadores conectan esos puertos con HTTP, Prisma y PostgreSQL.

## Integración y datos

El frontend consume contratos REST expuestos por el backend. El backend valida las solicitudes, ejecuta los casos de uso y utiliza adaptadores de persistencia para acceder a PostgreSQL mediante Prisma. No se debe compartir acceso directo a la base de datos entre aplicaciones ni introducir bases de datos ficticias.

## Estructura inicial

`frontend/` y `backend/` son directorios reservados para las aplicaciones independientes. En esta fase solo se establece la estructura y documentación; las carpetas de capas, los módulos funcionales, los contratos API y el esquema Prisma se definirán conforme se implementen requisitos concretos.
