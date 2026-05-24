import { Router } from 'express';
import { login, logout, me, updateNetEase } from '../controllers/authController.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', authRequired, logout);
router.get('/me', authRequired, me);
router.put('/netease', authRequired, updateNetEase);

export default router;
