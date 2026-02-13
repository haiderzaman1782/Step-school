import pool from '../config/database.js';
import { User } from '../models/User.js';
import { Payment } from '../models/Payment.js';
import { Payment } from '../models/Payment.js';

// Helper function to generate random dates within current month
const randomDate = (start, end) => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
};

// Generate date for current month only
const randomDateThisMonth = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return randomDate(startOfMonth, endOfMonth);
};

const randomDateTime = (start, end) => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
};

// Generate datetime for current month only
const randomDateTimeThisMonth = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return randomDateTime(startOfMonth, endOfMonth);
};



// Sample data arrays
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
  'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Melissa', 'Daniel',
  'Michelle', 'Matthew', 'Kimberly', 'Anthony', 'Amy', 'Mark', 'Angela',
  'Donald', 'Lisa', 'Steven', 'Nancy', 'Paul', 'Karen', 'Andrew', 'Betty'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young'
];

const services = [
  'General Consultation', 'Dental Checkup', 'Eye Examination', 'Cardiology',
  'Dermatology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'Neurology',
  'Psychiatry', 'Physical Therapy', 'Lab Tests', 'X-Ray', 'Ultrasound',
  'Blood Work', 'Vaccination', 'Follow-up', 'Emergency', 'Surgery Consultation'
];

const agents = [
  'Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Rodriguez', 'Dr. David Kim',
  'Dr. Lisa Anderson', 'Dr. Robert Martinez', 'Dr. Jennifer White', 'Dr. James Brown'
];

const paymentMethods = ['Credit Card', 'Debit Card', 'Cash', 'PayPal', 'Bank Transfer', 'Mobile Payment'];
const paymentStatuses = ['paid', 'pending', 'failed'];
const roles = ['admin', 'staff', 'agent', 'customer'];
const userStatuses = ['active', 'inactive', 'blocked'];

// Generate demo users
const generateUsers = async () => {
  const users = [];

  for (let i = 0; i < 25; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const phone = `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    const role = roles[Math.floor(Math.random() * roles.length)];
    const status = userStatuses[Math.floor(Math.random() * userStatuses.length)];

    // Generate avatar URL (using UI Avatars service)
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=${Math.floor(Math.random() * 16777215).toString(16)}&color=fff`;

    try {
      const user = await User.create({
        fullname: fullName,
        email,
        phone,
        role,
        status,
        avatar
      });
      users.push(user);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
      } else {
      }
    }
  }

  return users;
};



// Generate payments for a specific user
const generatePaymentsForUser = async (user, userIndex, paymentCount, paymentStartIndex) => {
  const payments = [];

  for (let i = 0; i < paymentCount; i++) {
    const customername = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const paymentmethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const amount = (Math.random() * 500 + 50).toFixed(2);
    const status = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    const date = randomDateThisMonth();
    const timestamp = randomDateTimeThisMonth();
    const service = services[Math.floor(Math.random() * services.length)];
    const transactionid = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}${i}`;
    const id = `PAY${String(paymentStartIndex + i + 1).padStart(4, '0')}`;

    try {
      const payment = await Payment.create({
        id,
        transactionid,
        customername,
        paymentmethod,
        amount: parseFloat(amount),
        status,
        date,
        timestamp,
        service,
        user_id: user.id  // Link to user
      });
      payments.push(payment);
    } catch (error) {
    }
  }

  return payments;
};

// Generate demo payments with proper user relationships
const generatePayments = async (users) => {
  const allPayments = [];
  let paymentCounter = 0;

  // Define payments per user
  const paymentsPerUser = [2, 4, 1, 3, 5, 2, 4, 3, 1, 2, 4, 3, 2, 5, 1, 3, 4, 2, 3, 1, 4, 2, 3, 5, 2];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const paymentCount = paymentsPerUser[i] || 2; // Default to 2 if array is shorter

    const userPayments = await generatePaymentsForUser(user, i, paymentCount, paymentCounter);
    allPayments.push(...userPayments);
    paymentCounter += paymentCount;
  }

  return allPayments;
};



// Main seed function
const seedDatabase = async () => {
  try {
    // Clear existing payments
    await pool.query('DELETE FROM payments');

    // Fetch existing users
    const existingUsers = await User.findAll({ limit: 1 });
    if (existingUsers.length === 0) {
      process.exit(1);
    }
    const allUsers = await User.findAll({ limit: 1000 });

    // Generate only payments with existing users
    const payments = await generatePayments(allUsers);

    // Set totalpayments and totalcalls to 0 for all users
    // Also ensure lastActivity is set (use created_at if null)
    await pool.query(`
      UPDATE users 
      SET 
        totalpayments = 0, 
        totalcalls = 0,
        lastactivity = COALESCE(lastactivity, created_at, CURRENT_TIMESTAMP)
    `);

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

// Run seed if called directly
seedDatabase();

export default seedDatabase;