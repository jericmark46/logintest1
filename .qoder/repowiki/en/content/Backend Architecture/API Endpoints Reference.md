# API Endpoints Reference

<cite>
**Referenced Files in This Document**
- [app.js](file://backend/src/app.js)
- [authRoutes.js](file://backend/src/routes/authRoutes.js)
- [authController.js](file://backend/src/controllers/authController.js)
- [auth.js](file://backend/src/middleware/auth.js)
- [User.js](file://backend/src/models/User.js)
- [client.js](file://frontend/src/api/client.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive API documentation for the authentication endpoints and health check endpoint. It covers HTTP methods, URL patterns, request/response schemas, authentication requirements, status codes, validation rules, error formats, token-based authorization flow, rate limiting considerations, client integration guidelines, and troubleshooting steps.

The backend is an Express application that exposes:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me (protected)
- GET /api/health

Authentication uses JSON Web Tokens (JWT). The frontend includes a small HTTP client that attaches Bearer tokens to protected requests.

## Project Structure
Key backend files involved in these endpoints:
- app.js: Express setup, CORS, JSON parsing, global error handling, health endpoint, route mounting, and database connection middleware.
- routes/authRoutes.js: Mounts authentication routes under /api/auth.
- controllers/authController.js: Implements register, login, and me logic.
- middleware/auth.js: Validates JWT and attaches user to request.
- models/User.js: User schema with validation, password hashing, and serialization.

Frontend client:
- api/client.js: Provides helper functions to call the API with optional Authorization headers.

```mermaid
graph TB
Client["Client App"] --> FE["Frontend API Client<br/>client.js"]
FE --> BE["Express App<br/>app.js"]
BE --> Health["GET /api/health"]
BE --> AuthRoutes["/api/auth routes<br/>authRoutes.js"]
AuthRoutes --> Register["POST /register<br/>authController.register"]
AuthRoutes --> Login["POST /login<br/>authController.login"]
AuthRoutes --> Me["GET /me<br/>authController.me"]
Me --> AuthMW["requireAuth middleware<br/>auth.js"]
Register --> DB["MongoDB via Mongoose<br/>User model"]
Login --> DB
Me --> DB
```

**Diagram sources**
- [app.js:24-41](file://backend/src/app.js#L24-L41)
- [authRoutes.js:8-10](file://backend/src/routes/authRoutes.js#L8-L10)
- [authController.js:19-71](file://backend/src/controllers/authController.js#L19-L71)
- [auth.js:4-23](file://backend/src/middleware/auth.js#L4-L23)
- [User.js:4-47](file://backend/src/models/User.js#L4-L47)

**Section sources**
- [app.js:1-56](file://backend/src/app.js#L1-L56)
- [authRoutes.js:1-13](file://backend/src/routes/authRoutes.js#L1-L13)
- [authController.js:1-74](file://backend/src/controllers/authController.js#L1-L74)
- [auth.js:1-24](file://backend/src/middleware/auth.js#L1-L24)
- [User.js:1-50](file://backend/src/models/User.js#L1-L50)
- [client.js:1-33](file://frontend/src/api/client.js#L1-L33)

## Core Components
- Authentication controller: Handles registration, login, and current user retrieval.
- JWT middleware: Validates bearer tokens and loads the user into the request context.
- User model: Defines schema, validations, password hashing, and safe JSON serialization.
- Routes: Map HTTP verbs and paths to controller handlers.
- Application bootstrap: Configures CORS, JSON parsing, health endpoint, database connectivity, and error handling.

**Section sources**
- [authController.js:19-71](file://backend/src/controllers/authController.js#L19-L71)
- [auth.js:4-23](file://backend/src/middleware/auth.js#L4-L23)
- [User.js:4-47](file://backend/src/models/User.js#L4-L47)
- [authRoutes.js:8-10](file://backend/src/routes/authRoutes.js#L8-L10)
- [app.js:24-41](file://backend/src/app.js#L24-L41)

## Architecture Overview
The authentication flow uses JWT:
- Registration creates a user and returns a token along with user data.
- Login authenticates credentials and returns a token along with user data.
- Protected endpoints require a valid Bearer token in the Authorization header.
- The server verifies the token, resolves the user, and allows access if valid.

```mermaid
sequenceDiagram
participant C as "Client"
participant A as "Auth Controller"
participant M as "Auth Middleware"
participant U as "User Model"
Note over C,A : Registration
C->>A : POST /api/auth/register {name,email,password}
A->>U : Create user
U-->>A : User object
A-->>C : 201 {token,user}
Note over C,A : Login
C->>A : POST /api/auth/login {email,password}
A->>U : Find user by email
U-->>A : User object
A-->>C : 200 {token,user}
Note over C,M : Protected Access
C->>M : GET /api/auth/me (Authorization : Bearer <token>)
M->>U : Verify token and find user
U-->>M : User object
M-->>A : Next
A-->>C : 200 {user}
```

**Diagram sources**
- [authController.js:19-71](file://backend/src/controllers/authController.js#L19-L71)
- [auth.js:4-23](file://backend/src/middleware/auth.js#L4-L23)
- [User.js:30-47](file://backend/src/models/User.js#L30-L47)

## Detailed Component Analysis

### Endpoint: POST /api/auth/register
- Method: POST
- URL: /api/auth/register
- Authentication: None
- Request body schema:
  - name: string, required, trimmed, max length 80
  - email: string, required, unique, lowercase, must match email pattern
  - password: string, required, minimum length 8
- Validation rules:
  - All fields must be strings.
  - Email must be a valid format.
  - Password must be at least 8 characters.
  - Duplicate email results in conflict.
- Success response:
  - Status: 201 Created
  - Body: { token: string, user: { id: string, name: string, email: string } }
- Error responses:
  - 400 Bad Request: Missing or invalid fields; message indicates what is wrong.
  - 409 Conflict: Email already exists.
  - 400 Bad Request: Invalid JSON body (global parser error).
  - 500 Internal Server Error: Unexpected server error.

Example request:
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "securepass123"
}

Example success response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "60d5ec49f1b2c81a3c9e4b12",
    "name": "Ada Lovelace",
    "email": "ada@example.com"
  }
}

Example error response (validation):
{
  "message": "Please provide a valid name and email"
}

Example error response (duplicate email):
{
  "message": "An account with this email already exists"
}

Notes:
- Passwords are hashed before storage using bcrypt.
- The user JSON excludes internal fields like _id and password.

**Section sources**
- [authRoutes.js:8](file://backend/src/routes/authRoutes.js#L8)
- [authController.js:19-51](file://backend/src/controllers/authController.js#L19-L51)
- [User.js:4-47](file://backend/src/models/User.js#L4-L47)
- [app.js:47-53](file://backend/src/app.js#L47-L53)

### Endpoint: POST /api/auth/login
- Method: POST
- URL: /api/auth/login
- Authentication: None
- Request body schema:
  - email: string, required
  - password: string, required
- Validation rules:
  - Both fields must be present and strings.
  - Credentials are verified against stored user.
- Success response:
  - Status: 200 OK
  - Body: { token: string, user: { id: string, name: string, email: string } }
- Error responses:
  - 400 Bad Request: Missing or invalid fields.
  - 401 Unauthorized: Invalid email or password.
  - 400 Bad Request: Invalid JSON body (global parser error).
  - 500 Internal Server Error: Unexpected server error.

Example request:
{
  "email": "ada@example.com",
  "password": "securepass123"
}

Example success response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "60d5ec49f1b2c81a3c9e4b12",
    "name": "Ada Lovelace",
    "email": "ada@example.com"
  }
}

Example error response (invalid credentials):
{
  "message": "Invalid email or password"
}

Notes:
- Token signing uses JWT_SECRET environment variable.
- Token expiration defaults to 7 days unless overridden by JWT_EXPIRES_IN.

**Section sources**
- [authRoutes.js:9](file://backend/src/routes/authRoutes.js#L9)
- [authController.js:53-67](file://backend/src/controllers/authController.js#L53-L67)
- [User.js:30-47](file://backend/src/models/User.js#L30-L47)
- [app.js:47-53](file://backend/src/app.js#L47-L53)

### Endpoint: GET /api/auth/me
- Method: GET
- URL: /api/auth/me
- Authentication: Required
  - Header: Authorization: Bearer <token>
- Request parameters: None
- Success response:
  - Status: 200 OK
  - Body: { user: { id: string, name: string, email: string } }
- Error responses:
  - 401 Unauthorized: Missing or invalid token; not authorized.
  - 500 Internal Server Error: Unexpected server error.

Example request:
Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Example success response:
{
  "user": {
    "id": "60d5ec49f1b2c81a3c9e4b12",
    "name": "Ada Lovelace",
    "email": "ada@example.com"
  }
}

Example error response (unauthorized):
{
  "message": "Not authorized"
}

Notes:
- The middleware verifies the token and loads the user into req.user.
- If the user does not exist in the database, the request is rejected.

**Section sources**
- [authRoutes.js:10](file://backend/src/routes/authRoutes.js#L10)
- [authController.js:69-71](file://backend/src/controllers/authController.js#L69-L71)
- [auth.js:4-23](file://backend/src/middleware/auth.js#L4-L23)

### Endpoint: GET /api/health
- Method: GET
- URL: /api/health
- Authentication: None
- Request parameters: None
- Success response:
  - Status: 200 OK
  - Body: { status: "ok" }
- Error responses:
  - 500 Internal Server Error: Unexpected server error.

Example request:
GET /api/health

Example success response:
{
  "status": "ok"
}

Notes:
- This endpoint is useful for readiness/liveness checks.
- Database connection is attempted on each request due to middleware; consider caching if needed.

**Section sources**
- [app.js:26-28](file://backend/src/app.js#L26-L28)

## Dependency Analysis
The following diagram shows how components depend on each other for authentication endpoints.

```mermaid
graph LR
Routes["routes/authRoutes.js"] --> Controller["controllers/authController.js"]
Controller --> Model["models/User.js"]
Routes --> MW["middleware/auth.js"]
MW --> Model
App["src/app.js"] --> Routes
App --> Health["GET /api/health"]
```

**Diagram sources**
- [authRoutes.js:1-12](file://backend/src/routes/authRoutes.js#L1-L12)
- [authController.js:1-74](file://backend/src/controllers/authController.js#L1-L74)
- [auth.js:1-24](file://backend/src/middleware/auth.js#L1-L24)
- [User.js:1-50](file://backend/src/models/User.js#L1-L50)
- [app.js:1-56](file://backend/src/app.js#L1-L56)

**Section sources**
- [authRoutes.js:1-12](file://backend/src/routes/authRoutes.js#L1-L12)
- [authController.js:1-74](file://backend/src/controllers/authController.js#L1-L74)
- [auth.js:1-24](file://backend/src/middleware/auth.js#L1-L24)
- [User.js:1-50](file://backend/src/models/User.js#L1-L50)
- [app.js:1-56](file://backend/src/app.js#L1-L56)

## Performance Considerations
- Database connectivity: The app connects to MongoDB on every request via middleware. For high-throughput environments, consider maintaining a persistent connection pool or warming connections at startup.
- JWT operations: Signing and verifying tokens are CPU-bound but lightweight; ensure secrets are configured securely and avoid unnecessary re-signing.
- Input validation: Keep validation close to the boundary (controller/model) to reduce round trips.
- CORS: Restrict allowed origins to known clients to reduce overhead and improve security.
- Rate limiting: No built-in rate limiter is present. Consider adding a rate-limiting middleware (e.g., express-rate-limit) to protect sensitive endpoints like login and register.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Invalid JSON body:
  - Symptom: 400 response with message "Invalid JSON body".
  - Cause: Malformed request body or missing Content-Type header.
  - Resolution: Ensure Content-Type is application/json and the payload is valid JSON.
- Not authorized:
  - Symptom: 401 response with message "Not authorized".
  - Causes: Missing Authorization header, malformed token, expired token, or user not found.
  - Resolution: Attach Authorization: Bearer <token> and verify token validity and expiration.
- Invalid email or password:
  - Symptom: 401 response with message "Invalid email or password".
  - Resolution: Verify credentials and ensure the user exists.
- Duplicate email:
  - Symptom: 409 response with message indicating duplicate email.
  - Resolution: Use a different email or handle conflict in the client.
- Field validation errors:
  - Symptom: 400 responses with messages about required fields, email format, or password length.
  - Resolution: Validate inputs on the client side and adhere to the documented schemas.
- CORS errors:
  - Symptom: Browser blocks requests due to origin restrictions.
  - Resolution: Configure CLIENT_ORIGIN in the backend environment to include your frontend origin.
- Cannot reach the server:
  - Symptom: Frontend throws "Cannot reach the server. Is the backend running?".
  - Resolution: Ensure the backend is running and VITE_API_URL points to the correct base URL.

**Section sources**
- [app.js:47-53](file://backend/src/app.js#L47-L53)
- [auth.js:4-23](file://backend/src/middleware/auth.js#L4-L23)
- [authController.js:19-67](file://backend/src/controllers/authController.js#L19-L67)
- [client.js:1-33](file://frontend/src/api/client.js#L1-L33)

## Conclusion
This API provides secure authentication through JWT and exposes clear, well-defined endpoints for registration, login, and retrieving the authenticated user. Follow the documented request/response schemas and authentication requirements to integrate successfully. Implement client-side validation, handle error responses gracefully, and consider adding rate limiting and persistent database connections for production-grade performance and resilience.

[No sources needed since this section summarizes without analyzing specific files]