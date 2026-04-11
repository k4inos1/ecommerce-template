'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrders, getProducts, getToken } from '@/lib/api';
import { Package, ShoppingCart, LayoutDashboard, LogOut, TrendingUp, Zap, MessageSquare, Ticket, Users, CreditCard } from 'lucide-react';

export function AdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
    { href: '/admin/analytics', icon: <TrendingUp className="w-4 h-4" />, label: 'Analytics' },
    { href: '/admin/products', icon: <Package className="w-4 h-4" />, label: 'Productos' },
    { href: '/admin/orders', icon: <ShoppingCart className="w-4 h-4" />, label: 'Órdenes' },
    { href: '/admin/payments', icon: <CreditCard className="w-4 h-4" />, label: 'Pagos' },
    { href: '/admin/coupons', icon: <Ticket className="w-4 h-4" />, label: 'Cupones' },
    { href: '/admin/users', icon: <Users className="w-4 h-4" />, label: 'Usuarios' },
    { href: '/admin/support', icon: <MessageSquare className="w-4 h-4" />, label: 'Soporte' },
    { href: '/admin/import', icon: <Zap className="w-4 h-4" />, label: 'Importar' },
  ];

  return (
    <div className="flex min-h-screen bg-[#0c1216]">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="text-lg font-black text-white">🛍️ <span className="text-teal-300">Tech</span>Store</div>
          <div className="text-xs text-slate-500 mt-0.5">Panel de Administración</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                {item.icon} {item.label}
              </div>
              {item.label === 'Soporte' && (
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="border-b border-white/10 bg-slate-900/40 px-8 py-4">
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
