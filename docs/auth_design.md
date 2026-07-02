# Authentication & Authorization Design Specifications - Sweatly
**Project Name:** Sweatly  
**Author:** Senior Staff Software Engineer  
**Status:** Pending Approval  

This document describes the security protocols, authentication processes, token lifecycles, and authorization structures implemented in Sweatly.

---

## 1. Authentication Flows

### 1.1 Registration Flow
1.  **Client Input:** The user submits registration parameters (name, email, password, location coordinates, sports preferences).
2.  **Validation:** The server validates inputs against the Zod schema. It checks password complexity (min 8 chars, containing uppercase, lowercase, numbers, and symbols).
3.  **Existence Check:** Queries the database to verify if the email is already registered. If yes, it returns a generic "Email already in use" message to prevent account harvesting.
4.  **Password Hashing:** Hashes the password using **Bcrypt** with a work factor of 12 salts.
5.  **Verification Token Generation:** Generates a cryptographically secure random token (using Node's `crypto.randomBytes(32).toString('hex')`) with a 24-hour expiration.
6.  **Database Storage:** Saves the user document with `isEmailVerified: false` and the verification token hashes.
7.  **Dispatch Verification Email:** Sends an email link containing the verification token.
*   *Why this approach:* Hiding duplicate accounts protects user privacy. Hashing passwords securely ensures database breaches do not compromise raw credentials.

### 1.2 Login Flow
1.  **Credentials Submission:** User posts email and password.
2.  **Validation:** Zod schema validation runs.
3.  **Query & Verification:** Retrieves the user document. If not found, it returns a generic "Invalid email or password" error. If found, it compares the Bcrypt hash.
4.  **Lockout Check (Brute-Force protection):** Tracks failed login attempts. If failed attempts exceed 5 within 15 minutes, it locks the account for 30 minutes.
5.  **Token Generation:** Generates a short-lived **Access Token** (JWT, 15 minutes) and a long-lived **Refresh Token** (JWT, 7 days).
6.  **Refresh Token White-Listing:** Hashes the Refresh Token and stores it in the `RefreshTokens` collection associated with the User ID.
7.  **Deliver Tokens:** Returns the Access Token in the response body, and sets the Refresh Token inside an HTTP-only, secure, SameSite cookie.
*   *Why this approach:* Restricting access to login attempts prevents brute-force dictionary attacks. Storing refresh tokens in HTTP-only cookies protects them from XSS extraction.

### 1.3 Logout Flow
1.  **Client Triggers Logout:** Client dispatches a POST to `/api/v1/auth/logout`.
2.  **Token Extraction:** Server extracts the Refresh Token from the HTTP request cookie.
3.  **Revocation:** Server hashes the token, deletes the matching record in the `RefreshTokens` collection (revoking the session), and clears the client cookie.
*   *Why this approach:* Ensures that active sessions are completely cleared on the server side, preventing session replay attacks if tokens are leaked.

### 1.4 Access Token Lifecycle
*   **Duration:** 15 minutes.
*   **Verification:** Stateless. The server verifies the signature of the incoming JWT using the secret key without querying the database, which reduces latency.
*   **Payload:** Contains User ID, role, and email.

### 1.5 Refresh Token Rotation & Revocation
*   **Rotation Protocol:** Each time a client requests a new Access Token using a Refresh Token, the server issues a new Refresh Token alongside the Access Token (Refresh Token Rotation).
*   **Reuse Detection:** If an old, already-rotated Refresh Token is submitted, the server suspects a token theft attempt. It automatically invalidates all refresh tokens associated with that user, forcing a complete log out.
*   **Revocation Mechanism:** Refresh tokens are hashed and stored in the database. Deleting the database record invalidates the token, even if its expiration date has not passed.
*   *Why this approach:* Protects against token theft by ensuring that leaked refresh tokens can only be used once before invalidating the entire session.

---

## 2. Session Management & Cookie Settings

To defend against XSS and CSRF attacks, the Refresh Token is stored in a cookie configured with the following flags:
*   `HttpOnly: true` - Prevents client-side scripts from reading the cookie.
*   `Secure: true` - Enforces SSL-only transmission.
*   `SameSite: Strict` - Prevents browser from sending the cookie with cross-site requests, mitigating CSRF risks.
*   `Path: /api/v1/auth/refresh` - Restricts cookie transmissions to only the refresh route.
