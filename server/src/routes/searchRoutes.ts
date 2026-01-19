import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  deleteUserSearch,
  getSearchSuggestions,
  getTrendingSearches,
  handleSearch,
  searchForUsers,
} from '../controllers/searchController.js';
import { apiLimiter } from '../utils/limiters.js';

const router = express.Router();

router.use(protectRoute);
router.use(apiLimiter);

router.get('/', handleSearch);

router.get('/trending', getTrendingSearches);

router.get('/suggestions', getSearchSuggestions);

router.get('/users/:username?', searchForUsers);

router.delete('/:id', deleteUserSearch);

export default router;
