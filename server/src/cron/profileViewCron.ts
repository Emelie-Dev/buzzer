import cron from 'node-cron';
import View from '../models/viewModel.js';

// Schedule the cron job to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Running profile views cleanup...');

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30); // 30 days ago
  cutoff.setMilliseconds(0);

  await View.deleteMany({
    collectionName: 'user',
    createdAt: { $lt: cutoff },
  });
});
