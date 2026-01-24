import express from 'express';
import {
  deleteContent,
  processContentFiles,
  saveContent,
  validateContentFiles,
  excludeContent,
  getContents,
} from '../controllers/contentController.js';
import protectRoute from '../middleware/protectRoute.js';
import updatePost from '../utils/updatePost.js';
import { apiLimiter } from '../utils/limiters.js';

const router = express.Router();

router.use(protectRoute);
router.use(apiLimiter);

router
  .route('/')
  .get(getContents)
  .post(validateContentFiles, processContentFiles, saveContent);

router.route('/:id').patch(updatePost('content')).delete(deleteContent);

router.patch('/not-interested/:id', excludeContent);

export default router;
