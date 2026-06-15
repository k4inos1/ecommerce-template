import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Review } from '../models/Review';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

const deleteReviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const createReviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/reviews/:productId — Get reviews for a product
router.get('/:productId', async (req, res: Response) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    res.json({ reviews, average: Math.round(avg * 10) / 10, count: reviews.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// POST /api/reviews/:productId — Create a review (authenticated)
router.post('/:productId', protect, createReviewLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ message: 'Rating and comment are required' });

    const existing = await Review.findOne({ product: req.params.productId, user: req.user!.id });
    if (existing) return res.status(400).json({ message: 'Ya dejaste una reseña para este producto' });

    const review = await Review.create({
      product: req.params.productId,
      user: req.user!.id,
      name: req.body.name || 'Usuario',
      rating: Number(rating),
      comment,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear reseña', error: err });
  }
});

// DELETE /api/reviews/:id — Admin can delete reviews
router.delete('/:id', protect, deleteReviewLimiter, async (req: AuthRequest, res: Response) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
