'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ShieldAlert, ArrowLeft } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Error de conexión');
      
      setMessage({ type: 'success', text: data.message });
      setEmail('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error enviando el correo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[10%] w-[70%] h-[70%] rounded-full bg-teal-900/20 blur-[120px]" />
        <div className="absolute -bottom-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-900/20 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-[#0f0f1a]/80 backdrop-blur-xl outline outline-1 outline-white/10 p-8 rounded-[2rem] shadow-2xl">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 mb-6">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 text-center">Recuperar Contraseña</h1>
            <p className="text-zinc-400 text-center text-sm">
              Ingresa tu correo electrónico y te enviaremos un enlace seguro para restablecer tu contraseña.
            </p>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-[#161622] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all hover:border-white/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-teal-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[52px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Enviar Enlace de Recuperación'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Volver al Inicio de Sesión
            </Link>
          </div>
          
        </div>
      </div>
    </main>
  );
}
