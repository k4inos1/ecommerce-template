import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Notification } from '../models/Notification';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

const notificationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each authenticated client to 100 requests per window
  keyGenerator: (req) => {
    const authReq = req as AuthRequest;
    return authReq.user?.id || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/notifications — get current user's notifications (latest 30)
router.get('/', notificationsLimiter, protect, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// PATCH /api/notifications/:id/read — mark one notification as read
router.patch('/:id/read', notificationsLimiter, protect, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user!.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// PATCH /api/notifications/read-all — mark all notifications as read
router.patch('/read-all', notificationsLimiter, protect, async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ user: req.user!.id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
