import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs for authentication routes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

router.use(authLimiter);

const signToken = (id: string, role: string) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (typeof email !== 'string') {
      return res.status(400).json({ message: 'Invalid email' });
    }
    const safeEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ email: safeEmail });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const user = await User.create({ name, email: safeEmail, password });
    
    // Send welcome email asynchronously so it doesn't block the response
    if (!safeEmail.includes('guest_')) {
      sendWelcomeEmail(safeEmail, name).catch(err => console.error('Failed to send welcome email:', err));
    }

    const token = signToken(String(user._id), user.role);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid credentials format' });
    }
    const safeEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: { $eq: safeEmail } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(String(user._id), user.role);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// ─── Password Recovery ────────────────────────────────────

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string') {
      return res.status(200).json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación.' });
    }
    const safeEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: { $eq: safeEmail } });
    
    // We send success even if user not found to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación.' });
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and save to DB
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    await user.save();

    // Create reset url (frontend)
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
      res.status(200).json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación.' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Error enviando el correo' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req: Request, res: Response) => {
  try {
    // Reconstruct the hash from the URL token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    // Set new password (the model's pre-save hook will hash it)
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// ─── Google OAuth ─────────────────────────────────────────

// Initiate Google Login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req: Request, res: Response) => {
    try {
      const user: any = req.user;
      const token = signToken(String(user._id), user.role);
      
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      // Redirect to frontend login page passing the JWT in the query string
      res.redirect(`${frontendUrl}/login?token=${token}`);
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=server_error`);
    }
  }
);

// ─── Facebook OAuth ───────────────────────────────────────

// Initiate Facebook Login
router.get('/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));

// Facebook Callback
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req: Request, res: Response) => {
    try {
      const user: any = req.user;
      const token = signToken(String(user._id), user.role);
      
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?token=${token}`);
    } catch (err) {
      console.error('Facebook callback error:', err);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=server_error`);
    }
  }
);

export default router;
