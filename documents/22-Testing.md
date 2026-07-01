# 22 - Testing

BuildTrack utilizes automated testing to ensure the integrity of the application, especially around financial logic (like Bank Loan Repayments).

## 1. Unit Tests
Unit tests focus on individual classes or functions in isolation, mocking dependencies like the database.
- **Framework**: Jest (included by default in NestJS).
- **Execution**: Run `npm run test` inside `apps/api` or `apps/web`.
- **Focus Areas**:
  - Services in NestJS (e.g., testing that `BankLoanService.recordRepayment` throws an error if `amount > outstandingDebt`).
  - Complex React hooks or utility functions in Next.js.

## 2. Integration Tests
Integration tests ensure that modules work correctly with actual dependencies, like a test PostgreSQL database.
- **Execution**: Run `npm run test:e2e` inside `apps/api`.
- **Flow**: These tests spin up a test database, insert mock data via Prisma, make HTTP requests to the API endpoints using `supertest`, and verify the database state changed correctly.

## 3. Code Coverage
We aim for a minimum of 70% test coverage on business-critical logic.
Run `npm run test:cov` to generate a coverage report in the `/coverage` directory, which can be viewed in HTML format.

## CI/CD Enforcement
The GitHub Actions pipeline is configured to run `npm run test` automatically on every Pull Request. If a test fails, the Pull Request cannot be merged, acting as an automated gatekeeper.
