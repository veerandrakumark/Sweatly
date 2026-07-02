# Sweatly Authentication & Authorization Guide

This document describes the design, implementation, and routing configurations for the Authentication & Authorization module in Sweatly.

---

## 1. Sequence Diagram: Login and Token Rotation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Server as Express Server
    participant DB as MongoDB
    
    Note over Client,Server: Login Request
    Client->>Server: POST /auth/login (email, password)
    Server->>DB: Query user by email
    DB-->>Server: Return User Hash & Role
    Server->>Server: Compare BCrypt hashes & Validate limits
    Server->>DB: Store hashed Refresh Token
    Server-->>Client: 200 OK (Access Token in Body, Refresh Token in HttpOnly cookie)

    Note over Client,Server: Access Token Rotation Request
    Client->>Server: POST /auth/refresh-token (Request automatically embeds cookie)
    Server->>Server: Verify Refresh Token signature
    Server->>DB: Find whitelisted Refresh Token hash
    alt Reused / Missing Token
        Server->>DB: Revoke all user tokens (Reuse attack detected!)
        Server-->>Client: 401 Unauthorized
    else Valid Token
        Server->>DB: Delete used Refresh Token
        Server->>DB: Create new Refresh Token whitelist record
        Server-->>Client: 200 OK (New Access Token in Body, New Refresh cookie)
    end
```

---

## 2. API Endpoints Map

All endpoints are versioned under `/api/v1/auth`:

| Verb | Endpoint | Authentication | Rate-Limited | Description |
|---|---|---|---|---|
| `POST` | `/register` | Public | Yes (10/15m) | Registers new profile, hashes pass, sends verify mail |
| `POST` | `/login` | Public | Yes (10/15m) | Verifies credentials, starts session, sets HttpOnly cookie |
| `POST` | `/logout` | Public | No | Revokes whitelist db record, clears cookie |
| `POST` | `/refresh-token` | Public | No | Rotates session tokens under strict reuse detection |
| `GET` | `/me` | Protected | No | Returns active session athlete context |
| `PATCH` | `/change-password`| Protected | No | Updates password |
| `POST` | `/forgot-password`| Public | Yes (10/15m) | Sends password reset email link |
| `POST` | `/reset-password` | Public | Yes (10/15m) | Validates reset token and sets new password |
| `POST` | `/verify-email` | Public | No | Sets user `isEmailVerified: true` |
| `POST` | `/resend-verification` | Public | Yes (10/15m) | Resends email verification link |
