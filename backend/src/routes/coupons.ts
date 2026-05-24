import { Router, Response } from 'express';
import { Coupon } from '../models/Coupon';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

// POST /api/coupons/validate — validate a coupon code against a cart total
router.post('/validate', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) return res.status(400).json({ message: 'Código requerido' });

    const coupon = await Coupon.findOne({ code: (code as string).toUpperCase().trim() });
    if (!coupon || !coupon.active)
      return res.status(404).json({ message: 'Cupón inválido o inactivo' });

    if (coupon.expiresAt && coupon.expiresAt < new Date())
      return res.status(400).json({ message: 'El cupón ha expirado' });

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
      return res.status(400).json({ message: 'El cupón ya alcanzó su límite de usos' });

    if (cartTotal !== undefined && cartTotal < coupon.minOrderAmount)
      return res.status(400).json({
        message: `Monto mínimo de $${coupon.minOrderAmount} requerido para este cupón`,
      });

    const discountAmount =
      coupon.type === 'percentage'
        ? (cartTotal * coupon.discount) / 100
        : coupon.discount;

    res.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      discount: coupon.discount,
      discountAmount: Math.min(discountAmount, cartTotal ?? discountAmount),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

// GET /api/coupons — list all coupons
router.get('/', protect, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// POST /api/coupons — create coupon
router.post('/', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err: any) {
    const msg = err?.code === 11000 ? 'Ya existe un cupón con ese código' : 'Datos inválidos';
    res.status(400).json({ message: msg, error: err });
  }
});

// PATCH /api/coupons/:id — update coupon (toggle active, change discount, etc.)
router.patch('/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err });
  }
});

// DELETE /api/coupons/:id — delete coupon
router.delete('/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
