# Development Guide - Sweatly

This document defines standard practices and patterns to maintain codebase quality as features are developed.

---

## 1. Branching & Commit Conventions

### Git Branch Naming
Align branch names with feature tags:
*   `feature/user-auth` - Building new features
*   `bugfix/location-blur` - Resolving issues
*   `hotfix/auth-expiry` - Immediate production fixes
*   `chore/update-deps` - Tooling or dependency management tasks

### Commit Messages (Conventional Commits)
All commit messages must match the standard template:
```
<type>(<scope>): <short description>
```
Examples:
*   `feat(client): implement registration page UI`
*   `fix(server): resolve geo query out-of-bounds error`
*   `chore(shared): add user-profile validation schemas`

---

## 2. Pre-Commit Hooks & Linting
Our setup uses Husky and lint-staged to run checks automatically on every `git commit`:
1. Runs ESLint with formatting fixes on modified `.ts` and `.tsx` files.
2. Formats all changed JSON, MD, and CSS files with Prettier.
If any check fails, the commit is blocked. Correct the issues before re-committing.

---

## 3. Designing Features using Clean Architecture

When implementing a new feature module, map files to our layered architecture:

```
[UI / Page]
    └── Triggers React Query mutations
[Service Controller]
    └── Validates payload using Zod schemas
[Business Service]
    └── Executes domain operations & validations
[Repository Class]
    └── Performs database queries
```

*   **Step 1:** Define the validation schema inside `shared/src/validation/` if it's used by both frontend and backend.
*   **Step 2:** Write repository queries inside `server/src/repositories/` to query the database.
*   **Step 3:** Implement business workflows inside `server/src/services/`.
*   **Step 4:** Hook controllers and router interfaces under `server/src/controllers/` and `server/src/routes/`.
*   **Step 5:** Consume endpoints on the client side using services inside `client/src/features/`.
