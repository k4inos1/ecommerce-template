'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { getToken } from '@/lib/api';
import { Plus, Pencil, Trash2, X, Check, Eye, EyeOff, TrendingUp, ExternalLink } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const CATEGORIES = ['Laptops', 'Phones', 'Audio', 'Tablets', 'Wearables', 'Monitors', 'Accessories'];

interface Product {
  _id: string; name: string; description: string; price: number; stock: number;
  category: string; image: string; published: boolean; source?: string; sourceUrl?: string; supplierPrice?: number;
}

const EMPTY = { name: '', description: '', price: 0, stock: 0, category: '', image: '', published: true };

export default function AdminProducts() {
  const router = useRouter();
  const token = getToken();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const authH = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?published=${filter === 'published'}` : '';
      const res = await fetch(`${API}/api/products/admin/all${params}`, { headers: authH });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setProducts(data.products || []);
    } catch { setError('Error conectando al backend'); }
    finally { setLoading(false); }
  }, [filter, token]);

  useEffect(() => {
    if (!token) { router.push('/admin/login'); return; }
    fetchProducts();
  }, [fetchProducts]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); setError(''); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, category: p.category, image: p.image, published: p.published });
    setShowForm(true); setError(''); setInsights(null);
  };

  const fetchInsights = async () => {
    if (!form.name || !form.category) { setError('Nombre y categoría requeridos para análisis'); return; }
    setLoadingInsights(true); setInsights(null);
    try {
      const res = await fetch(`${API}/api/products/admin/insights?query=${encodeURIComponent(form.name)}&category=${encodeURIComponent(form.category)}`, { headers: authH });
      const data = await res.json();
      if (res.ok) setInsights(data);
      else throw new Error(data.message || 'Error al obtener insights');
    } catch (err: any) { setError(err.message); }
    finally { setLoadingInsights(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const url = editing ? `${API}/api/products/${editing._id}` : `${API}/api/products`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authH, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Error'); }
      await fetchProducts(); setShowForm(false);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleTogglePublish = async (p: Product) => {
    setToggling(p._id);
    try {
      const res = await fetch(`${API}/api/products/${p._id}/publish`, {
        method: 'PATCH', headers: authH, body: JSON.stringify({ published: !p.published }),
      });
      if (res.ok) setProducts(prev => prev.map(x => x._id === p._id ? { ...x, published: !p.published } : x));
    } catch { /* silent */ }
    finally { setToggling(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    setDeleting(id);
    try {
      await fetch(`${API}/api/products/${id}`, { method: 'DELETE', headers: authH });
      setProducts(prev => prev.filter(x => x._id !== id));
    } catch { setError('Error al eliminar'); }
    finally { setDeleting(null); }
  };

  const published = products.filter(p => p.published).length;
  const drafts = products.filter(p => !p.published).length;

  return (
    <AdminLayout title="Productos">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: products.length, color: 'text-white', filter: 'all' as const },
            { label: 'Publicados', value: published, color: 'text-green-400', filter: 'published' as const },
            { label: 'Borradores', value: drafts, color: 'text-yellow-400', filter: 'draft' as const },
          ].map(s => (
            <button key={s.label} onClick={() => setFilter(s.filter)}
              className={`card p-4 text-left transition-all ${filter === s.filter ? 'border-teal-500/40 bg-teal-500/5' : 'hover:border-white/10'}`}>
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            {filter === 'draft' && <span className="text-yellow-400">Solo borradores — actívalos para que aparezcan en la tienda</span>}
            {filter === 'published' && <span className="text-green-400">Solo publicados — visibles en la tienda</span>}
            {filter === 'all' && 'Todos los productos'}
          </p>
          <div className="flex gap-2">
            <Link href="/admin/import" className="btn-ghost text-xs flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Importar desde web
            </Link>
            <button onClick={openNew} className="btn-primary text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo Producto
            </button>
          </div>
        </div>

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-white/[0.07]">
                <h2 className="font-display font-bold text-white">{editing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {[
                  { label: 'Nombre', key: 'name', placeholder: 'MacBook Pro M3' },
                  { label: 'Descripción', key: 'description', placeholder: 'Descripción del producto...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                    <input required type="text" placeholder={f.placeholder}
                      value={String(form[f.key as keyof typeof form])}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="input" />
                  </div>
                ))}
                <ImageUploader value={form.image} onChange={url => setForm(p => ({ ...p, image: url }))} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Precio ($)</label>
                    <input required type="number" min="0" step="0.01" placeholder="999"
                      value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                      className="input" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Stock</label>
                    <input required type="number" min="0" placeholder="10"
                      value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))}
                      className="input" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Categoría</label>
                  <select required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input">
                    <option value="">Seleccionar...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Publish toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${form.published ? 'bg-green-500' : 'bg-gray-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.published ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <input type="checkbox" className="sr-only" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} />
                  <span className="text-sm text-gray-300">{form.published ? 'Publicado en la tienda' : 'Guardar como borrador'}</span>
                </label>
                {insights && (
                  <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-teal-500/10 pb-2">
                      <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Product Pro Insights</div>
                      <div className="text-[10px] text-gray-500">Score: <span className="text-white font-bold">{insights.analysis.opportunityScore}/100</span></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase mb-1">Costo Estimado</div>
                        <div className="text-sm text-white font-mono">${(insights.suppliers[0]?.unitPrice || 0).toFixed(2)} USD</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase mb-1">Margen Proyectado</div>
                        <div className="text-sm text-green-400 font-mono">
                          {form.price > 0 ? `${(((form.price - (insights.suppliers[0]?.unitPrice || 0)) / form.price) * 100).toFixed(1)}%` : '---'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] text-gray-500 uppercase mb-2">Proveedores Recomendados</div>
                      <div className="space-y-1.5">
                        {insights.suppliers.slice(0, 3).map((s: any, idx: number) => (
                          <a key={idx} href={s.alibabaUrl} target="_blank" rel="noopener noreferrer" 
                            className="flex items-center justify-between text-[11px] p-2 bg-white/[0.03] border border-white/[0.05] rounded-lg hover:border-teal-500/30 transition-colors">
                            <span className="text-gray-300 truncate max-w-[120px]">{s.name}</span>
                            <span className="text-teal-400 font-mono">${s.unitPrice}/ud</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {error && <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-xl">{error}</p>}
                <div className="flex gap-3 pt-2">
                  {!insights && (
                    <button type="button" onClick={fetchInsights} disabled={loadingInsights}
                      className="flex-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs py-3 rounded-xl hover:bg-teal-500/20 transition-all font-bold">
                      {loadingInsights ? 'Analizando...' : <><TrendingUp className="w-4 h-4 inline mr-1.5" /> Analizar con Product Pro</>}
                    </button>
                  )}
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-ghost text-sm py-3">Cancelar</button>
                  <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm py-3 disabled:opacity-50">
                    {saving ? 'Guardando...' : <><Check className="w-4 h-4 inline mr-1" />{editing ? 'Actualizar' : 'Crear'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-24"><div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" /></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.07] text-xs uppercase text-gray-600 font-mono bg-white/[0.02]">
                <tr>
                  <th className="p-4 text-left">Producto</th>
                  <th className="p-4 text-left">Categoría</th>
                  <th className="p-4 text-right">Precio</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Stock</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.image?.startsWith('http') ? (
                          <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-lg shrink-0">{p.image || '📦'}</div>
                        )}
                        <div>
                          <div className="font-medium text-white">{p.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.source && p.source !== 'manual' && (
                              <span className="text-[10px] text-gray-600 font-mono">{p.source}</span>
                            )}
                            {p.sourceUrl && (
                              <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer"
                                className="text-gray-600 hover:text-teal-400 transition-colors">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-teal-500/10 text-teal-400 text-xs rounded-lg border border-teal-500/20">{p.category}</span>
                    </td>
                    <td className="p-4 text-right font-mono text-white">${p.price.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      {/* Publish toggle */}
                      <button onClick={() => handleTogglePublish(p)} disabled={toggling === p._id}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${p.published ? 'bg-green-500' : 'bg-gray-700'}`}
                        title={p.published ? 'Publicado — clic para ocultar' : 'Borrador — clic para publicar'}>
                        <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${p.published ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-mono text-sm ${p.stock === 0 ? 'text-red-400' : p.stock < 5 ? 'text-yellow-400' : 'text-green-400'}`}>{p.stock}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-2 text-gray-600 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p._id)} disabled={deleting === p._id}
                          className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={6} className="p-16 text-center text-gray-600">
                    {filter === 'draft' ? 'No hay borradores. Importa productos desde' : 'No hay productos.'}{' '}
                    {filter === 'draft' && <Link href="/admin/import" className="text-teal-400 hover:underline">Importar</Link>}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
