'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { getToken } from '@/lib/api';
import {
  Search, Download, Calculator, TrendingUp, CheckCircle, XCircle,
  ExternalLink, BarChart2, Package, FileText, Star, Clock, Shield,
  GitCompare, History,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const CATEGORIES = ['Laptops', 'Phones', 'Audio', 'Tablets', 'Wearables', 'Monitors', 'Accessories'];
const COMP_COLOR: Record<string, string> = { low: 'text-green-400 bg-green-400/10 border-green-500/20', medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20', high: 'text-red-400 bg-red-400/10 border-red-500/20' };
const TABS = [
  { id: 'search', label: 'Buscar', icon: Search },
  { id: 'compare', label: 'Comparar', icon: GitCompare },
  { id: 'market', label: 'Mercado', icon: BarChart2 },
  { id: 'suppliers', label: 'Proveedores', icon: Package },
  { id: 'optimize', label: 'Optimizar', icon: FileText },
  { id: 'history', label: 'Historial', icon: History },
];
const TAB_IDS = new Set(TABS.map(tab => tab.id));
const normalizeTab = (value: string | null) => (value && TAB_IDS.has(value) ? value : 'search');

type ScraperEngine = 'aliexpress' | 'ebay';
type EngineMeta = { label: string; color: string; dot: string };

const ENGINE_META: Record<ScraperEngine, EngineMeta> = {
  aliexpress: { label: 'AliExpress', color: 'text-orange-400 bg-orange-400/10 border-orange-500/20', dot: 'bg-orange-400' },
  ebay:       { label: 'eBay',       color: 'text-blue-400 bg-blue-400/10 border-blue-500/20',     dot: 'bg-blue-400' },
};
const ENGINE_ENTRIES = Object.entries(ENGINE_META) as Array<[ScraperEngine, EngineMeta]>;

// Pre-computed reverse lookup: source (label or key) → ENGINE_META
const ENGINE_BY_SOURCE: Record<string, EngineMeta> = Object.fromEntries(
  ENGINE_ENTRIES.flatMap(([key, meta]) => [
    [key, meta],
    [meta.label.toLowerCase(), meta],
  ]),
);

export default function AdminImport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = getToken();
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Audio');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Engine selection (for "Buscar" tab)
  const [selectedEngines, setSelectedEngines] = useState<ScraperEngine[]>(['aliexpress', 'ebay']);

  // Search state
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState<string | null>(null);

  // Compare state
  const [compareResults, setCompareResults] = useState<any[]>([]);

  // Market state
  const [market, setMarket] = useState<any>(null);

  // Suppliers state
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Optimize state
  const [optimized, setOptimized] = useState<any>(null);
  const [optimizeName, setOptimizeName] = useState('');

  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Calculator state
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcProduct, setCalcProduct] = useState<any>(null);
  const [calcResult, setCalcResult] = useState<any>(null);

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const apiFetch = useCallback(async (url: string, method = 'GET', body?: object) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(url, { method, headers: authHeaders, ...(body ? { body: JSON.stringify(body) } : {}) });
      if (res.status === 401) { router.push('/admin/login'); return null; }
      const data = await res.json();
      if (!res.ok) { setError(data.message || data.error || `Error ${res.status}`); return null; }
      return data;
    } catch { setError('Error de conexión con el backend'); return null; }
    finally { setLoading(false); }
  }, [token]);

  const toggleEngine = (engine: ScraperEngine) => {
    setSelectedEngines(prev => {
      if (!prev.includes(engine)) return [...prev, engine];
      if (prev.length > 1) return prev.filter(e => e !== engine); // keep at least one
      return prev;
    });
  };

  const handleTabClick = (tabId: string) => {
    setTab(tabId);
    if (tabId === 'history' && !historyLoaded) handleHistory();
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === 'search') {
      params.delete('tab');
    } else {
      params.set('tab', tabId);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const enginesParam = selectedEngines.join(',');
    const data = await apiFetch(`${API}/api/scraper/search?q=${encodeURIComponent(query)}&limit=12&engines=${enginesParam}`);
    if (data) setSearchResults(data.products || []);
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const data = await apiFetch(`${API}/api/scraper/compare?q=${encodeURIComponent(query)}&limit=8`);
    if (data) setCompareResults(data.results || []);
  };

  const handleMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const data = await apiFetch(`${API}/api/scraper/market?q=${encodeURIComponent(query)}&category=${category}`);
    if (data) setMarket(data);
  };

  const handleSuppliers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const data = await apiFetch(`${API}/api/scraper/suppliers?q=${encodeURIComponent(query)}&category=${category}&count=6`);
    if (data) setSuppliers(data.suppliers || []);
  };

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optimizeName.trim()) return;
    const data = await apiFetch(`${API}/api/scraper/optimize?name=${encodeURIComponent(optimizeName)}&category=${category}`);
    if (data) setOptimized(data);
  };

  const handleHistory = useCallback(async () => {
    const data = await apiFetch(`${API}/api/scraper/history`);
    if (data) { setHistory(data.results || []); setHistoryLoaded(true); }
  }, [apiFetch]);

  useEffect(() => {
    const nextTab = normalizeTab(searchParams.get('tab'));
    setTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [searchParams]);

  useEffect(() => {
    if (tab === 'history' && !historyLoaded) handleHistory();
  }, [tab, historyLoaded, handleHistory]);

  const handleImport = async (p: any) => {
    setImporting(p.name);
    const data = await fetch(`${API}/api/scraper/import`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ name: p.name, price: p.price, image: p.image, description: p.description, category: p.category, stock: 20 }),
    });
    if (data.ok) setImported(prev => new Set([...prev, p.name]));
    setImporting(null);
  };

  const handleCalc = async (p: any) => {
    setCalcProduct(p); setCalcOpen(true); setCalcResult(null);
    const data = await apiFetch(`${API}/api/scraper/calculate`, 'POST', { sellingPrice: p.price, supplierCost: p.supplierPrice });
    if (data) setCalcResult(data);
  };

  // ── Shared search bar ──
  const SearchBar = ({ onSubmit, showEngines = false, placeholder = 'Ej: wireless headphones, smart watch...' }: { onSubmit: (e: React.FormEvent) => void; showEngines?: boolean; placeholder?: string }) => (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={placeholder}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:border-teal-500 focus:outline-none" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:border-teal-500 focus:outline-none">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" disabled={loading} className="btn-primary px-5 disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </form>
      {showEngines && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Motores:</span>
          {ENGINE_ENTRIES.map(([key, meta]) => (
            <button key={key} type="button" onClick={() => toggleEngine(key)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-all ${selectedEngines.includes(key) ? meta.color : 'text-gray-600 bg-transparent border-white/10'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${selectedEngines.includes(key) ? meta.dot : 'bg-gray-600'}`} />
              {meta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── Reusable product card ──
  const ProductCard = ({ p, showSource = false }: { p: any; showSource?: boolean }) => (
    <div className={`card p-4 flex flex-col gap-3 ${p.margin >= 30 ? '' : 'opacity-60'}`}>
      <div className="flex items-start gap-2">
        <div className="font-medium text-white text-sm leading-snug flex-1 line-clamp-2">{p.name}</div>
        {p.margin >= 30 ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
      </div>
      {showSource && p.source && (() => {
        const sourceKey = String(p.source).toLowerCase();
        const meta = ENGINE_BY_SOURCE[sourceKey] ?? null;
        return (
          <span className={`text-[10px] self-start px-2 py-0.5 rounded-full border ${meta ? meta.color : 'text-gray-400 bg-gray-400/10 border-gray-500/20'}`}>
            {p.source}
          </span>
        );
      })()}
      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2"><div className="text-gray-500 text-[10px]">Precio</div><div className="font-bold text-white">${p.price}</div></div>
        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2"><div className="text-gray-500 text-[10px]">Margen</div><div className={`font-bold ${p.margin >= 30 ? 'text-green-400' : 'text-red-400'}`}>{p.margin}%</div></div>
        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2"><div className="text-gray-500 text-[10px]">Demanda</div><div className={`font-bold ${p.demandScore >= 7 ? 'text-green-400' : p.demandScore >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{p.demandScore}/10</div></div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${COMP_COLOR[p.competitionLevel]}`}>{p.competitionLevel === 'low' ? '↓ Baja' : p.competitionLevel === 'medium' ? '→ Media' : '↑ Alta'} competencia</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">{p.category}</span>
        {p.trend === 'rising' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">📈 En alza</span>}
      </div>
      <div className="flex gap-2 mt-auto">
        <button onClick={() => handleCalc(p)} className="flex-1 btn-ghost text-xs py-2 gap-1"><Calculator className="w-3.5 h-3.5" /> Calcular</button>
        {p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>}
        {imported.has(p.name) ? (
          <div className="flex-1 flex items-center justify-center gap-1 text-xs text-green-400 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Importado</div>
        ) : (
          <button onClick={() => handleImport(p)} disabled={importing === p.name || p.margin < 30} className="flex-1 btn-primary text-xs py-2 disabled:opacity-40">
            {importing === p.name ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />} Importar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <AdminLayout title="Investigación de Productos">
      {/* Profit Calc Modal */}
      {calcOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold"><Calculator className="w-5 h-5 text-teal-400" /> Calculadora de Margen</div>
              <button onClick={() => { setCalcOpen(false); setCalcResult(null); }} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
            </div>
            {calcProduct && <div className="text-sm text-gray-400 truncate">{calcProduct.name} — Venta: ${calcProduct.price} / Proveedor: ${calcProduct.supplierPrice}</div>}
            {loading ? <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div> : null}
            {calcResult && (
              <div className="space-y-3">
                <div className={`text-sm px-3 py-2.5 rounded-xl border ${calcResult.isViable ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {calcResult.recommendation}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: 'Precio Venta', value: `$${calcResult.revenue}` },
                    { label: 'Costo Total', value: `$${calcResult.costs.total}` },
                    { label: 'Ganancia Neta', value: `$${calcResult.profit}`, h: true },
                    { label: 'Margen', value: `${calcResult.marginPercent}%`, h: true },
                    { label: 'ROI', value: `${calcResult.roi}%` },
                    { label: 'Fee Stripe', value: `$${calcResult.costs.paymentFee}` },
                  ].map(r => (
                    <div key={r.label} className={`rounded-xl p-3 ${r.h ? 'bg-teal-500/10 border border-teal-500/20' : 'bg-white/[0.03] border border-white/5'}`}>
                      <div className="text-[10px] text-gray-500">{r.label}</div>
                      <div className={`font-bold text-sm ${r.h ? 'text-teal-400' : 'text-white'}`}>{r.value}</div>
                    </div>
                  ))}
                </div>
                {calcResult.isViable && calcProduct && (
                  <button onClick={() => { handleImport(calcProduct); setCalcOpen(false); setCalcResult(null); }} className="w-full btn-primary text-sm">
                    <Download className="w-4 h-4" /> Importar al catálogo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => handleTabClick(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-teal-500 text-white shadow-lg shadow-teal-900/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {error && <div className="card p-4 text-yellow-400 text-sm border-yellow-500/20">⚠️ {error}</div>}

        {/* ══ SEARCH TAB ══ */}
        {tab === 'search' && (
          <div className="space-y-6">
            <div className="card p-4 flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-teal-300 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-400">Busca productos en los motores seleccionados. Solo puedes importar los que tengan <span className="text-green-400 font-medium">margen ≥ 30%</span> según el análisis.</div>
            </div>
            <SearchBar onSubmit={handleSearch} showEngines placeholder="Ej: wireless headphones, gaming chair..." />
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((p, i) => <ProductCard key={i} p={p} showSource />)}
              </div>
            )}
            {searchResults.length === 0 && !loading && (
              <div className="text-center py-16 text-gray-600"><Search className="w-10 h-10 mx-auto mb-3 opacity-30" /><div className="text-sm">Busca un producto para ver resultados y análisis</div></div>
            )}
          </div>
        )}

        {/* ══ COMPARE TAB ══ */}
        {tab === 'compare' && (
          <div className="space-y-6">
            <div className="card p-4 flex items-start gap-3">
              <GitCompare className="w-5 h-5 text-teal-300 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-400">
                Compara resultados de <span className="text-orange-400 font-medium">AliExpress</span> y <span className="text-blue-400 font-medium">eBay</span> en paralelo para el mismo producto. Ambos motores se consultan simultáneamente.
              </div>
            </div>
            <SearchBar onSubmit={handleCompare} placeholder="Ej: wireless headphones, smart watch..." />
            {compareResults.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {compareResults.map((engineResult: any) => {
                  const engineKey = engineResult.engine as ScraperEngine;
                  const meta = ENGINE_META[engineKey] || { label: engineResult.label, color: 'text-gray-400 bg-gray-400/10 border-gray-500/20', dot: 'bg-gray-400' };
                  return (
                    <div key={engineResult.engine} className="space-y-3">
                      {/* Engine header */}
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${meta.color}`}>
                        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        <span className="font-semibold text-sm">{engineResult.label}</span>
                        {engineResult.error ? (
                          <span className="ml-auto text-xs opacity-70">Error: {engineResult.error}</span>
                        ) : (
                          <span className="ml-auto text-xs opacity-70">{engineResult.products.length} resultados</span>
                        )}
                      </div>
                      {engineResult.products.length > 0 ? (
                        <div className="space-y-3">
                          {engineResult.products.map((p: any, i: number) => <ProductCard key={i} p={p} />)}
                        </div>
                      ) : (
                        <div className="card p-6 text-center text-gray-600 text-sm">
                          {engineResult.error ? '❌ Motor no disponible en este momento' : 'Sin resultados'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {compareResults.length === 0 && !loading && (
              <div className="text-center py-16 text-gray-600">
                <GitCompare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <div className="text-sm">Ingresa un producto para comparar precios entre AliExpress y eBay</div>
              </div>
            )}
          </div>
        )}

        {/* ══ MARKET ANALYSIS TAB ══ */}
        {tab === 'market' && (
          <div className="space-y-6">
            <SearchBar onSubmit={handleMarket} placeholder="Ej: wireless headphones, gaming laptop..." />
            {market && (
              <div className="space-y-5">
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Tamaño de Mercado', value: market.marketSize.value, sub: market.marketSize.unit, color: 'text-teal-400' },
                    { label: 'Crecimiento Anual', value: `${market.growthRate.annual}%`, sub: market.growthRate.label, color: market.growthRate.trend === 'rising' ? 'text-green-400' : market.growthRate.trend === 'stable' ? 'text-yellow-400' : 'text-red-400' },
                    { label: 'Puntuación Oportunidad', value: `${market.opportunityScore}/100`, sub: market.opportunityScore >= 80 ? 'Excelente' : market.opportunityScore >= 60 ? 'Buena' : 'Regular', color: market.opportunityScore >= 70 ? 'text-green-400' : 'text-yellow-400' },
                    { label: 'Categoría', value: market.category, sub: 'Nicho seleccionado', color: 'text-purple-400' },
                  ].map(c => (
                    <div key={c.label} className="card p-4">
                      <div className="text-xs text-gray-500 mb-1">{c.label}</div>
                      <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{c.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="card p-5">
                  <div className="text-xs text-gray-500 section-label mb-2">Resumen</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{market.summary}</p>
                  {market.sources?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/[0.05]">
                      <div className="text-[10px] text-gray-600 mb-1.5">Fuentes web consultadas:</div>
                      <div className="flex flex-wrap gap-2">
                        {market.sources.map((src: string, i: number) => (
                          <span key={i} className="text-[10px] text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full truncate max-w-[200px]">{src}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Seasonality chart */}
                <div className="card p-5">
                  <div className="section-label mb-4">Estacionalidad (Demanda mensual)</div>
                  <div className="flex items-end gap-1.5 h-24">
                    {market.seasonality.map((m: any) => (
                      <div key={m.shortMonth} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-sm transition-all" style={{ height: `${m.demandLevel * 10}%`, background: m.demandLevel >= 8 ? '#6366f1' : m.demandLevel >= 6 ? '#4f46e5' : '#312e81' }} />
                        <div className="text-[9px] text-gray-600">{m.shortMonth}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Demographics */}
                <div className="card p-5">
                  <div className="section-label mb-4">Demografía de Compradores</div>
                  <div className="space-y-3">
                    {market.demographics.map((d: any) => (
                      <div key={d.segment}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-white">{d.segment}</span>
                          <span className="text-teal-400 font-bold">{d.percentage}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5">
                          <div className="h-1.5 bg-teal-500 rounded-full" style={{ width: `${d.percentage}%` }} />
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{d.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Points */}
                <div className="card p-5">
                  <div className="section-label mb-4">Análisis de Precio</div>
                  <div className="space-y-2">
                    {market.pricePoints.map((p: any) => (
                      <div key={p.range} className="flex items-center gap-3">
                        <div className="w-24 text-xs font-mono text-gray-400">{p.range}</div>
                        <div className="flex-1 bg-white/5 rounded-full h-2">
                          <div className="h-2 rounded-full bg-teal-500" style={{ width: p.volume === 'high' ? '85%' : p.volume === 'medium' ? '50%' : '20%' }} />
                        </div>
                        <div className="text-xs text-gray-500 w-32">{p.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {!market && !loading && (
              <div className="text-center py-16 text-gray-600"><BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" /><div className="text-sm">Busca un nicho para ver análisis de mercado completo</div></div>
            )}
          </div>
        )}

        {/* ══ SUPPLIERS TAB ══ */}
        {tab === 'suppliers' && (
          <div className="space-y-6">
            <SearchBar onSubmit={handleSuppliers} placeholder="Ej: wireless headphones, USB hub..." />
            {suppliers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map((s, i) => (
                  <div key={i} className="card p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-white text-sm">{s.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{s.country} · {s.yearsActive} años activo</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {s.goldSupplier && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Gold</span>}
                        {s.verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20"><Shield className="w-2.5 h-2.5 inline" /> Verificado</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-center">
                      <div className="bg-white/[0.03] rounded-lg p-2"><div className="text-gray-500 text-[10px]">Precio Unit.</div><div className="font-bold text-green-400">${s.unitPrice}</div></div>
                      <div className="bg-white/[0.03] rounded-lg p-2"><div className="text-gray-500 text-[10px]">MOQ</div><div className="font-bold text-white">{s.moq} uds.</div></div>
                      <div className="bg-white/[0.03] rounded-lg p-2"><div className="text-gray-500 text-[10px]">Envío</div><div className="font-bold text-white">{s.shippingDays}d</div></div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-yellow-400"><Star className="w-3 h-3 fill-yellow-400" />{s.rating} ({s.reviewCount})</div>
                      <div className="flex items-center gap-1 text-gray-400"><Clock className="w-3 h-3" />{s.responseTime}</div>
                    </div>
                    {s.certifications.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {s.certifications.map((c: string) => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{c}</span>)}
                      </div>
                    )}
                    {s.sampleAvailable && (
                      <div className="text-xs text-teal-400">✓ Muestra disponible — ${s.samplePrice} USD</div>
                    )}
                    <a href={s.alibabaUrl} target="_blank" rel="noopener noreferrer"
                      className="w-full btn-ghost text-xs py-2 justify-center flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" /> Ver en Alibaba
                    </a>
                  </div>
                ))}
              </div>
            )}
            {suppliers.length === 0 && !loading && (
              <div className="text-center py-16 text-gray-600"><Package className="w-10 h-10 mx-auto mb-3 opacity-30" /><div className="text-sm">Busca un producto para encontrar proveedores en Alibaba</div></div>
            )}
          </div>
        )}

        {/* ══ OPTIMIZE TAB ══ */}
        {tab === 'optimize' && (
          <div className="space-y-6">
            <form onSubmit={handleOptimize} className="flex gap-3">
              <div className="relative flex-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input value={optimizeName} onChange={e => setOptimizeName(e.target.value)} placeholder="Nombre del producto a optimizar..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:border-teal-500 focus:outline-none" />
              </div>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:border-teal-500 focus:outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" disabled={loading} className="btn-primary px-5 disabled:opacity-50">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Optimizar'}
              </button>
            </form>

            {optimized && (
              <div className="space-y-5">
                {/* Scores */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="card p-4 text-center">
                    <div className="text-xs text-gray-500 mb-1">SEO Score</div>
                    <div className="text-3xl font-bold text-teal-400">{optimized.seoScore}</div>
                    <div className="text-xs text-gray-500">/100</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-xs text-gray-500 mb-1">Título Score</div>
                    <div className="text-3xl font-bold text-green-400">{optimized.titleScore}</div>
                    <div className="text-xs text-gray-500">/100</div>
                  </div>
                </div>

                {/* Optimized title */}
                <div className="card p-5">
                  <div className="section-label mb-2">Título Optimizado</div>
                  <p className="text-sm text-white leading-relaxed">{optimized.optimizedTitle}</p>
                </div>

                {/* Bullet points */}
                <div className="card p-5">
                  <div className="section-label mb-3">Bullet Points</div>
                  <ul className="space-y-2">
                    {optimized.bullets.map((b: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300 leading-relaxed pl-3 border-l-2 border-teal-500/30">{b}</li>
                    ))}
                  </ul>
                </div>

                {/* Keywords */}
                <div className="card p-5">
                  <div className="section-label mb-3">Palabras Clave ({optimized.keywords.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {optimized.keywords.map((k: string) => (
                      <span key={k} className="text-xs px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">{k}</span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="card p-5">
                  <div className="section-label mb-2">Descripción</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{optimized.description}</p>
                </div>

                {/* A+ Ideas */}
                <div className="card p-5">
                  <div className="section-label mb-3">Ideas de Contenido A+</div>
                  <ul className="space-y-2">
                    {optimized.aPlusIdeas.map((idea: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-teal-400 mt-0.5">{'✦'}</span>{idea}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggestions */}
                <div className="card p-5 border-yellow-500/10">
                  <div className="section-label mb-3">Sugerencias de Mejora</div>
                  <ul className="space-y-2">
                    {optimized.suggestions.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-yellow-400 mt-0.5">→</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {!optimized && !loading && (
              <div className="text-center py-16 text-gray-600"><FileText className="w-10 h-10 mx-auto mb-3 opacity-30" /><div className="text-sm">Ingresa el nombre de un producto para generar listing optimizado con SEO</div></div>
            )}
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}
        {tab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="card p-4 flex items-start gap-3 flex-1">
                <History className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
                <div className="text-xs text-gray-400">Registro de las últimas <span className="text-white font-medium">50 sesiones</span> de scraping guardadas en la base de datos.</div>
              </div>
              <button onClick={handleHistory} disabled={loading}
                className="ml-3 p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <History className="w-4 h-4" />}
              </button>
            </div>

            {loading && (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && historyLoaded && history.length === 0 && (
              <div className="text-center py-16 text-gray-600">
                <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <div className="text-sm">No hay sesiones de scraping guardadas aún</div>
              </div>
            )}

            {!loading && history.length > 0 && (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-white/[0.06]">
                      <th className="px-5 py-3 font-medium">Búsqueda</th>
                      <th className="px-5 py-3 font-medium">Fuente</th>
                      <th className="px-5 py-3 font-medium text-right">Productos</th>
                      <th className="px-5 py-3 font-medium text-right">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {history.map((h: any) => {
                      const sourceKey = String(h.source || '').toLowerCase();
                      const meta = ENGINE_BY_SOURCE[sourceKey] ?? null;
                      return (
                        <tr key={h._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 text-white font-medium">{h.query}</td>
                          <td className="px-5 py-3">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${meta ? meta.color : 'text-gray-400 bg-gray-400/10 border-gray-500/20'}`}>
                              {h.source || '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-teal-400 font-mono font-medium">{h.count}</td>
                          <td className="px-5 py-3 text-right text-gray-500 text-xs">
                            {new Date(h.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
