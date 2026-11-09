# INMO360

INMO360 es un proyecto universitario organizado como monorepo con dos aplicaciones independientes:

- `frontend/`: aplicación web con React, TypeScript y Tailwind CSS, organizada con Clean Architecture.
- `backend/`: API REST con Node.js, NestJS y TypeScript, organizada con Arquitectura Hexagonal.

PostgreSQL será la base de datos y Prisma ORM la herramienta de persistencia.

## Estructura

```text
INMO360/
├── .github/
│   └── copilot-instructions.md
├── backend/
├── docs/
│   ├── ARCHITECTURE.md
│   └── IMPLEMENTATION_PLAN.md
├── frontend/
├── .gitignore
└── README.md
```

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para conocer los límites arquitectónicos y [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) para el orden previsto de implementación.

> Esta es únicamente la estructura inicial. Las funcionalidades se implementarán de forma incremental y no se han añadido todavía aplicaciones ejecutables ni esquemas de base de datos.
