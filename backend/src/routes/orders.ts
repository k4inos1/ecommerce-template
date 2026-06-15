import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Order } from '../models/Order';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';
import { sendOrderConfirmation } from '../services/email';
import { User } from '../models/User';
import { Coupon } from '../models/Coupon';
import { Notification } from '../models/Notification';

const router = Router();

const orderStatusUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many status update requests, please try again later.' },
});

// POST /api/orders - Create order (authenticated users)
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount, discountAmount, couponCode } = req.body;
    if (!items?.length) return res.status(400).json({ message: 'No order items' });

    const calculatedTotal = totalAmount || items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0
    );

    const order = await Order.create({
      user: req.user!.id,
      items,
      totalAmount: calculatedTotal,
      discountAmount: discountAmount || 0,
      couponCode: couponCode || undefined,
      shippingAddress,
      paymentMethod: paymentMethod || 'card',
    });

    // Increment coupon usedCount if a coupon was applied
    if (couponCode) {
      Coupon.findOneAndUpdate(
        { code: (couponCode as string).toUpperCase() },
        { $inc: { usedCount: 1 } }
      ).catch(() => { /* non-blocking */ });
    }

    // Send confirmation email async (don't block response)
    try {
      const user = await User.findById(req.user!.id).select('email name');
      if (user?.email) {
        sendOrderConfirmation({
          to: user.email,
          customerName: user.name || shippingAddress?.name || 'Cliente',
          orderId: String(order._id),
          items,
          totalAmount: calculatedTotal,
          shippingAddress,
        }).catch(e => console.warn('Email failed:', e.message));
      }
    } catch { /* silent */ }

    // Create in-app notification for new order
    Notification.create({
      user: req.user!.id,
      type: 'order_placed',
      title: '🎉 Pedido recibido',
      message: `Tu pedido #${String(order._id).slice(-6).toUpperCase()} ha sido recibido y está pendiente de confirmación.`,
      orderId: order._id,
    }).catch(() => { /* non-blocking */ });

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err });
  }
});

// GET /api/orders/my - Current user's orders
router.get('/my', protect, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ user: req.user!.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// GET /api/orders/:id - Order detail
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only owner or admin can see the order
    if (String(order.user) !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

const STATUS_LABELS: Record<string, { title: string; message: string }> = {
  processing: { title: '📦 Pedido en proceso', message: 'Tu pedido está siendo preparado.' },
  shipped: { title: '🚚 Pedido enviado', message: 'Tu pedido está en camino.' },
  delivered: { title: '✅ Pedido entregado', message: '¡Tu pedido ha sido entregado!' },
  cancelled: { title: '❌ Pedido cancelado', message: 'Tu pedido ha sido cancelado.' },
};

// PATCH /api/orders/:id/status - Admin: update order status
router.patch('/:id/status', orderStatusUpdateLimiter, protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Create in-app notification for the order owner
    const label = STATUS_LABELS[status];
    if (label && order.user) {
      Notification.create({
        user: order.user,
        type: 'order_status',
        title: label.title,
        message: `${label.message} Orden #${String(order._id).slice(-6).toUpperCase()}`,
        orderId: order._id,
      }).catch(() => { /* non-blocking */ });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// GET /api/orders - Admin: all orders
router.get('/', protect, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
