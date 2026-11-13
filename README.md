# Sweety – Blood Glucose Tracker

A full-stack starter project for recording blood glucose readings and viewing daily, month-to-date, and previous-month reports.

## Stack
- React + Vite
- Node.js + Express
- PostgreSQL (`pg`)
- bcryptjs + JWT authentication
- Backend tests with Jest + Supertest

## Requirements
- Node.js 20+
- PostgreSQL 14+
- npm

## 1. Database setup
Create a PostgreSQL database and user, or use an existing local PostgreSQL account:

```sql
CREATE DATABASE sweety;
```

Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` and `JWT_SECRET`.
Example:
`DATABASE_URL=postgresql://postgres:your_password@localhost:5432/sweety`

Then run the schema and seed script from the server folder:

```bash
cd server
npm install
npm run db:setup
npm run seed
```

The seed script creates the demo account `demo@sweety.local` with password `SweetyDemo123!` and sample readings. Change this password for any non-local deployment.

## 2. Run the backend
```bash
cd server
npm run dev
```
API runs at `http://localhost:3000`.

## 3. Run the frontend
In another terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL printed by Vite (normally `http://localhost:5173`).

## 4. Tests
```bash
cd server
npm test
```
Tests include validation helpers. API integration tests require a test PostgreSQL database configured with `TEST_DATABASE_URL`; see `server/.env.example`.

## API endpoints
- `POST /api/auth/register` — `{ name, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `GET /api/auth/me`
- `GET /api/readings?date=YYYY-MM-DD`
- `POST /api/readings` — `{ reading_date, time_slot, value }`
- `PUT /api/readings/:id` — `{ reading_date, time_slot, value }`
- `DELETE /api/readings/:id`
- `GET /api/reports/daily?date=YYYY-MM-DD`
- `GET /api/reports/month-to-date?date=YYYY-MM-DD`
- `GET /api/reports/previous-month?date=YYYY-MM-DD`

## Assumptions and notes
- Dates are stored as PostgreSQL `DATE` values and treated as calendar dates, not timestamps.
- A reading is unique per user/date/time slot; the database constraint is the final guard against duplicate slots.
- The daily maximum is four readings because only the four specified slots are accepted.
- Reports include only the authenticated user's readings.
- The demo app is an educational assignment, not a medical device. It does not provide diagnosis or treatment recommendations.
- Before production use, add HTTPS, rate limiting, email verification/password reset, stronger operational logging, and a managed secrets solution.
- JWT is stored in browser localStorage for assignment simplicity; consider a secure HttpOnly cookie strategy for production.
- Screenshots/recording must be captured locally after running the app.
