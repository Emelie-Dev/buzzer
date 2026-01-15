import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  getReels,
  processReelFiles,
  saveReel,
  saveReelSound,
  validateReelFiles,
  deleteReelSound,
  excludeReelType,
  deleteReel,
  getReel,
  getPinnedReels,
} from '../controllers/reelController.js';
import updatePost from '../utils/updatePost.js';
import { apiLimiter } from '../utils/limiters.js';

const router = express.Router();

router.use(protectRoute);
router.use(apiLimiter);

router
  .route('/')
  .get(getReels)
  .post(validateReelFiles, processReelFiles, saveReel);

router.post('/sounds', saveReelSound);
router.post('/sounds/:id', deleteReelSound);

router.patch('/not-interested/:id', excludeReelType);

router.post('/pinned', getPinnedReels);

router.route('/:id').delete(deleteReel).get(getReel).patch(updatePost('reel'));

export default router;
