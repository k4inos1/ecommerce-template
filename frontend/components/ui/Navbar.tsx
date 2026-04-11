'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, X, Sparkles, User, Package, LogOut, Heart, Bell, DollarSign } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useState, useEffect, useRef } from 'react';

export function Navbar() {
  const { items } = useCart();
  const { wishlistIds } = useWishlist();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { currency, setCurrency } = useCurrency();
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const name = localStorage.getItem('userName');
    const token = localStorage.getItem('userToken');
    if (name && token) setUserName(name);
    // Listen for login/logout events
    const handler = () => {
      const n = localStorage.getItem('userName');
      const t = localStorage.getItem('userToken');
      setUserName(n && t ? n : null);
    };
    window.addEventListener('storage', handler);
    window.addEventListener('authchange', handler);
    return () => { window.removeEventListener('storage', handler); window.removeEventListener('authchange', handler); };
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setUserName(null);
    setUserMenuOpen(false);
    window.dispatchEvent(new Event('authchange'));
  };

  const handleNotifOpen = () => {
    setNotifOpen(p => !p);
    setUserMenuOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/products', label: 'Productos' },
    { href: '/#categorias', label: 'Categorías' },
    { href: '/faq', label: 'Soporte' },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0b1116]/85 backdrop-blur-xl border-b border-white/[0.08]' : 'bg-transparent'}`}>
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-900/40 group-hover:bg-teal-400 transition-colors">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-base tracking-tight">TechStore</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Currency switcher */}
          <button
            onClick={() => setCurrency(currency === 'USD' ? 'CLP' : 'USD')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="Cambiar moneda"
          >
            <DollarSign className="w-3.5 h-3.5" />
            {currency}
          </button>

          {/* Cart */}
          <Link href="/cart" className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 hover:bg-white/10 hover:text-white transition-all">
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Carrito</span>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                {count}
              </span>
            )}
          </Link>

          {/* Notification bell (only when logged in) */}
          {userName && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleNotifOpen}
                className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                title="Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#0f151a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <span className="text-sm font-semibold text-white">Notificaciones</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-teal-300 hover:text-teal-200 transition-colors">
                        Marcar todas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Sin notificaciones</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <button
                          key={n._id}
                          onClick={() => { markRead(n._id); if (n.orderId) { setNotifOpen(false); window.location.href = '/mis-ordenes'; } }}
                          className={`w-full text-left px-4 py-3 border-b border-white/[0.04] hover:bg-white/5 transition-colors ${!n.read ? 'bg-teal-500/5' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            {!n.read && <span className="mt-1.5 w-2 h-2 bg-teal-500 rounded-full shrink-0" />}
                            <div className={!n.read ? '' : 'ml-4'}>
                              <p className={`text-xs font-semibold ${!n.read ? 'text-white' : 'text-slate-400'}`}>{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                              <p className="text-[10px] text-slate-600 mt-1">{new Date(n.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User menu */}
          {userName ? (
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-all">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline max-w-[100px] truncate">{userName.split(' ')[0]}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f151a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                    <User className="w-4 h-4 text-emerald-400" /> Mi Perfil
                  </Link>
                  <div className="h-px bg-white/[0.06]" />
                  <Link href="/mis-ordenes" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                    <Package className="w-4 h-4 text-teal-300" /> Mis Órdenes
                  </Link>
                  <div className="h-px bg-white/[0.06]" />
                  <Link href="/wishlist" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                    <Heart className="w-4 h-4 text-pink-400" />
                    Favoritos
                    {wishlistIds.size > 0 && (
                      <span className="ml-auto bg-pink-500/20 text-pink-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-pink-500/30">
                        {wishlistIds.size}
                      </span>
                    )}
                  </Link>
                  <div className="h-px bg-white/[0.06]" />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-all">
              <User className="w-4 h-4" /> Entrar
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0b1116]/95 backdrop-blur-xl border-b border-white/5 px-4 pb-4">
          {[...navLinks, ...(userName ? [{ href: '/profile', label: 'Mi Perfil' }, { href: '/mis-ordenes', label: 'Mis Órdenes' }, { href: '/wishlist', label: 'Favoritos' }] : [{ href: '/login', label: 'Iniciar Sesión' }])].map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="block py-3 text-sm text-slate-300 hover:text-white border-b border-white/5 last:border-0 transition-colors">
              {l.label}
            </Link>
          ))}
          {/* Currency toggle in mobile */}
          <button
            onClick={() => setCurrency(currency === 'USD' ? 'CLP' : 'USD')}
            className="block w-full text-left py-3 text-sm text-slate-300 hover:text-white border-b border-white/5 transition-colors"
          >
            <span className="inline-flex items-center gap-2"><DollarSign className="w-4 h-4 text-teal-300" /> Moneda: {currency}</span>
          </button>
          {userName && (
            <button onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="block w-full text-left py-3 text-sm text-red-400 transition-colors">
              Cerrar sesión
            </button>
          )}
        </div>
      )}
    </header>
  );
}
