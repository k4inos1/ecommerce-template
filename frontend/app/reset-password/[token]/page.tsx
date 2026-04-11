'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { use } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Error de conexión');
      
      setSuccess(true);
      setMessage({ type: 'success', text: data.message });
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error restableciendo la contraseña' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[10%] w-[70%] h-[70%] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute -bottom-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-teal-900/20 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-[#0f0f1a]/80 backdrop-blur-xl outline outline-1 outline-white/10 p-8 rounded-[2rem] shadow-2xl">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 text-center">Nueva Contraseña</h1>
            <p className="text-zinc-400 text-center text-sm">
              Por favor, introduce tu nueva contraseña de acceso.
            </p>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {message.text}
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-[#161622] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full bg-[#161622] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:border-white/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[52px] mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Guardar Contraseña' 
                )}
              </button>
            </form>
          ) : (
            <div className="mt-6 flex flex-col justify-center items-center h-[160px]">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                 <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-zinc-400 text-sm">Redirigiendo al inicio de sesión...</p>
            </div>
          )}
          
        </div>
      </div>
    </main>
  );
}
