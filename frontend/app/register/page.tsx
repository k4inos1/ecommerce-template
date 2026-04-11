'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const f = (key: keyof typeof form, v: string) => setForm(p => ({ ...p, [key]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrarse');

      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userName', data.user?.name || form.name);
      localStorage.setItem('userEmail', data.user?.email || form.email);
      if (data.user?.id) localStorage.setItem('userId', data.user.id);

      window.dispatchEvent(new Event('authchange'));
      const returnTo = new URLSearchParams(window.location.search).get('return') || '/';
      router.push(returnTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-5">
            <User className="w-7 h-7 text-teal-300" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Crear cuenta</h1>
          <p className="text-slate-400 text-sm mt-1">Regístrate para comprar en TechStore</p>
        </div>

        {/* Social Login */}
        <div className="space-y-3 mb-6">
          <a href={`${API}/api/auth/google`}
            className="flex items-center justify-center gap-3 w-full bg-white text-gray-900 font-medium py-3 rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar con Google
          </a>

          <a href={`${API}/api/auth/facebook`}
            className="flex items-center justify-center gap-3 w-full bg-[#1877F2] text-white font-medium py-3 rounded-xl hover:bg-[#1865ce] transition-colors shadow-sm border border-transparent">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continuar con Facebook
          </a>
        </div>

        <div className="relative flex items-center mb-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase font-medium">O usar el email</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Nombre completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input required value={form.name} onChange={e => f('name', e.target.value)}
                placeholder="Ricardo Sanhueza" type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input required value={form.email} onChange={e => f('email', e.target.value)}
                placeholder="correo@email.com" type="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input required value={form.password} onChange={e => f('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                type={showPass ? 'text' : 'password'} minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2 disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : (
              <>Crear Cuenta <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-teal-300 hover:underline font-medium">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
