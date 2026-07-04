import express from 'express';
import {
  createComment,
  updateComment,
  deleteComment
} from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateCommentCreate, validateCommentUpdate } from '../validators/commentValidator.js';

const router = express.Router();

router.use(protect);

router.post('/', validateCommentCreate, createComment);
router.patch('/:id', validateCommentUpdate, updateComment);
router.delete('/:id', deleteComment);

export default router;
