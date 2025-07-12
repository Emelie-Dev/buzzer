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
} from '../controllers/reelController.js';
import updatePost from '../utils/updatePost.js';

const router = express.Router();

router.use(protectRoute);

router
  .route('/')
  .get(getReels)
  .post(validateReelFiles, processReelFiles, saveReel);

router.post('/sounds', saveReelSound);
router.delete('/sounds/:id', deleteReelSound);

router.patch('/not-interested/:id', excludeReelType);

router.route('/:id').delete(deleteReel).get(getReel).patch(updatePost('reel'));

export default router;
