import express from 'express';
console.log('express imported');
import cors from 'cors';
console.log('cors imported');
import dotenv from 'dotenv';
console.log('dotenv imported');
import path from 'path';
console.log('path imported');
import { fileURLToPath } from 'url';
console.log('url imported');
import pool from './src/config/database.js';
console.log('database imported');
import userRoutes from './src/routes/users.js';
console.log('users routes imported');
import paymentRoutes from './src/routes/payments.js';
console.log('payments routes imported');

console.log('All imports successful');
