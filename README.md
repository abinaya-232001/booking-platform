# Booking Platform API

A REST API built with **NestJS**, **TypeORM**, and **PostgreSQL** that allows
authenticated users to manage services and lets customers create bookings.

## Project Overview
This API implements:
- JWT-based authentication (Register/Login/Refresh)
- Service management (CRUD, auth required for write operations)
- Booking management (public creation, auth required for status changes)
- Business rules: valid service reference, no past-dated bookings, cancelled
  bookings can't be completed, duplicate booking prevention
- Swagger API documentation
- Global exception handling & request validation
- Pagination, search and status filtering on list endpoints

## Installation Steps
\`\`\`bash
git clone https://github.com/abinaya-232001/booking-platform.git
cd booking-platform
npm install
\`\`\`

## Environment Variables
Copy \`.env.example\` to \`.env\` and fill in the values:

| Variable | Description |
|---|---|
| PORT | Port the API runs on |
| DATABASE_HOST/PORT/USER/PASSWORD/NAME | PostgreSQL connection |
| JWT_SECRET / JWT_EXPIRES_IN | Access token secret & expiry |
| JWT_REFRESH_SECRET / JWT_REFRESH_EXPIRES_IN | Refresh token secret & expiry |

## Database Setup
Create a PostgreSQL database matching \`DATABASE_NAME\`, or run:
\`\`\`bash
docker-compose up -d db
\`\`\`

## Running Migrations
\`\`\`bash
npm run migration:run
\`\`\`

## Running the Application
\`\`\`bash
npm run start:dev
\`\`\`
Or with Docker:
\`\`\`bash
docker-compose up --build
\`\`\`

## API Documentation

Swagger UI: `http://localhost:4000/api/docs`

## API Endpoints

### Authentication
- POST /auth/register
- POST /auth/login
- POST /auth/refresh

### Services
- GET /services
- GET /services/:id
- POST /services
- PATCH /services/:id
- DELETE /services/:id

### Bookings
- POST /bookings
- GET /bookings
- GET /bookings/:id
- PATCH /bookings/:id/status
- PATCH /bookings/:id/cancel

## Assumptions Made
- All authenticated users share equal permissions to manage all services
  (no per-user ownership was specified in requirements).
- GET endpoints for services and bookings are public, since customers need
  to browse services and check bookings without logging in; only
  create/update/delete on services and status changes on bookings require auth.
- \`bookingTime\` is stored as a 24-hour \`HH:mm\` string.

## Future Improvements
- Role-based access control (e.g., admin vs staff)
- Email notifications on booking status changes
  
- Rate limiting on public endpoints
- End-to-end tests with a test database
