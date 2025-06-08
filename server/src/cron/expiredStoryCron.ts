import cron from 'node-cron';
import deleteExpiredStories from '../utils/deleteExpiredStories.js';

// Schedule the cron job to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Running expired story cleanup...');

  // Run the deleteExpiredStories function
  await deleteExpiredStories();
});
