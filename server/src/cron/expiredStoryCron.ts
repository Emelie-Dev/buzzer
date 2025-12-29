import cron from 'node-cron';
import Story from '../models/storyModel.js';

// Schedule the cron job to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Updating expired stories...');

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1); // 24 hours ago
  cutoff.setMilliseconds(0);

  // Update stories
  await Story.updateMany(
    {
      expired: false,
      createdAt: { $lt: cutoff },
    },
    {
      $set: {
        expired: true,
      },
    }
  );
});
