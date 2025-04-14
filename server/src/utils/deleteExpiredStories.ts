import fs from 'fs';
import Story from '../models/storyModel.js';

export default async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1); // 24 hours ago
  cutoff.setMilliseconds(0);

  // Fetch stories older than 24 hours
  const stories = await Story.find({ createdAt: { $lt: cutoff } });

  // Stories music files
  const musicFiles = new Set();

  // If there are stories to delete
  if (stories.length > 0) {
    const promises = stories.map(async (story) => {
      // Delete story from DB
      await story.deleteOne();

      // Add story music file
      if (story.sound) musicFiles.add(story.sound);

      // If in production, don't delete local files
      if (process.env.NODE_ENV !== 'production') {
        // Try deleting the media file
        await fs.promises.unlink(`src/public/stories/${story.media.src}`);
      }
    });

    // Wait for all delete operations to finish
    await Promise.allSettled(promises);

    // Delete music files that are no longer needed
    await Promise.allSettled(
      [...musicFiles].map(async (path) => {
        if (process.env.NODE_ENV !== 'production')
          await fs.promises.unlink(`src/public/stories/${path}`);
      })
    );
  }
};
