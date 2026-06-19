import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Message } from '../models/Message';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

const supportRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/support/history/:room - Get message history
router.get('/history/:room', supportRateLimiter, protect, async (req: AuthRequest, res: Response) => {
  try {
    const { room } = req.params;
    
    // Only owner of the room or admin can see the history
    if (room !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ room }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// POST /api/support/send - Send a message
router.post('/send', supportRateLimiter, protect, async (req: AuthRequest, res: Response) => {
  try {
    const { content, room } = req.body;
    if (!content || !room) return res.status(400).json({ message: 'Content and room required' });

    // Only user himself or admin can send in a room
    if (room !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const message = await Message.create({
      user: req.user!.id,
      sender: req.user!.role === 'admin' ? 'admin' : 'user',
      content,
      room,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// GET /api/support/rooms - Admin only: get all active chat rooms (unique corridors)
router.get('/rooms', supportRateLimiter, protect, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const rooms = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { 
          _id: '$room', 
          lastMessage: { $first: '$content' }, 
          lastTime: { $first: '$createdAt' } 
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' }},
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true }},
      { $sort: { lastTime: -1 } }
    ]);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
