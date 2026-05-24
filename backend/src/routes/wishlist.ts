import { Router, Response } from 'express';
import { User } from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();

// ─── PRIVATE ─────────────────────────────────────────────────────────────────

// GET /api/wishlist — get user's wishlist
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).populate('wishlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.wishlist);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// POST /api/wishlist/:productId — add product to wishlist
router.post('/:productId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }

    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if duplicate
    const exists = user.wishlist.some(id => id.toString() === productId);
    if (exists) {
        return res.status(400).json({ message: 'Product already in wishlist' });
    }

    user.wishlist.push(new mongoose.Types.ObjectId(productId) as any);
    await user.save();

    res.status(201).json({ message: 'Product added to wishlist', wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// DELETE /api/wishlist/:productId — remove product from wishlist
router.delete('/:productId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.wishlist = user.wishlist.filter(id => id.toString() !== productId) as any;
    await user.save();

    res.json({ message: 'Product removed from wishlist', wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
