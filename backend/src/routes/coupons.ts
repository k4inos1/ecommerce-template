import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Coupon } from '../models/Coupon';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();

const adminCouponsWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const couponValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

// POST /api/coupons/validate — validate a coupon code against a cart total
router.post('/validate', protect, couponValidationLimiter, async (req: AuthRequest, res: Response) => {
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
router.post('/', adminCouponsWriteLimiter, protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err: any) {
    const msg = err?.code === 11000 ? 'Ya existe un cupón con ese código' : 'Datos inválidos';
    res.status(400).json({ message: msg, error: err });
  }
});

// PATCH /api/coupons/:id — update coupon (toggle active, change discount, etc.)
router.patch('/:id', adminCouponsWriteLimiter, protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const allowedFields = [
      'code',
      'type',
      'discount',
      'minOrderAmount',
      'maxUses',
      'usedCount',
      'active',
      'expiresAt',
    ] as const;

    const body = req.body as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (!Object.prototype.hasOwnProperty.call(body, field)) continue;

      const value = body[field];

      if (field === 'code' || field === 'type') {
        if (typeof value !== 'string') {
          return res.status(400).json({ message: `Invalid type for ${field}` });
        }
        updateData[field] = field === 'code' ? value.toUpperCase().trim() : value.trim();
        continue;
      }

      if (
        field === 'discount' ||
        field === 'minOrderAmount' ||
        field === 'maxUses' ||
        field === 'usedCount'
      ) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          return res.status(400).json({ message: `Invalid type for ${field}` });
        }
        updateData[field] = value;
        continue;
      }

      if (field === 'active') {
        if (typeof value !== 'boolean') {
          return res.status(400).json({ message: `Invalid type for ${field}` });
        }
        updateData[field] = value;
        continue;
      }

      if (field === 'expiresAt') {
        if (
          !(
            typeof value === 'string' ||
            typeof value === 'number' ||
            value instanceof Date
          )
        ) {
          return res.status(400).json({ message: `Invalid type for ${field}` });
        }
        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: `Invalid date for ${field}` });
        }
        updateData[field] = parsedDate;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
      context: 'query',
    });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err });
  }
});

// DELETE /api/coupons/:id — delete coupon
router.delete('/:id', adminCouponsWriteLimiter, protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
