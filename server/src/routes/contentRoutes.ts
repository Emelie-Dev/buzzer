import express from 'express';
import {
  deleteContent,
  processContentFiles,
  saveContent,
  validateContentFiles,
  excludeContent,
  getContents,
  getContent,
} from '../controllers/contentController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.use(protectRoute);

router
  .route('/')
  .get(getContents)
  .post(validateContentFiles, processContentFiles, saveContent);

router.route('/:id').get(getContent).delete(deleteContent);

router.patch('/not-interested/:id', excludeContent);

export default router;
