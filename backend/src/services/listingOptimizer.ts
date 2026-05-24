/**
 * Listing Optimizer — ecommerce-product-pro skill
 * Generates: optimized title, bullet points, keywords, description, A+ content ideas
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
  Laptops: ['laptop', 'notebook', 'portable', 'gaming laptop', 'business laptop', 'ultrabook', 'lightweight', 'fast SSD', 'long battery', 'thin notebook', 'budget laptop', 'i7', 'Ryzen', 'RAM DDR5'],
  Phones: ['smartphone', 'unlocked phone', 'Android phone', '5G phone', 'camera phone', 'budget phone', 'flagship', 'dual SIM', 'long battery', 'gaming phone', 'AMOLED', 'fast charging'],
  Audio: ['wireless headphones', 'noise cancelling', 'earbuds', 'bluetooth headset', 'gaming headset', 'over ear', 'true wireless', 'audiophile', 'bass boosted', 'microphone', 'foldable'],
  Tablets: ['tablet', 'Android tablet', 'iPad alternative', '10 inch tablet', 'kids tablet', 'drawing tablet', 'stylus', 'HD display', 'quad core', 'portable screen', 'e-learning'],
  Wearables: ['smart watch', 'fitness tracker', 'health monitor', 'GPS watch', 'heart rate', 'waterproof', 'step counter', 'sleep tracker', 'AMOLED watch', 'band', 'calories'],
  Monitors: ['4K monitor', 'gaming monitor', 'USB-C monitor', 'curved monitor', 'IPS panel', '144Hz', 'ultrawide', 'portable monitor', 'OLED display', 'HDR', 'dual monitor'],
  Accessories: ['phone case', 'charging cable', 'USB hub', 'keyboard', 'mouse', 'webcam', 'stand', 'adapter', 'screen protector', 'bag', 'organizer'],
};

const APLUS_IDEAS: Record<string, string[]> = {
  Laptops: ['Comparativa de rendimiento vs la competencia', 'Diagrama de puertos y conectividad', 'Guía de compatibilidad con software', 'Video unboxing y setup'],
  Phones: ['Comparativa de cámara en condiciones reales', 'Gráfico de autonomía de batería', 'Cuadro de especificaciones técnicas', 'FAQ sobre garantía y reparaciones'],
  Audio: ['Curva de respuesta de frecuencia', 'Comparativa antes/después de noise cancelling', 'Compatibilidad con dispositivos', 'Instrucciones de emparejamiento'],
  Tablets: ['Casos de uso: trabajo, estudio, entretenimiento', 'Accesorios compatibles (stylus, teclado)', 'Tabla comparativa resolución/precio', 'Demo de rendimiento en apps'],
  Wearables: ['Visualización de datos de salud en la app', 'Tabla de resistencia al agua IP', 'Comparativa de duración de batería', 'Guía de configuración inicial'],
  Monitors: ['Test de calibración de colores sRGB/DCI-P3', 'Diagrama de conectividad (HDMI/DP/USB-C)', 'Comparativa Hz latencia para gaming', 'Setup ergonómico recomendado'],
  Accessories: ['Guía de compatibilidad universal', 'Video de instalación en 60 segundos', 'Tabla de materiales y durabilidad', 'Pack regalo: accesorios complementarios'],
};

function buildOptimizedTitle(name: string, category: string, keywords: string[]): string {
  const topKeyword = keywords[0] || category;
  const secondKeyword = keywords[1] || '';
  // Pattern: [Keyword] + [Product Name] + [Key Feature]
  const features: Record<string, string> = {
    Laptops: '- SSD Rápido, Batería Larga Duración',
    Phones: '- 5G, Cámara Pro, Carga Rápida',
    Audio: '- Cancelación de Ruido, Bluetooth 5.3',
    Tablets: '- Pantalla HD, Wi-Fi 6, Stylus Compatible',
    Wearables: '- GPS, Frecuencia Cardíaca, Impermeable',
    Monitors: '- 4K, HDR, Baja Latencia',
    Accessories: '- Universal, Premium, Garantía 1 Año',
  };
  return `${name} ${features[category] || ''} | ${topKeyword} ${secondKeyword}`.replace(/\s+/g, ' ').trim().substring(0, 200);
}

function buildBullets(name: string, category: string): string[] {
  const categoryBullets: Record<string, string[]> = {
    Laptops: [
      `🚀 RENDIMIENTO SUPERIOR: ${name} equipado con procesador de última generación para multitarea fluida y productividad máxima`,
      '🔋 BATERÍA DURADERA: Hasta 12 horas de uso continuo sin necesidad de conectarte a la corriente',
      '⚡ ALMACENAMIENTO VELOZ: SSD integrado para tiempos de carga hasta 3x más rápidos que HDD convencional',
      '🖥️ PANTALLA BRILLANTE: Display Full HD con colores vibrantes para trabajo, streaming y diseño',
      '✅ GARANTÍA Y SOPORTE: Viene con garantía del fabricante y soporte técnico disponible',
    ],
    Phones: [
      `📸 CÁMARA PROFESIONAL: ${name} captura fotos increíbles gracias a su sistema de cámaras multi-lente con IA`,
      '⚡ CARGA RÁPIDA: Batería de larga duración con carga rápida de 33W — 50% en solo 30 minutos',
      '📶 CONECTIVIDAD 5G: Navega a velocidades ultrarrápidas y lleva tu productividad al siguiente nivel',
      '🔒 DOBLE SIM: Compatible con dos SIMs simultáneas para separated personal y profesional',
      '✅ DESBLOQUEADO: Compatible con todos los operadores — úsalo con tu SIM actual sin restricciones',
    ],
    Audio: [
      `🎵 SONIDO PREMIUM: ${name} ofrece audio de alta fidelidad con controladores de 40mm para una experiencia envolvente`,
      '🔇 CANCELACIÓN DE RUIDO ACTIVA: Disfruta tu música sin interrupciones con ANC de última generación',
      '🔋 40 HORAS DE BATERÍA: Música ininterrumpida durante todo tu día de trabajo y más',
      '📱 MULTI-DISPOSITIVO: Conéctate a 2 dispositivos simultáneamente con Bluetooth 5.3 de bajo consumo',
      '🎤 MICRÓFONO HD: Llamadas cristalinas con reducción de ruido ambiental integrada',
    ],
    Tablets: [
      `📱 PANTALLA INMERSIVA: ${name} con display Full HD de alta resolución para contenido, trabajo y estudio`,
      '⚡ RENDIMIENTO FLUIDO: Procesador octa-core para apps, streaming y multitarea sin lag',
      '✏️ COMPATIBLE CON STYLUS: Ideal para tomar notas, dibujar y anotar documentos con precisión',
      '🔋 TODO DIA: Batería de larga duración para no preocuparte por el cargador en el día a día',
      '🌐 CONECTIVIDAD UNIVERSAL: Wi-Fi 6 + Bluetooth para conexión rápida con todos tus dispositivos',
    ],
    Wearables: [
      `❤️ MONITOR DE SALUD: ${name} con sensor de frecuencia cardíaca 24/7, SpO2 y análisis de sueño`,
      '🏃 GPS INTEGRADO: Rastrea tus rutas de running y ciclismo con precisión sin llevar el teléfono',
      '💧 RESISTENTE AL AGUA: Certificación IP68 para natación y lluvia sin preocupaciones',
      '🔋 7 DIAS DE BATERÍA: Úsalo toda la semana sin carga gracias a su gestión eficiente de energía',
      '📊 APP COMPLETA: Sincroniza con iOS y Android para ver historial completo de tus métricas',
    ],
    Monitors: [
      `🖥️ RESOLUCIÓN 4K: ${name} con panel IPS 4K UHD para una nitidez photorealistic en trabajo y gaming`,
      '🎮 144HZ GAMING: Movimiento ultrasuave con tecnología de 144Hz y tiempo de respuesta de 1ms',
      '🎨 COLORES PRECISOS: 99% sRGB y Delta E<2 para profesionales del diseño y fotografía',
      '🔌 CONECTIVIDAD COMPLETA: HDMI 2.1, DisplayPort 1.4 y USB-C con Power Delivery incluidos',
      '👁️ SIN FATIGA VISUAL: Tecnología anti-parpadeo y filtro de luz azul para uso prolongado',
    ],
    Accessories: [
      `✅ CALIDAD PREMIUM: ${name} fabricado con materiales de primera para máxima durabilidad y rendimiento`,
      '🔌 COMPATIBILIDAD UNIVERSAL: Diseñado para funcionar con todos los dispositivos y sistemas operativos',
      '⚡ PLUG & PLAY: Instalación inmediata sin drivers adicionales — conecta y úsalo al instante',
      '🛡️ GARANTÍA 1 AÑO: Cubierto ante defectos de fabricación con soporte prioritario en español',
      '📦 INCLUYE ACCESORIOS: Viene completo con todos los cables y adaptadores necesarios en la caja',
    ],
  };
  return categoryBullets[category] || categoryBullets['Accessories'];
}

export function optimizeListing(productName: string, category: string): ListingOptimization {
  const poolKeywords = KEYWORD_POOL[category] || KEYWORD_POOL['Accessories'];
  // Pick 8 relevant keywords
  const keywords = poolKeywords.slice(0, 8);
  const optimizedTitle = buildOptimizedTitle(productName, category, keywords);
  const bullets = buildBullets(productName, category);
  const aPlusIdeas = APLUS_IDEAS[category] || APLUS_IDEAS['Accessories'];

  const description = `${productName} es la opción ideal para quienes buscan calidad y rendimiento en la categoría de ${category.toLowerCase()}. Diseñado para satisfacer las exigencias del usuario moderno, combina características técnicas avanzadas con una experiencia de uso intuitiva. Compatible con los principales sistemas y marcas del mercado. Ideal como regalo o para uso personal y profesional. Envío con garantía de satisfacción.`;

  // Score based on title optimization and keyword presence
  const titleScore = Math.min(100, 60 + (optimizedTitle.length > 100 ? 20 : 0) + (keywords.some(k => optimizedTitle.toLowerCase().includes(k.toLowerCase())) ? 20 : 0));
  const seoScore = Math.round((titleScore * 0.4) + (bullets.length >= 5 ? 30 : 15) + (keywords.length >= 7 ? 30 : 15));

  const suggestions = [
    'Agrega entre 5 y 8 imágenes de alta resolución (mínimo 1000x1000px)',
    'Incluye video demostrativo de 30-90 segundos para aumentar conversión',
    'Solicita reseñas verificadas a tus primeros 10 compradores',
    keywords.length < 8 ? 'Agrega más palabras clave long-tail para mejorar SEO' : 'Tus palabras clave están bien optimizadas',
    'Responde todas las preguntas de clientes en menos de 24 horas',
  ];

  return { originalName: productName, category, optimizedTitle, bullets, keywords, description, aPlusIdeas, seoScore, titleScore, suggestions };
}
