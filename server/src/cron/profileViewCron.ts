import cron from 'node-cron';
import View from '../models/viewModel.js';

// Schedule the cron job to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Running profile and story views cleanup...');

  const viewCutoff = new Date();
  viewCutoff.setDate(viewCutoff.getDate() - 30); // 30 days ago

  const storyCutoff = new Date();
  storyCutoff.setDate(storyCutoff.getDate() - 1);

  await View.deleteMany({
    collectionName: 'user',
    createdAt: { $lt: viewCutoff },
  });

  await View.deleteMany({
    collectionName: 'story',
    createdAt: { $lt: storyCutoff },
  });
});
