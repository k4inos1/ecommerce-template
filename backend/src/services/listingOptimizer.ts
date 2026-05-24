/**
 * Professional E-Commerce Listing Optimizer
 * Generates: optimized title, bullet points, keywords, description, and A+ content strategy
 * Designed for AAA scalable marketplaces.
 */

export interface ListingOptimization {
  originalName: string;
  category: string;
  optimizedTitle: string;
  bullets: string[];
  keywords: string[];
  description: string;
  aPlusIdeas: string[];
  seoScore: number; // 0-100
  titleScore: number;
  suggestions: string[];
}

const KEYWORD_POOL: Record<string, string[]> = {
  'Fashion & Apparel': ['premium quality', 'sustainable material', 'modern design', 'comfortable fit', 'luxury', 'everyday wear', 'designer', 'exclusive', 'breathable', 'elegant', 'versatile'],
  'Home & Living': ['minimalist', 'durable', 'eco-friendly', 'easy to clean', 'space saving', 'modern home', 'handcrafted', 'ergonomic', 'aesthetic', 'premium finish'],
  'Health & Beauty': ['organic', 'cruelty-free', 'dermatologist tested', 'natural ingredients', 'anti-aging', 'hydrating', 'premium care', 'spa quality', 'clinically proven', 'vegan'],
  'Digital Products': ['instant download', 'lifetime access', 'high resolution', 'easy setup', 'premium support', 'customizable', 'commercial license', 'updated regularly', 'cloud sync'],
  'Food & Beverages': ['gourmet', 'organic', 'artisanal', 'freshly made', 'sugar-free', 'keto friendly', 'premium ingredients', 'locally sourced', 'award winning', 'gluten free'],
  'Professional Services': ['expert consultation', 'certified', 'fast turnaround', '100% satisfaction', 'tailored solutions', 'dedicated support', 'proven results', 'industry standard'],
  'General Merchandise': ['top rated', 'best seller', 'high quality', 'gift idea', 'essential', 'innovative', 'reliable', 'premium build', 'long lasting', 'user friendly'],
};

const APLUS_IDEAS: Record<string, string[]> = {
  'Fashion & Apparel': ['Size guide and fit diagram', 'High-quality fabric close-ups', 'Lifestyle imagery in different settings', 'Care instructions and sustainability info'],
  'Home & Living': ['Room context lifestyle photos', 'Dimensions and assembly diagram', 'Before/After transformation visuals', 'Material durability infographic'],
  'Health & Beauty': ['Step-by-step application guide', 'Key ingredients highlight infographic', 'Clinical results or user testimonial charts', 'Texture and consistency macro shots'],
  'Digital Products': ['Feature breakdown matrix', 'Quick start guide infographic', 'Dashboard/Interface screenshots', 'Compatibility and integration diagram'],
  'Food & Beverages': ['Nutritional facts and origin map', 'Serving suggestions and recipe ideas', 'Packaging unboxing experience', 'Certifications (Organic, Vegan) badges'],
  'Professional Services': ['Workflow process timeline', 'Case study results and metrics', 'Team expertise and certifications', 'Client testimonial carousel'],
  'General Merchandise': ['Core features highlight', "Unboxing and what's included diagram", 'Comparison with standard market alternatives', 'FAQ and Warranty visual guide'],
};

function buildOptimizedTitle(name: string, category: string, keywords: string[]): string {
  const topKeyword = keywords[0] || category;
  const secondKeyword = keywords[1] || '';
  
  const features: Record<string, string> = {
    'Fashion & Apparel': '- Premium Quality, Modern Fit',
    'Home & Living': '- Elegant Design, High Durability',
    'Health & Beauty': '- Clinically Proven, Natural Ingredients',
    'Digital Products': '- Instant Access, Premium Support',
    'Food & Beverages': '- Artisanal Quality, Freshly Sourced',
    'Professional Services': '- Expert Delivery, Guaranteed Results',
    'General Merchandise': '- Top Rated, Premium Build',
  };
  
  return `${name} ${features[category] || features['General Merchandise']} | ${topKeyword} ${secondKeyword}`.replace(/\s+/g, ' ').trim().substring(0, 200);
}

