import { Router } from 'express';
import { chat, djIntro, getChatHistory } from '../controllers/aiController.js';
import { authOptional } from '../middleware/auth.js';

const router = Router();

router.post('/chat', authOptional, chat);
router.post('/dj-intro', djIntro);
router.get('/history', authOptional, getChatHistory);

export default router;
