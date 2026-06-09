import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { scrapeByEngines, compareEngines } from '../services/scraper';
import { enrichProductsWithCloudinary } from '../services/scraperCloudinary';
import { uploadImageFromUrl, isAllowedImageUrl } from '../services/cloudinaryService';
import { calculateProfit } from '../utils/profitCalculator';
import { analyzeMarket } from '../services/marketAnalysis';
import { findSuppliers } from '../services/supplierFinder';
import { optimizeListing } from '../services/listingOptimizer';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';
import { Product } from '../models/Product';
import { ScrapedResult } from '../models/ScrapedResult';
import logger from '../utils/logger';

import {
  ScraperSearchParamsSchema,
  ScraperCompareParamsSchema,
  MarketAnalysisParamsSchema,
  SupplierFinderParamsSchema,
  ListingOptimizerParamsSchema,
  ProfitCalculatorBodySchema,
  ImportProductBodySchema,
  ScraperEngine,
  SCRAPER_ENGINES,
} from '../types/scraper';

const router = Router();

const scraperActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

const importRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit import attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many import requests, please try again later.' },
});

/**
 * ─────────────────────────────────────────────────────────────
 * RATE LIMITING
 * ─────────────────────────────────────────────────────────────
 * 
 * Scraping routes hit external web services. Rate limit to 10 req/min
 * per IP to prevent accidental abuse and protect against compromised
 * admin tokens.
 */
const scraperLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiadas solicitudes de scraping. Espera un momento e intenta de nuevo.',
  },
});

/**
 * ─────────────────────────────────────────────────────────────
 * UTILITY FUNCTIONS
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Parse and validate query parameters using Zod schema
 */
const parseQueryParams = <T>(schema: z.ZodSchema<T>, input: any): T => {
  return schema.parse(input);
};

/**
 * Handle Zod validation errors with detailed feedback
 */
const handleValidationError = (error: z.ZodError, res: Response) => {
  const formatted = error.errors.map((e) => ({
    field: e.path?.join('.') || 'unknown',
    message: e.message,
  }));
  logger.warn(`Validation error: ${JSON.stringify(formatted)}`);
  return res.status(400).json({
    message: 'Validation failed',
    errors: formatted,
  });
};

const parseEngines = (value?: string): ScraperEngine[] => {
  if (!value) return [...SCRAPER_ENGINES];
  const engines = value
    .split(',')
    .map((engine) => engine.trim())
    .filter((engine): engine is ScraperEngine =>
      SCRAPER_ENGINES.includes(engine as ScraperEngine)
    );
  return engines.length > 0 ? engines : [...SCRAPER_ENGINES];
};

/**
 * ─────────────────────────────────────────────────────────────
 * ENDPOINTS
 * ─────────────────────────────────────────────────────────────
 */

/**
 * GET /api/scraper/search
 * Search for products across multiple marketplaces with optional Cloudinary enrichment
 */
router.get(
  '/search',
  scraperLimiter,
  protect,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const params = parseQueryParams(ScraperSearchParamsSchema, req.query);

      logger.info(
        `📦 /search: query="${params.q}" limit=${params.limit}`
      );

      const engines = parseEngines(params.engines);
      let products = await scrapeByEngines(
        params.q,
        params.limit,
        engines
      );

      // Optionally enrich with Cloudinary images
      if (params.cloudinary && products.length > 0) {
        logger.info(`  ☁️  Uploading ${products.length} images to Cloudinary...`);
        try {
          const enriched = await enrichProductsWithCloudinary(
            products,
            'products/scraped'
          );
          products = enriched as any;
          logger.info(`  ✅ Cloudinary enrichment complete`);
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          logger.warn(`  ⚠️ Cloudinary enrichment failed: ${msg}`);
        }
      }

      // Persist to MongoDB (non-blocking)
      if (products.length > 0) {
        ScrapedResult.create({
          query: params.q,
          source: products[0].source,
          products,
          count: products.length,
        }).catch((e: Error) =>
          logger.warn(`MongoDB save failed: ${e.message}`)
        );
      }

      res.json({
        products,
        count: products.length,
        cloudinaryEnriched: params.cloudinary,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }

      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`/search failed: ${msg}`);
      res.status(500).json({
        message: 'Scraping failed',
        error: msg,
      });
    }
  }
);

/**
 * GET /api/scraper/compare
 * Compare prices across multiple marketplaces side-by-side
 */
router.get(
  '/compare',
  scraperLimiter,
  protect,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const params = parseQueryParams(ScraperCompareParamsSchema, req.query);
      logger.info(`📊 /compare: query="${params.q}" limit=${params.limit}`);
      const results = await compareEngines(params.q, params.limit);
      res.json({ results, query: params.q });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`/compare failed: ${msg}`);
      res.status(500).json({ message: 'Comparison scraping failed', error: msg });
    }
  }
);

