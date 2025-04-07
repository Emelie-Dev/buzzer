import express from 'express';
import {
  saveStory,
  getStories,
  getStory,
  validateStoryFiles,
  processStoryFiles,
} from '../controllers/storyController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.use(protectRoute);

router
  .route('/')
  .get(getStories)
  .post(validateStoryFiles, processStoryFiles, saveStory);

router.get('/:id', getStory);

export default router;
