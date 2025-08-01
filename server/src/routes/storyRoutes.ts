import express from 'express';
import {
  saveStory,
  getStories,
  getStory,
  validateStoryFiles,
  processStoryFiles,
  deleteStory,
  hideStory,
  updatetory,
} from '../controllers/storyController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.use(protectRoute);

router
  .route('/')
  .get(getStories)
  .post(validateStoryFiles, processStoryFiles, saveStory);

router.route('/:id').get(getStory).delete(deleteStory).patch(updatetory);

router.patch('/hide/:id', hideStory);

export default router;
