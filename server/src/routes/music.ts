import { Router } from 'express';
import { getTracks, getPlaylist, createTastePlaylist } from '../controllers/musicController.js';
import { authOptional } from '../middleware/auth.js';

const router = Router();

router.get('/tracks', getTracks);
router.get('/playlist', authOptional, getPlaylist);
router.post('/taste-playlist', authOptional, createTastePlaylist);

export default router;
