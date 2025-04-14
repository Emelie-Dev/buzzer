import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  bookmarkItem,
  deleteBookmark,
} from '../controllers/bookmarkController.js';

const router = express.Router();

router.use(protectRoute);

router.post('/', bookmarkItem);

router.delete('/:id', deleteBookmark);

export default router;