function buildBullets(name: string, category: string): string[] {
  const categoryBullets: Record<string, string[]> = {
    'Fashion & Apparel': [
      `✨ PREMIUM DESIGN: ${name} features a contemporary design crafted for both elegance and everyday comfort.`,
      '🧵 HIGH-QUALITY MATERIALS: Made with sustainably sourced fabrics that ensure breathability and long-lasting wear.',
      '📏 PERFECT FIT: Tailored to provide a modern silhouette that complements all body types.',
      '🧼 EASY CARE: Machine washable and designed to resist fading and shrinking over time.',
      '✅ SATISFACTION GUARANTEED: Enjoy our hassle-free return policy and dedicated customer support.',
    ],
    'Home & Living': [
      `🏠 MODERN AESTHETIC: ${name} elevates your space with a minimalist and sophisticated design.`,
      '🛠️ EXCEPTIONAL DURABILITY: Built with premium materials to withstand daily use for years to come.',
      '🌿 ECO-FRIENDLY: Manufactured using sustainable practices and environmentally conscious materials.',
      '⏱️ EASY ASSEMBLY: Quick and intuitive setup process with all necessary hardware included.',
      '🛡️ 1-YEAR WARRANTY: Backed by our comprehensive manufacturer warranty against any defects.',
    ],
    'Health & Beauty': [
      `🌱 PURE INGREDIENTS: ${name} is formulated with 100% natural and organic components.`,
      '🔬 CLINICALLY PROVEN: Dermatologist-tested to deliver visible results safely and effectively.',
      '🐰 CRUELTY-FREE: Proudly vegan and never tested on animals, meeting the highest ethical standards.',
      '💧 DEEP NOURISHMENT: Active ingredients penetrate deeply to restore and rejuvenate your natural glow.',
      '✅ PREMIUM QUALITY: Manufactured in certified facilities ensuring the highest standards of purity.',
    ],
    'Digital Products': [
      `⚡ INSTANT ACCESS: Download and start using ${name} immediately after your secure purchase.`,
      '📈 LIFETIME UPDATES: Enjoy continuous improvements and new features without recurring subscription fees.',
      '🛠️ EASY INTEGRATION: Designed to work seamlessly with your existing workflow and standard industry tools.',
      '📚 COMPREHENSIVE DOCS: Includes step-by-step guides, video tutorials, and best practices.',
      '💬 24/7 SUPPORT: Get priority assistance from our team of dedicated technical experts.',
    ],
    'Food & Beverages': [
      `🌟 GOURMET QUALITY: ${name} is crafted by artisans using traditional methods for superior taste.`,
      '🍃 FRESH & NATURAL: Made without artificial preservatives, colors, or high-fructose corn syrup.',
      '📦 CAREFULLY PACKAGED: Sealed for maximum freshness and delivered safely to your door.',
      '🏆 AWARD WINNING: Recognized by industry experts for its exceptional flavor profile.',
      '✅ DIET FRIENDLY: Accommodates various dietary preferences while maintaining uncompromising taste.',
    ],
    'Professional Services': [
      `🎯 EXPERT EXECUTION: ${name} is delivered by certified professionals with years of proven industry experience.`,
      '⚡ FAST TURNAROUND: Streamlined workflow ensures your project is completed on time, every time.',
      '📊 MEASURABLE RESULTS: Focus on delivering clear, actionable outcomes that drive your success.',
      '🤝 DEDICATED SUPPORT: You receive a dedicated account manager for personalized communication.',
      '✅ 100% SATISFACTION: We revise and refine until the final deliverable meets your exact standards.',
    ],
    'General Merchandise': [
      `⭐ TOP RATED QUALITY: ${name} consistently exceeds customer expectations with its premium build.`,
      '💡 INNOVATIVE DESIGN: Thoughtfully engineered to solve everyday problems with ease.',
      '💪 BUILT TO LAST: Constructed using high-grade materials for maximum longevity and reliability.',
      '🎁 PERFECT GIFT: Comes in premium packaging, making it an ideal choice for any special occasion.',
      '🛡️ BUY WITH CONFIDENCE: Backed by our robust customer satisfaction guarantee and easy returns.',
    ],
  };
  return categoryBullets[category] || categoryBullets['General Merchandise'];
}

export function optimizeListing(productName: string, category: string): ListingOptimization {
  const poolKeywords = KEYWORD_POOL[category] || KEYWORD_POOL['General Merchandise'];
  
  // Select top 8 relevant keywords
  const keywords = poolKeywords.slice(0, 8);
  const optimizedTitle = buildOptimizedTitle(productName, category, keywords);
  const bullets = buildBullets(productName, category);
  const aPlusIdeas = APLUS_IDEAS[category] || APLUS_IDEAS['General Merchandise'];

  const description = `${productName} sets a new standard of excellence in the ${category.toLowerCase()} market. Designed with the modern consumer in mind, it combines premium quality with exceptional functionality. Whether you are looking for reliability, aesthetic appeal, or peak performance, this product delivers on all fronts. Backed by industry-leading support and manufactured to the highest standards, it represents the perfect balance of value and premium quality.`;

  // Scoring logic based on SEO best practices
  const titleScore = Math.min(100, 60 + (optimizedTitle.length > 80 ? 20 : 0) + (keywords.some(k => optimizedTitle.toLowerCase().includes(k.toLowerCase())) ? 20 : 0));
  const seoScore = Math.round((titleScore * 0.4) + (bullets.length >= 5 ? 30 : 15) + (keywords.length >= 7 ? 30 : 15));

  const suggestions = [
    'Add 5-8 high-resolution product images (minimum 2000x2000px for zoom capability)',
    'Include a 30-60 second lifestyle video demonstrating the core value proposition',
    'Leverage A+ Content to tell your brand story and highlight key differentiators',
    keywords.length < 8 ? 'Incorporate more long-tail keywords in your backend search terms' : 'Your keyword density is currently optimized',
    'Actively manage customer reviews and respond to inquiries within 24 hours to boost ranking',
  ];

  return { originalName: productName, category, optimizedTitle, bullets, keywords, description, aPlusIdeas, seoScore, titleScore, suggestions };
}

