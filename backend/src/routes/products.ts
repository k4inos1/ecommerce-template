import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Types } from 'mongoose';
import { Product } from '../models/Product';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import { uploadImage } from '../services/cloudinary';

const router = Router();
const adminWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure Multer to store products in memory buffer for easy upload to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ─── PUBLIC ─────────────────────────────────────────────────────────────────

const CACHE = new Map<string, { data: any; exp: number }>();
const TTL = 60 * 1000; // 1 minute

// GET /api/products — only published products for the store
router.get('/', async (req: Request, res: Response) => {
  try {
    const { minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    const rawSearch = req.query.search;
    const rawCategory = req.query.category;
    const search = typeof rawSearch === 'string' ? rawSearch : undefined;
    const category = typeof rawCategory === 'string' ? rawCategory : undefined;
    const query: Record<string, any> = { published: true };

    if (search) query.$text = { $search: search };
    if (category && category !== 'All') query.category = category;
    
    // Price filtering
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Helper to clear cache
export const clearProductCache = () => CACHE.delete('products_base');

// GET /api/products/:id — public
router.get('/:id', publicReadLimiter, async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// GET /api/products/:id/related — products in same category (excluding self)
router.get('/:id/related', publicReadLimiter, async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      published: true,
    })
      .limit(4)
      .sort({ createdAt: -1 });
    res.json(related);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// ─── ADMIN ──────────────────────────────────────────────────────────────────

// GET /api/products/admin/all — ALL products (published + drafts) for admin panel
router.get('/admin/all', adminWriteLimiter, protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, published, page = 1, limit = 20 } = req.query;
    const query: Record<string, unknown> = {};

    const safeSearch = typeof search === 'string' ? search.trim() : '';
    const safeCategory = typeof category === 'string' ? category.trim() : '';

    if (safeSearch) query.$text = { $search: safeSearch };
    if (safeCategory && safeCategory !== 'All') query.category = safeCategory;
    if (published !== undefined) query.published = published === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// POST /api/products — admin: create manually (published: true by default for manual)
router.post('/', adminWriteLimiter, protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.create({ published: true, source: 'manual', ...req.body });
    clearProductCache();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err });
  }
});

// PUT /api/products/:id — admin: full update
router.put('/:id', adminWriteLimiter, protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    const body = req.body as Record<string, unknown>;
    const hasUnsafeKey = Object.keys(body).some((key) => key.startsWith('$') || key.includes('.'));
    if (hasUnsafeKey) {
      return res.status(400).json({ message: 'Invalid update payload' });
    }

    const isString = (v: unknown): v is string => typeof v === 'string';
    const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
    const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';
    const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((item) => typeof item === 'string');

    const safeUpdate: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(body, 'name')) {
      if (!isString(body.name)) return res.status(400).json({ message: 'Invalid name' });
      safeUpdate.name = body.name;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
      if (!isString(body.description)) return res.status(400).json({ message: 'Invalid description' });
      safeUpdate.description = body.description;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'price')) {
      if (!isNumber(body.price)) return res.status(400).json({ message: 'Invalid price' });
      safeUpdate.price = body.price;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'category')) {
      if (!isString(body.category)) return res.status(400).json({ message: 'Invalid category' });
      safeUpdate.category = body.category;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'image')) {
      if (!isString(body.image)) return res.status(400).json({ message: 'Invalid image' });
      safeUpdate.image = body.image;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'images')) {
      if (!isStringArray(body.images)) return res.status(400).json({ message: 'Invalid images' });
      safeUpdate.images = body.images;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'stock')) {
      if (!isNumber(body.stock)) return res.status(400).json({ message: 'Invalid stock' });
      safeUpdate.stock = body.stock;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'published')) {
      if (!isBoolean(body.published)) return res.status(400).json({ message: 'Invalid published value' });
      safeUpdate.published = body.published;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'source')) {
      if (!isString(body.source)) return res.status(400).json({ message: 'Invalid source' });
      safeUpdate.source = body.source;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'featured')) {
      if (!isBoolean(body.featured)) return res.status(400).json({ message: 'Invalid featured value' });
      safeUpdate.featured = body.featured;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'sizes')) {
      if (!isStringArray(body.sizes)) return res.status(400).json({ message: 'Invalid sizes' });
      safeUpdate.sizes = body.sizes;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'colors')) {
      if (!isStringArray(body.colors)) return res.status(400).json({ message: 'Invalid colors' });
      safeUpdate.colors = body.colors;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'tags')) {
      if (!isStringArray(body.tags)) return res.status(400).json({ message: 'Invalid tags' });
      safeUpdate.tags = body.tags;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'sku')) {
      if (!isString(body.sku)) return res.status(400).json({ message: 'Invalid sku' });
      safeUpdate.sku = body.sku;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'brand')) {
      if (!isString(body.brand)) return res.status(400).json({ message: 'Invalid brand' });
      safeUpdate.brand = body.brand;
    }

    const productId = req.params.id;
    if (!Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await Product.findByIdAndUpdate(productId, { $set: safeUpdate }, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    clearProductCache();
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err });
  }
});

// PATCH /api/products/:id/publish — toggle published state
router.patch('/:id/publish', adminWriteLimiter, protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { published } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { published: Boolean(published) },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    clearProductCache();
    res.json({ message: `Product ${published ? 'published' : 'unpublished'}`, product });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// DELETE /api/products/:id — admin
router.delete('/:id', adminWriteLimiter, protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    clearProductCache();
    res.json({ message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

/**
 * @route   POST /api/products/upload
 * @desc    Upload product image to Cloudinary (Admin only)
 * @access  Private/Admin
 */
router.post('/upload', adminWriteLimiter, protect, adminOnly, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const { url, public_id } = await uploadImage(req.file.buffer);
    
    res.status(200).json({
      message: 'Image uploaded successfully',
      url,
      public_id
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Error uploading to Cloudinary', error: err });
  }
});

// GET /api/products/admin/insights — admin: get market analysis and suppliers
router.get('/admin/insights', adminWriteLimiter, protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { query, category } = req.query;
    if (!query || !category) return res.status(400).json({ message: 'Missing query or category' });

    const { analyzeMarket } = await import('../services/marketAnalysis');
    const { findSuppliers } = await import('../services/supplierFinder');

    const analysis = analyzeMarket(query as string, category as string);
    const suppliers = findSuppliers(query as string, category as string);

    res.json({ analysis, suppliers });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
