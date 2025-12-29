import cron from 'node-cron';
import View from '../models/viewModel.js';

// Schedule the cron job to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Running profile and story views cleanup...');

  const viewCutoff = new Date();
  viewCutoff.setDate(viewCutoff.getDate() - 30); // 30 days ago

  const storyCutoff = new Date();
  storyCutoff.setDate(storyCutoff.getDate() - 1);

  const BATCH_SIZE = 5000;
  const MAX_PER_JOB = 100000;

  let deleted = 0;

  const filter = {
    $or: [
      { collectionName: 'user', createdAt: { $lt: viewCutoff } },
      { collectionName: 'story', createdAt: { $lt: storyCutoff } },
    ],
  };

  while (deleted < MAX_PER_JOB) {
    const remaining = MAX_PER_JOB - deleted;

    const docs = await View.find(filter)
      .sort({ createdAt: 1 })
      .limit(Math.min(BATCH_SIZE, remaining))
      .select('_id');

    if (!docs.length) break;

    const ids = docs.map((d) => d._id);

    await View.deleteMany({ _id: { $in: ids } });

    deleted += ids.length;
  }
});
