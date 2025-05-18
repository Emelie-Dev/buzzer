import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  getSearchSuggestions,
  getTrendingSearches,
  handleSearch,
} from '../controllers/searchController.js';

const router = express.Router();

router.use(protectRoute);

router.get('/', handleSearch);

router.get('/trending', getTrendingSearches);

router.get('/suggestions', getSearchSuggestions);

export default router;
