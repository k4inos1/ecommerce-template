'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrders, getToken, updateOrderStatus } from '@/lib/api';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { Search, MapPin, CreditCard, Filter, ChevronDown, Package } from 'lucide-react';

interface Order {
  _id: string;
  user?: { name: string; email: string };
  totalAmount: number;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  stripeSessionId?: string;
  shippingAddress?: { name?: string; street?: string; city?: string; region?: string; postal?: string; country?: string };
  items: { name: string; quantity: number; price: number; image?: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  processing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  shipped: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
  delivered: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', processing: 'Procesando', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
};

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch { router.push('/admin/login'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (!getToken()) { router.push('/admin/login'); return; } fetchOrders(); }, []);

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateOrderStatus(id, status);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    } catch { alert('Error al actualizar estado'); }
  };

  const filtered = orders.filter(o => {
    const s = search.toLowerCase();
    const matchSearch = o._id.toLowerCase().includes(s) || o.user?.email?.toLowerCase().includes(s) || o.user?.name?.toLowerCase().includes(s) || o.shippingAddress?.name?.toLowerCase().includes(s);
    const matchFilter = filter === 'all' || o.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <AdminLayout title="Gestión de Órdenes">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por ID, nombre o email..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors" />
        </div>
        <div className="relative shrink-0">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="appearance-none bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-300 focus:border-teal-500 outline-none cursor-pointer">
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-24"><div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No se encontraron órdenes</p>
          </div>
        ) : filtered.map(order => (
          <div key={order._id} className="card overflow-hidden bg-gray-900/50 border border-gray-800/60 hover:border-gray-700 transition-colors">
            <div className="p-5 flex flex-wrap items-center gap-4 cursor-pointer" onClick={() => setExpanded(expanded === order._id ? null : order._id)}>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white text-sm">{order.shippingAddress?.name || order.user?.name || 'Cliente'}</span>
                  <span className="text-xs text-gray-500 font-mono">#{order._id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="text-xs text-gray-400">{order.user?.email || 'Sin email'} · {new Date(order.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
                <CreditCard className="w-3.5 h-3.5" />
                <span className="capitalize">{order.paymentMethod || 'manual'}</span>
              </div>

              <div className="font-bold text-white font-mono shrink-0 w-24 text-right">
                ${(order.totalAmount || 0).toLocaleString()}
              </div>

              <div className="shrink-0 ml-auto md:ml-0" onClick={e => e.stopPropagation()}>
                <select value={order.status} onChange={e => handleStatus(order._id, e.target.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border border-current font-medium bg-transparent cursor-pointer appearance-none outline-none focus:ring-2 ring-teal-500/50 ${STATUS_COLORS[order.status || 'pending']}`}>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v} className="bg-gray-900 text-white">{l}</option>)}
                </select>
              </div>
            </div>

            {expanded === order._id && (
              <div className="border-t border-gray-800 p-6 bg-gray-900/80 grid md:grid-cols-2 gap-8">
                {/* Items */}
                <div>
                  <div className="text-xs text-gray-500 uppercase font-mono mb-4 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" /> Productos ({order.items?.length || 0})
                  </div>
                  <div className="space-y-3">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex gap-3 text-sm items-center">
                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden shrink-0 border border-gray-700/50">
                          {item.image?.startsWith('http') ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-gray-500">{item.image || '📦'}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-200 truncate">{item.name}</div>
                          <div className="text-gray-500 text-xs">Cant: {item.quantity} × ${(item.price || 0).toLocaleString()}</div>
                        </div>
                        <span className="text-white font-mono shrink-0">${((item.price || 0) * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-6">
                  {order.shippingAddress && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-mono mb-3 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" /> Envío
                      </div>
                      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-300">
                        <div className="text-white font-medium mb-1">{order.shippingAddress.name}</div>
                        <div>{order.shippingAddress.street}</div>
                        <div>{order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postal}</div>
                        <div className="text-gray-500 mt-1">{order.shippingAddress.country}</div>
                      </div>
                    </div>
                  )}

                  {(order.stripeSessionId || (order as any).webpayToken) && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-mono mb-3 flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5" /> Transacción
                      </div>
                      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Gateway</span>
                          <span className="text-gray-300 capitalize">{order.paymentMethod || 'Desconocido'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-2">
                          <span className="text-gray-500">ID Ref</span>
                          <span className="text-gray-400 font-mono truncate max-w-[200px]" title={order.stripeSessionId || (order as any).webpayToken}>
                            {order.stripeSessionId || (order as any).webpayToken}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
