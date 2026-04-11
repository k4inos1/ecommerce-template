import type { Metadata } from 'next';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { Navbar } from '@/components/ui/Navbar';
import { SupportChat } from '@/components/ui/SupportChat';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: 'TechStore — Tecnología Premium',
  description: 'Los mejores productos tech con envío express, garantía extendida y pagos seguros.',
  keywords: 'laptops, phones, audio, tablets, wearables, tech, ecommerce',
  openGraph: {
    title: 'TechStore — Tecnología Premium',
    description: 'Los mejores productos tech con envío express, garantía extendida y pagos seguros.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <CurrencyProvider>
          <CartProvider>
            <WishlistProvider>
              <NotificationsProvider>
                <Navbar />
                <main className="relative z-10 pt-16">
                  {children}
                </main>

                {/* ── Footer ──────────────────────────────────────── */}
                <footer className="relative z-10 mt-16 border-t border-white/[0.06]">
                  <div className="max-w-6xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                      {/* Brand */}
                      <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="inline-flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-900/40">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-display font-bold text-white">TechStore</span>
                        </Link>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">
                          Tecnología confiable con garantía real, despacho rápido y soporte en español.
                        </p>
                      </div>

                      {/* Shop */}
                      <div>
                        <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-3">Tienda</p>
                        <ul className="space-y-2">
                          {[
                            { href: '/products', label: 'Todos los productos' },
                            { href: '/products?category=Laptops', label: 'Laptops' },
                            { href: '/products?category=Audio', label: 'Audio' },
                            { href: '/products?category=Phones', label: 'Teléfonos' },
                            { href: '/products?category=Tablets', label: 'Tablets' },
                            { href: '/products?category=Accessories', label: 'Accesorios' },
                          ].map(l => (
                            <li key={l.href}>
                              <Link href={l.href} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">{l.label}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Account */}
                      <div>
                        <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-3">Mi Cuenta</p>
                        <ul className="space-y-2">
                          {[
                            { href: '/login', label: 'Iniciar sesión' },
                            { href: '/register', label: 'Registrarse' },
                            { href: '/mis-ordenes', label: 'Mis órdenes' },
                            { href: '/wishlist', label: 'Lista de deseos' },
                            { href: '/profile', label: 'Mi perfil' },
                          ].map(l => (
                            <li key={l.label}>
                              <Link href={l.href} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">{l.label}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Support */}
                      <div>
                        <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-3">Soporte</p>
                        <ul className="space-y-2">
                          {[
                            { href: '/faq', label: 'Preguntas frecuentes' },
                            { href: '/returns', label: 'Política de devoluciones' },
                            { href: '/shipping', label: 'Envíos y plazos' },
                            { href: '/privacy', label: 'Privacidad' },
                            { href: '/terms', label: 'Términos de uso' },
                          ].map(l => (
                            <li key={l.label}>
                              <Link href={l.href} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">{l.label}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-[11px] text-slate-500">© {new Date().getFullYear()} TechStore. Todos los derechos reservados.</p>
                      <div className="flex items-center gap-4">
                        <span className="text-[11px] text-slate-500">Métodos de pago:</span>
                        <div className="flex gap-2 text-[10px] font-mono text-slate-500">
                          <span className="px-2 py-0.5 border border-white/10 rounded">VISA</span>
                          <span className="px-2 py-0.5 border border-white/10 rounded">MC</span>
                          <span className="px-2 py-0.5 border border-white/10 rounded">WEBPAY</span>
                          <span className="px-2 py-0.5 border border-white/10 rounded">STRIPE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </footer>

                <SupportChat />
              </NotificationsProvider>
            </WishlistProvider>
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
