import { config } from 'dotenv';
import mongoose from 'mongoose';

// Set environmental variables
config({ path: './config.env' });

// Handles uncaught exceptions(No business with the server)
process.on('uncaughtException', (err) => {
  console.log('\nError ', { name: err.name, message: err.message });
  console.log('\nUncaught Exception Occured! Shutting down....\n');
  process.exit(1);
});

// Custom Modules
import app from './app.js';

// Connects to database
await mongoose.connect(
  (process.env.NODE_ENV === 'production'
    ? process.env.DB_CONN_STR
    : process.env.DB_LOCAL_CONN_STR) as string,
  {
    autoIndex: true,
  }
);

console.log('\nDatabase Connection successfull....');

// Starting the server
const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`App is running on port - ${port}\n`);
});

// Handles Promise Rejections
process.on('unhandledRejection', (err: Error) => {
  console.log('\nError ', { name: err.name, message: err.message });
  console.log('\nUnhandled Rejection Occured! Shutting down....\n');
  server.close(() => {
    process.exit(1);
  });
});

// Heroku specific
process.on('SIGTERM', () => {
  console.log('\nSIGTERM RECEIVED. Shutting down....');
  server.close(() => {
    console.log('\nProcess terminated!!\n');
  });
});
