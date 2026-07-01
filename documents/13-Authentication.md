# 13 - Authentication

Authentication in BuildTrack is strictly handled via **JSON Web Tokens (JWT)**. We do not use session cookies, ensuring a fully stateless API that works identically for both the Web and Mobile applications.

## Technologies Used
- **Passport.js**: Integrated via `@nestjs/passport`.
- **bcrypt**: Used to hash passwords before saving them to PostgreSQL.

## The Login Flow
1. The user submits `{ email, password }` from the Web or Mobile client to `POST /api/v1/auth/login`.
2. NestJS retrieves the user from PostgreSQL and uses `bcrypt.compare()` to verify the password.
3. If valid, the system generates two tokens:
   - **Access Token**: Short-lived (e.g., 15 minutes). Contains the user's ID and Role.
   - **Refresh Token**: Long-lived (e.g., 7 days). Stored securely in the database alongside the user's record (hashed).
4. The client receives the tokens. The Web app stores them in HTTP-only cookies or local storage; the Mobile app stores them in `SecureStore`.

## The Refresh Flow
When the 15-minute Access Token expires, API requests will return `401 Unauthorized`.
1. The client catches the 401 and automatically makes a silent request to `POST /api/v1/auth/refresh` using the Refresh Token.
2. The server verifies the Refresh Token against the hashed version in the database.
3. A new Access Token is issued, and the original failed request is retried.
4. If the Refresh Token is also expired, the user is forced to log in again.

## Password Reset Flow
(Future Implementation): Will utilize a short-lived token sent via email (SMTP) or SMS (WhatsApp/Twilio) allowing the user to `POST /api/v1/auth/reset-password`.
