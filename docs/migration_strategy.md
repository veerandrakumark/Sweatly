# Database Migration & Schema Evolution Strategy - Sweatly

This document defines standard operating guidelines for managing MongoDB database schema changes, migrations, and backward compatibility in production environments.

---

## 1. Schema Versioning Design (Expand and Contract Pattern)

To achieve zero-downtime deployments, Sweatly enforces the **Expand and Contract** pattern for database schema evolutions. 

```
Phase 1: Expand ──> Application reads old fields, writes to BOTH old and new fields
Phase 2: Migrate ──> Run background migration job to copy old records to new schema
Phase 3: Contract ──> Application reads/writes new fields; old fields are removed
```

### Best Practices:
*   **Never Rename Fields Directly:** Renaming a field breaks active servers running older versions of the codebase during deployment. Instead, add the new field alongside the old field.
*   **Dual Writes:** During transitions, the application server updates both old and new fields to maintain sync.

---

## 2. Backward Compatibility Protocols

*   **Avoid Strict Schema Checks:** In Mongoose, keep unknown fields configurations open (`strict: false` or default configuration) so that newer servers writing new fields do not crash older servers parsing the same documents.
*   **Default Values:** Ensure all new schema fields are either optional or have sensible default values declared.

---

## 3. Migration Tooling

*   **migrate-mongo:** Sweatly uses `migrate-mongo` to track schema changes. Migration scripts are stored in the repository and executed during deployment pipelines.
*   **Idempotency:** Migration scripts must be written to be idempotent (safe to run multiple times without causing duplicate modifications or corruptions).
*   **Batched Operations:** Updates to millions of records must be processed in batches (e.g. using `bulkWrite` in chunks of 1000) to avoid locking the database or exhausting memory.