/**
 * GET /api/scraper/market
 * Analyze market size, growth rate, seasonality
 */
router.get(
  '/market',
  scraperLimiter,
  protect,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const params = parseQueryParams(MarketAnalysisParamsSchema, req.query);
      logger.info(
        `📈 /market: query="${params.q}" category="${params.category}"`
      );
      const analysis = await analyzeMarket(params.q ?? '', params.category ?? 'Accessories');
      res.json(analysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`/market failed: ${msg}`);
      res.status(500).json({ message: 'Market analysis failed', error: msg });
    }
  }
);

/**
 * GET /api/scraper/suppliers
 * Find suppliers on Alibaba
 */
router.get(
  '/suppliers',
  scraperLimiter,
  protect,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const params = parseQueryParams(SupplierFinderParamsSchema, req.query);
      logger.info(
        `🏭 /suppliers: query="${params.q}" category="${params.category}"`
      );
      const suppliers = await findSuppliers(
        params.q ?? '',
        params.category ?? 'Accessories',
        params.count ?? 6,
      );
      res.json({ suppliers, count: suppliers.length });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`/suppliers failed: ${msg}`);
      res.status(500).json({ message: 'Supplier scraping failed', error: msg });
    }
  }
);

/**
 * GET /api/scraper/optimize
 * Generate SEO-optimized product title and bullets
 */
router.get('/optimize', scraperLimiter, protect, adminOnly, (req: AuthRequest, res: Response) => {
  try {
    const params = parseQueryParams(ListingOptimizerParamsSchema, req.query);
    logger.debug(`✨ /optimize: name="${params.name}" category="${params.category}"`);
    const result = optimizeListing(params.name ?? '', params.category ?? 'Accessories');
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleValidationError(error, res);
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`/optimize failed: ${msg}`);
    res.status(400).json({ message: 'Optimization failed', error: msg });
  }
});

/**
 * POST /api/scraper/calculate
 * Calculate profit margins and ROI
 */
router.post(
  '/calculate',
  scraperActionLimiter,
  protect,
  adminOnly,
  (req: AuthRequest, res: Response) => {
    try {
      const body = parseQueryParams(ProfitCalculatorBodySchema, req.body);
      logger.debug(
        `💰 /calculate: selling=${body.sellingPrice} cost=${body.supplierCost}`
      );
      const result = calculateProfit(body);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`/calculate failed: ${msg}`);
      res.status(400).json({ message: 'Calculation failed', error: msg });
    }
  }
);

/**
 * POST /api/scraper/import
 * Save a scraped product as draft with optional Cloudinary upload
 */
router.post(
  '/import',
  importRateLimiter,
  protect,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const body = parseQueryParams(ImportProductBodySchema, req.body);
      logger.info(`📥 /import: name="${body.name}" price=${body.price}`);

      let finalImage = body.image || '';
      let cloudinaryPublicId = '';
      if (body.image && isAllowedImageUrl(body.image)) {
        try {
          logger.debug(`  Uploading image to Cloudinary...`);
          const uploaded = await uploadImageFromUrl(body.image, 'products/scraped');
          finalImage = uploaded.url;
          cloudinaryPublicId = uploaded.publicId;
          logger.debug(`  ☁️  Image uploaded: ${uploaded.publicId}`);
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          logger.warn(`  ⚠️ Cloudinary upload failed: ${msg}`);
        }
      }

      const product = await Product.create({
        name: body.name,
        price: body.price,
        image: finalImage,
        cloudinaryPublicId,
        description: body.description || '',
        category: body.category,
        stock: body.stock,
        published: false,
        source: body.source,
        sourceUrl: body.sourceUrl,
        supplierPrice: body.supplierPrice,
      });

      logger.info(`  ✅ Product imported as draft: ${product._id}`);

      res.status(201).json({
        message: 'Product saved as draft. Activate it from the admin panel.',
        product,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error, res);
      }
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`/import failed: ${msg}`);
      res.status(400).json({ message: 'Import failed', error: msg });
    }
  }
);

/**
 * GET /api/scraper/history
 * Retrieve past scraping sessions (last 50)
 */
router.get(
  '/history',
  scraperLimiter,
  protect,
  adminOnly,
  async (_req: AuthRequest, res: Response) => {
    try {
      logger.debug(`📜 /history: Fetching last 50 scraping sessions`);
      const results = await ScrapedResult.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select('query source count createdAt');
      res.json({ results });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`/history failed: ${msg}`);
      res.status(500).json({ message: 'Failed to fetch history', error: msg });
    }
  }
);

export default router;
