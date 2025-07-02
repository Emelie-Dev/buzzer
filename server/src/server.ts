import { config } from 'dotenv';
import mongoose from 'mongoose';
import webpush from 'web-push';

// Custom Modules
import app from './app.js';
import { createSchemasIfNeeded, syncAllCollections } from './typesense/sync.js';
import watcher from './typesense/watcher.js';

// Set environmental variables
config({ path: './config.env' });

// Handles uncaught exceptions(No business with the server)
process.on('uncaughtException', (err) => {
  console.log('\nError ', { name: err.name, message: err.message });
  console.log('\nUncaught Exception Occured! Shutting down....\n');
  process.exit(1);
});

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

// Initialize typesense
const initTypesense = async () => {
  await createSchemasIfNeeded();
  await syncAllCollections();
  watcher();
};
await initTypesense();

console.log('\nTypesense is running....');

// Enable push notifications
webpush.setVapidDetails(
  'mailto:buzzerapp2025@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

console.log('\nPush notification enabled....');

// Starting the server
const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`\nApp is running on port - ${port}\n`);
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
