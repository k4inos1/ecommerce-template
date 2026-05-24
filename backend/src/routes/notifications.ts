import { Router, Response } from 'express';
import { Notification } from '../models/Notification';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications — get current user's notifications (latest 30)
router.get('/', protect, async (req: AuthRequest, res: Response) => {
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
router.patch('/:id/read', protect, async (req: AuthRequest, res: Response) => {
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
router.patch('/read-all', protect, async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ user: req.user!.id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
