import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  deleteUserSearch,
  getSearchSuggestions,
  getTrendingSearches,
  handleSearch,
  searchForUsers,
} from '../controllers/searchController.js';

const router = express.Router();

router.use(protectRoute);

router.get('/', handleSearch);

router.get('/trending', getTrendingSearches);

router.get('/suggestions', getSearchSuggestions);

router.get('/users', searchForUsers);

router.delete('/:id', deleteUserSearch)

export default router;
