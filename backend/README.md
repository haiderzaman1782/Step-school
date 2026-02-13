# Booking Dashboard Backend

Clean, professional backend API for the Booking Dashboard application.

## Features

- RESTful API for managing appointments, users, calls, and payments
- PostgreSQL database with proper schema matching frontend tables
- Clean architecture with separation of concerns
- Error handling and validation
- CORS support for frontend integration

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Create a PostgreSQL database named `booking_dashboard`
   - Run the schema file to create tables:
     ```bash
     psql -U postgres -d booking_dashboard -f database/schema.sql
     ```

3. **Environment Configuration**
   - Copy `ENV_SETUP.txt` instructions
   - Create a `.env` file in the backend directory:
     ```env
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=booking_dashboard
     DB_USER=postgres
     DB_PASSWORD=your_password_here
     PORT=3001
     NODE_ENV=development
     CORS_ORIGIN=http://localhost:5173
     ```

4. **Start Server**
   ```bash
   npm run dev    # Development mode with auto-reload
   npm start      # Production mode
   ```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Calls
- `GET /api/calls` - Get all calls
- `GET /api/calls/:id` - Get call by ID
- `POST /api/calls` - Create new call log
- `PUT /api/calls/:id` - Update call
- `DELETE /api/calls/:id` - Delete call

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

### Health Check
- `GET /health` - Check server and database status

## Database Schema

The database schema matches the frontend table structures exactly:

- **users**: User management (admin, staff, agent, customer)
- **appointments**: Appointment bookings
- **calls**: Call logs and history
- **payments**: Payment transactions

See `database/schema.sql` for complete schema definition.

## Project Structure

```
backend/
├── database/
│   └── schema.sql          # Database schema
├── src/
│   ├── config/
│   │   └── database.js     # Database connection
│   ├── controllers/        # Request handlers
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   └── server.js           # Express server
├── package.json
└── README.md
```

## Technologies

- Node.js
- Express.js
- PostgreSQL
- pg (PostgreSQL client)

