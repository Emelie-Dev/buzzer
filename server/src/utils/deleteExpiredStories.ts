import fs from 'fs';
import Story from '../models/storyModel.js';
import handleCloudinary from './handleCloudinary.js';
import path from 'path';

export default async () => {
  const MAX_PER_JOB = 20000;
  const BATCH_SIZE = 1000;
  let deleted = 0;

  while (true) {
    const stories = await Story.find({ expired: true })
      .sort({ createdAt: 1 })
      .limit(BATCH_SIZE);

    if (!stories.length) break;

    const idsToDelete = stories.map((s) => s._id);
    await Story.deleteMany({ _id: { $in: idsToDelete } });
    deleted += idsToDelete.length;

    // Collect music files
    const musicFiles = new Set();
    const fileDeletionPromises = stories.map(async (story) => {
      if (story.sound) musicFiles.add(story.sound);

      const mediaSrc = story.media.src;
      if (!mediaSrc) return;

      if (process.env.NODE_ENV === 'production') {
        await handleCloudinary(
          'delete',
          `stories/${path.basename(String(mediaSrc))}`,
          story.media.mediaType
        );
      } else {
        await fs.promises.unlink(`src/public/stories/${mediaSrc}`);
      }
    });

    await Promise.allSettled(fileDeletionPromises);

    // Delete music files
    const musicDeletionPromises = [...musicFiles].map(async (src) => {
      if (process.env.NODE_ENV === 'production') {
        await handleCloudinary(
          'delete',
          `stories/${path.basename(String(src))}`,
          'raw'
        );
      } else {
        await fs.promises.unlink(`src/public/stories/${src}`);
      }
    });

    await Promise.allSettled(musicDeletionPromises);

    if (deleted >= MAX_PER_JOB) break;
  }
};
