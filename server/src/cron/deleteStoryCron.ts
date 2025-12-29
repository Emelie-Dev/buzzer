import cron from 'node-cron';
import deleteExpiredStories from '../utils/deleteExpiredStories.js';

// Schedule the cron job to run every one hour
cron.schedule('0 * * * *', async () => {
  console.log('Running expired stories cleanup...');

  await deleteExpiredStories();
});
