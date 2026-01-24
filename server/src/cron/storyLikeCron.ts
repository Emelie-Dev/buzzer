import cron from 'node-cron';
import Like from '../models/likeModel.js';

// Schedule the cron job to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Running story likes cleanup...');

  const storyCutoff = new Date();
  storyCutoff.setDate(storyCutoff.getDate() - 1);

  const BATCH_SIZE = 5000;
  const MAX_PER_JOB = 100000;

  let deleted = 0;

  while (deleted < MAX_PER_JOB) {
    const remaining = MAX_PER_JOB - deleted;

    const docs = await Like.find({
      collectionName: 'story',
      likedAt: { $lt: storyCutoff },
    })
      .sort({ likedAt: 1 })
      .limit(Math.min(BATCH_SIZE, remaining))
      .select('_id');

    if (!docs.length) break;

    const ids = docs.map((d) => d._id);

    await Like.deleteMany({ _id: { $in: ids } });

    deleted += ids.length;
  }
});
