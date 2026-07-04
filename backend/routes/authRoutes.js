import express from 'express';
import {
  login,
  register,
  refresh,
  logout
} from '../controllers/authController.js';
import { validateLogin, validateRegister } from '../validators/authValidator.js';

const router = express.Router();

router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
