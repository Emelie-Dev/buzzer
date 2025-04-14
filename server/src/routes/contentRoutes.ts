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

const router = express.Router();

router.use(protectRoute);

router.post('/', validateContentFiles, processContentFiles, saveContent);

router.get('/:page', getContents);

router.delete('/:id', deleteContent);

router.patch('/not-interested/:id', excludeContent);

export default router;
