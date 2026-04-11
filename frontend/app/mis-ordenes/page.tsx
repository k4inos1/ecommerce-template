'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Clock, CheckCircle, Truck, XCircle, AlertCircle, ArrowRight, ShoppingBag } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pendiente',   color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20', icon: <Clock className="w-3.5 h-3.5" /> },
  processing: { label: 'Procesando',  color: 'text-blue-400 bg-blue-400/10 border-blue-500/20',       icon: <AlertCircle className="w-3.5 h-3.5" /> },
  shipped:    { label: 'En camino',   color: 'text-teal-400 bg-teal-400/10 border-teal-500/20',  icon: <Truck className="w-3.5 h-3.5" /> },
  delivered:  { label: 'Entregado',   color: 'text-green-400 bg-green-400/10 border-green-500/20',    icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled:  { label: 'Cancelado',   color: 'text-red-400 bg-red-400/10 border-red-500/20',          icon: <XCircle className="w-3.5 h-3.5" /> },
};

const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered'];

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
    const name = localStorage.getItem('userName') || '';
    setUserName(name);
    if (!token) { router.push('/login?return=/mis-ordenes'); return; }

    fetch(`${API}/api/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { router.push('/login?return=/mis-ordenes'); return null; } return r.json(); })
      .then(d => { if (d) setOrders(Array.isArray(d) ? d : []); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Package className="w-7 h-7 text-teal-400" /> Mis Órdenes
          </h1>
          {userName && <p className="text-sm text-gray-500 mt-1">Hola, {userName}</p>}
        </div>
        <Link href="/products" className="btn-ghost text-sm">Seguir comprando <ArrowRight className="w-4 h-4" /></Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="font-semibold text-white mb-2">No tienes órdenes aún</h2>
          <p className="text-gray-500 text-sm mb-6">Cuando hagas tu primera compra, aparecerá aquí.</p>
          <Link href="/products" className="btn-primary">Explorar productos</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const statusIdx = STATUS_ORDER.indexOf(order.status);
            const isExpanded = expanded === order._id;

            return (
              <div key={order._id} className="card overflow-hidden">
                {/* Header */}
                <button onClick={() => setExpanded(isExpanded ? null : order._id)}
                  className="w-full flex flex-wrap items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-gray-500">#{String(order._id).slice(-8).toUpperCase()}</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="text-sm text-white">{order.items?.length || 0} producto{(order.items?.length || 0) !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-teal-400 font-bold font-mono">${(order.totalAmount || 0).toFixed(2)}</div>
                  <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <Link href={`/orders/${order._id}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium whitespace-nowrap">
                    Ver detalle →
                  </Link>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-white/[0.05] bg-white/[0.01]">
                    {/* Progress bar (only if not cancelled) */}
                    {order.status !== 'cancelled' && statusIdx >= 0 && (
                      <div className="px-5 pt-5 pb-3">
                        <div className="flex items-center gap-0">
                          {STATUS_ORDER.map((s, i) => {
                            const done = i <= statusIdx;
                            const active = i === statusIdx;
                            return (
                              <div key={s} className="flex items-center flex-1 last:flex-none">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? 'bg-teal-500 border-teal-500' : 'bg-transparent border-gray-700'}`}>
                                  {done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <div className={`text-[10px] mt-5 absolute translate-y-3 -translate-x-3 whitespace-nowrap ${active ? 'text-teal-400 font-semibold' : done ? 'text-gray-400' : 'text-gray-600'}`}
                                  style={{ position: 'relative', marginLeft: '-8px' }}>
                                  {STATUS_CONFIG[s]?.label}
                                </div>
                                {i < STATUS_ORDER.length - 1 && (
                                  <div className={`flex-1 h-0.5 mx-1 ${i < statusIdx ? 'bg-teal-500' : 'bg-gray-800'}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Shipping address */}
                    {order.shippingAddress && (
                      <div className="px-5 py-3 border-t border-white/[0.04]">
                        <div className="text-[10px] text-gray-600 uppercase font-mono mb-1.5">Dirección de envío</div>
                        <div className="text-sm text-gray-300">
                          {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.country}
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="px-5 py-3 border-t border-white/[0.04]">
                      <div className="text-[10px] text-gray-600 uppercase font-mono mb-3">Productos</div>
                      <div className="space-y-2">
                        {(order.items || []).map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div className="w-9 h-9 rounded-lg bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                              {item.image?.startsWith('http') ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span>📦</span>}
                            </div>
                            <div className="flex-1 text-gray-300 text-xs">{item.name} <span className="text-gray-600">×{item.quantity}</span></div>
                            <div className="text-white font-mono text-xs">${(item.price * item.quantity).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between font-bold text-sm mt-4 pt-3 border-t border-white/[0.04]">
                        <span className="text-gray-400">Total</span>
                        <span className="text-teal-400">${(order.totalAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
