'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { getCoupons, createCoupon, deleteCoupon, updateCoupon } from '@/lib/api';
import { Plus, Trash2, Ticket, Calendar, Settings2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  discount: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    discount: 0,
    minOrderAmount: 0,
    maxUses: 0,
    expiresAt: '',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const data = await getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCoupon(formData);
      setShowAdd(false);
      setFormData({ code: '', type: 'percentage', discount: 0, minOrderAmount: 0, maxUses: 0, expiresAt: '' });
      fetchCoupons();
    } catch (err: any) {
      alert(err.message || 'Error al crear cupón');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este cupón?')) return;
    try {
      await deleteCoupon(id);
      setCoupons(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert('Error al eliminar cupón');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await updateCoupon(coupon._id, { active: !coupon.active });
      setCoupons(prev => prev.map(c => c._id === coupon._id ? { ...c, active: !c.active } : c));
    } catch (err) {
      alert('Error al actualizar cupón');
    }
  };

  return (
    <AdminLayout title="Gestión de Cupones">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-gray-400 text-sm">Crea y administra códigos de descuento para tus clientes.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-teal-900/20">
          <Plus className="w-4 h-4" /> Nuevo Cupón
        </button>
      </div>

      {showAdd && (
        <div className="card p-8 mb-8 border-teal-500/20 bg-teal-500/[0.02]">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-teal-400" /> Configurar Nuevo Cupón
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Código</label>
              <input 
                type="text" 
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 outline-none transition-all"
                placeholder="PROMO2025"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Tipo</label>
              <select 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 outline-none transition-all"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto Fijo ($)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Descuento</label>
              <input 
                type="number" 
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 outline-none transition-all"
                value={formData.discount}
                onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Min. Compra ($)</label>
              <input 
                type="number" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 outline-none transition-all"
                value={formData.minOrderAmount}
                onChange={e => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Usos Máximos (0 = ∞)</label>
              <input 
                type="number" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 outline-none transition-all"
                value={formData.maxUses}
                onChange={e => setFormData({ ...formData, maxUses: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Vencimiento</label>
              <input 
                type="date" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 outline-none transition-all"
                value={formData.expiresAt}
                onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
              />
              <Calendar className="absolute right-4 bottom-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                Cancelar
              </button>
              <button type="submit" className="px-8 py-2.5 rounded-xl text-sm font-bold bg-teal-600 text-white hover:bg-teal-500 transition-all shadow-lg shadow-teal-900/20">
                Guardar Cupón
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Obteniendo cupones...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="card p-20 text-center bg-white/[0.01]">
          <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Ticket className="w-8 h-8 text-gray-700" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No hay cupones activos</h2>
          <p className="text-gray-500 max-w-sm mx-auto">Crea tu primer código de descuento para incentivar las ventas.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {coupons.map((c) => (
            <div key={c._id} className="card p-5 group flex items-center justify-between border-white/[0.05] hover:border-teal-500/20 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-400">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xl font-mono font-black text-white">{c.code}</span>
                    <span className={`text-[10px] items-center gap-1.5 px-2 py-0.5 rounded-full border ${c.active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      {c.active ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {c.type === 'percentage' ? `${c.discount}% de descuento` : `$${c.discount.toLocaleString()} de descuento`}
                    <span className="mx-2 opacity-50">•</span>
                    Mínimo: ${c.minOrderAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right hidden md:block">
                  <div className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Uso</div>
                  <div className="text-sm font-bold text-white">
                    {c.usedCount} <span className="text-gray-600 font-medium">/ {c.maxUses === 0 ? '∞' : c.maxUses}</span>
                  </div>
                </div>
                <div className="text-right hidden lg:block">
                  <div className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Vencimiento</div>
                  <div className="text-sm font-bold text-white">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Nunca'}
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleActive(c)}
                  title={c.active ? 'Desactivar cupón' : 'Activar cupón'}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${c.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-600 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>
                  {c.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => handleDelete(c._id)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
