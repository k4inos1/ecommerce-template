'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, MapPin, Building, Globe, Mail, Shield, Save } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', postalCode: '', country: '', password: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { router.push('/login?return=/profile'); return; }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          if (res.status === 401) { localStorage.removeItem('userToken'); router.push('/login'); }
          throw new Error('Error');
        }
        const data = await res.json();
        setForm(p => ({ ...p, ...data, password: '' }));
      } catch (err) { setMessage({ type: 'error', text: 'No se pudo cargar el perfil.' }); } finally { setLoading(false); }
    };
    fetchProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage({ type: '', text: '' });
    try {
      const { email, ...updateData } = form; 
      const payload = updateData.password ? updateData : { ...updateData, password: undefined };
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('userToken')}` }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
      setForm({ ...form, password: '' });
    } catch (err) { setMessage({ type: 'error', text: 'Error al actualizar tu perfil.' }); } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 mt-16">
      <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
      <p className="text-slate-400 mb-8">Administra tu información personal y dirección de envío por defecto.</p>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900/50 outline outline-1 outline-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Datos Personales</h2>
            <div><label className="block text-sm font-medium mb-1">Nombre Completo</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" /><input type="text" name="name" value={form.name} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"/></div></div>
            <div><label className="block text-sm font-medium mb-1">Correo Electrónico <span className="text-slate-500 text-xs">(No modificable)</span></label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" /><input type="email" value={form.email} disabled className="w-full bg-black/30 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-slate-500 cursor-not-allowed"/></div></div>
            <div><label className="block text-sm font-medium mb-1">Teléfono</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" /><input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="+56 9 1234 5678" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"/></div></div>
            <div><label className="block text-sm font-medium mb-1">Cambiar Contraseña <span className="text-slate-500 text-xs">(Opcional)</span></label><div className="relative"><Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" /><input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Dejar en blanco para conservar actual" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"/></div></div>
          </div>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Dirección de Envío</h2>
            <div><label className="block text-sm font-medium mb-1">Dirección</label><div className="relative"><MapPin className="absolute left-3 top-3 text-slate-500 w-5 h-5" /><input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Calle, número, depto." className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"/></div></div>
            <div><label className="block text-sm font-medium mb-1">Ciudad</label><div className="relative"><Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" /><input type="text" name="city" value={form.city} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"/></div></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Cód. Postal</label><input type="text" name="postalCode" value={form.postalCode} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"/></div>
              <div><label className="block text-sm font-medium mb-1">País</label><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" /><input type="text" name="country" value={form.country} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"/></div></div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />} {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
