import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Types } from 'mongoose';
import { Order } from '../models/Order';
import { protect, AuthRequest } from '../middleware/auth';
import { createTransbankTransaction, confirmTransbankTransaction } from '../services/payment';

const router = Router();

// Payment endpoints — rate-limited to prevent brute-force and abuse
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes de pago. Espera un momento e intenta de nuevo.' },
});

// POST /api/transbank/create — Initiate WebPay Plus transaction
router.post('/create', paymentLimiter, protect, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, totalAmount } = req.body;
    if (!totalAmount) return res.status(400).json({ message: 'No amount provided' });

    const origin = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:3000';
    const returnUrl = `${origin}/checkout/transbank-result`;

    const result = await createTransbankTransaction({
      totalAmount,
      orderId: orderId || String(Date.now()),
      userId: req.user!.id,
      returnUrl,
    });

    // Store the transbank token in the order
    if (orderId) {
      if (typeof orderId !== 'string' || !Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid orderId' });
      }
      await Order.findByIdAndUpdate(orderId, { webpayToken: result.token, paymentMethod: 'webpay' });
    }

    res.json({ token: result.token, url: result.url });
  } catch (err: unknown) {
    console.error('Transbank create error:', err);
    res.status(500).json({ message: 'WebPay error', error: String(err) });
  }
});

// POST /api/transbank/confirm — Called by frontend after redirect back from WebPay
router.post('/confirm', paymentLimiter, protect, async (req: AuthRequest, res: Response) => {
  try {
    const { token_ws } = req.body;
    if (typeof token_ws !== 'string' || token_ws.trim() === '') {
      return res.status(400).json({ message: 'Invalid token_ws' });
    }

    const result = await confirmTransbankTransaction(token_ws);

    if (result.success) {
      // Payment approved — find order by token and mark as processing
      await Order.findOneAndUpdate(
        { webpayToken: { $eq: token_ws } },
        { status: 'processing', paidAt: new Date() }
      );
      res.json({ success: true, response: result.response });
    } else {
      res.json({ success: false, response_code: (result.response as Record<string, unknown>).response_code });
    }
  } catch (err) {
    console.error('Transbank confirm error:', err);
    res.status(500).json({ message: 'Confirmation error', error: String(err) });
  }
});

export default router;
