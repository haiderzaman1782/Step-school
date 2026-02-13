# Database Seeding Guide

This guide explains how to populate your database with demo data.

## Running the Seed Script

To populate your database with at least 20 demo records for each table (Users, Appointments, Payments, Calls), run:

```bash
cd backend
npm run db:seed
```

Or directly:

```bash
cd backend
node src/scripts/seedData.js
```

## What Gets Created

The seed script will generate:

- **25 Users** - Mix of admins, staff, agents, and customers with various statuses
- **30 Appointments** - Various services, statuses, and assigned agents
- **30 Payments** - Linked to appointments and users with different payment methods
- **30 Calls** - Incoming and outgoing calls with various statuses

## Notes

- If users already exist in the database, the script will use existing users and only create new appointments, payments, and calls
- If no users exist, it will create everything from scratch
- All data is randomly generated but realistic
- Avatar URLs are automatically generated using UI Avatars service
- All foreign key relationships are properly maintained

## Troubleshooting

If you encounter errors:

1. Make sure your database is running and accessible
2. Check your `.env` file has correct database credentials
3. Ensure the database schema has been created (run `schema.sql` first)
4. Check that all required tables exist

