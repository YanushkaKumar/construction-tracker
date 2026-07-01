# 10 - API Documentation

The BuildTrack Backend (`apps/api`) is built on NestJS and follows RESTful principles. All endpoints are prefixed with `/api/v1`.

## Global Standards

- **Content-Type**: `application/json`
- **Authentication**: Bearer Token (JWT) in the `Authorization` header.
- **Error Format**:
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed",
    "error": "Bad Request"
  }
  ```

## Core Modules & Endpoints

### Auth Module (`/api/v1/auth`)
- **`POST /login`**: Authenticates a user.
  - *Payload*: `{ "email": "...", "password": "..." }`
  - *Response*: Returns `{ "accessToken", "refreshToken", "user" }`.
- **`POST /refresh`**: Issues a new access token using a valid refresh token.

### Bank Loans Module (`/api/v1/bank-loans`)
- **`GET /`**: Fetch all company bank loans.
  - *Auth*: Required (Finance Manager, Super Admin)
- **`POST /`**: Create a new loan facility.
- **`POST /:id/repayments`**: Record a repayment against a loan.
  - *Payload*: `{ "amount": 50000, "paymentDate": "2026-06-30T00:00:00.000Z", "reference": "TRX-123" }`
  - *Logic*: The backend automatically validates that `amount` does not exceed `outstandingDebt`, creates the repayment record, and decrements the `outstandingDebt` on the parent loan.

### Projects Module (`/api/v1/projects`)
- **`GET /`**: Retrieve a paginated list of projects.
- **`GET /:id`**: Fetch deep project details, including BOQ, Tasks, and associated Purchases.

### Purchases Module (`/api/v1/purchases`)
- **`POST /`**: Log an expense.
  - *Payload*: Can optionally include `bankLoanId` to link the purchase directly to a loan facility for automated treasury tracking.

## Validation & Sanitization
All incoming payloads are validated using NestJS `ValidationPipe` combined with `class-validator` DTOs (Data Transfer Objects). Invalid requests are instantly rejected with HTTP 400 without hitting the database or business logic layers.
