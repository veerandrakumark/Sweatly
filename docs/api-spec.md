# Sweatly - API Specification Guidelines

This document establishes standard conventions for API designs, routes, and error structures.

## API Endpoint Routing Layout

All API routes must be versioned and structured as follows:

```
GET/POST/PUT/DELETE   /api/v1/<resource>
```

### Resource Routing Conventions

- **Authentication:** `/api/v1/auth` (login, register, token refresh)
- **Users:** `/api/v1/users` (profile settings)
- **Workouts:** `/api/v1/workouts` (workout planning, logging)
- **Exercises:** `/api/v1/exercises` (lookup library)

---

## Response Formats

All successful API responses should conform to a standard envelope structure:

```json
{
  "success": true,
  "data": {
    "id": "unique-uuid-or-oid",
    "name": "example"
  }
}
```

Error responses should follow the centralized error template:

```json
{
  "success": false,
  "message": "Descriptive error message here",
  "errors": []
}
```
