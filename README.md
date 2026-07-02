# Sweatly - Enterprise MERN TypeScript Monorepo

Welcome to the **Sweatly** project. This repository is structured as a production-grade, enterprise-ready Monorepo using **npm Workspaces** and strict **TypeScript**.

---

## 1. Directory Structure & Folder Breakdown

Here is the top-level directory layout:

```
sweatly/
├── .github/                # GitHub-specific workflows (CI/CD Pipelines)
│   └── workflows/
├── client/                 # Frontend React + Vite SPA using TypeScript & Tailwind
├── server/                 # Backend Node + Express REST API using TypeScript & Mongoose
├── shared/                 # Common schemas, validators, and types in TypeScript
├── docs/                   # Developer guides & API specs
├── scripts/                # Operations, deployment, & local setup utilities
├── docker/                 # Containerization blueprints (Dockerfiles)
├── nginx/                  # Reverse proxy configurations
├── .gitignore              # Global git ignore configurations
├── docker-compose.yml      # Local multi-service orchestrator
├── package.json            # Root workspace config (npm workspaces)
└── tsconfig.base.json      # Shared strict TypeScript base config
```

### Detailed Folder Explanations

#### `shared/`

Contains shared modules used by both the frontend (`client`) and backend (`server`), such as Zod schema validators (e.g. `baseUserRegistrationSchema`) and common typings. This ensures data-level sync between frontend forms and backend controllers without code duplication.

#### `client/src/features/`

Organizes frontend client code around features rather than technical roles (components/hooks). Each domain folder (e.g., `auth`, `matching`, `community`) houses its own hooks, services, routing configurations, and view components.

#### `server/src/repositories/`

Implements the Repository pattern. Controllers delegate business rules to Services, which call Repositories to query MongoDB. This insulates business workflows from Mongoose query complexities.

---

## 2. Command Reference

To execute workflows across workspaces, use the following commands from the root directory:

| Task                  | Command                | Target Workspace                   |
| :-------------------- | :--------------------- | :--------------------------------- |
| **Start Development** | `npm run dev`          | Frontend & Backend concurrently    |
| **Client Dev Server** | `npm run client:dev`   | React frontend only (Port 3000)    |
| **Server Dev Server** | `npm run server:dev`   | Express backend only (Port 5000)   |
| **Compile Shared**    | `npm run shared:build` | Build shared TS schemas to `dist/` |
| **Lint Check**        | `npm run lint`         | Eslint checks across all folders   |
| **Type Verification** | `npm run type-check`   | TypeScript validations             |
| **Production Build**  | `npm run build`        | Compile workspaces for deployment  |

---

## 3. Getting Started

For detailed setup instructions, please consult the [Project Setup Guide](file:///C:/Users/ADMIN/sweat/docs/setup_guide.md) and [Development Guide](file:///C:/Users/ADMIN/sweat/docs/development_guide.md).
