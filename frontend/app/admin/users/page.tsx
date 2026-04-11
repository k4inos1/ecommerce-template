'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { getUsers, updateUserRole } from '@/lib/api';
import { Users, Search, ShieldCheck, User as UserIcon, Loader2, Crown } from 'lucide-react';

interface AppUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  provider?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (user: AppUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`¿Cambiar rol de "${user.name}" a "${newRole}"?`)) return;
    setUpdating(user._id);
    try {
      const updated = await updateUserRole(user._id, newRole);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: updated.role } : u));
    } catch (err: any) {
      alert(err.message || 'Error al actualizar rol');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <AdminLayout title="Gestión de Usuarios">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Usuarios', value: users.length, icon: <Users className="w-5 h-5" />, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
          { label: 'Clientes', value: userCount, icon: <UserIcon className="w-5 h-5" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Admins', value: adminCount, icon: <ShieldCheck className="w-5 h-5" />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        ].map(stat => (
          <div key={stat.label} className="card p-5 flex items-center gap-4 border-white/[0.05]">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-teal-500/50 transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Cargando usuarios...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-20 text-center bg-white/[0.01]">
          <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-gray-700" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {search ? 'Sin resultados' : 'No hay usuarios'}
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            {search ? `No se encontraron usuarios que coincidan con "${search}".` : 'Los usuarios registrados aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden border-white/[0.05]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">Usuario</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest hidden lg:table-cell">Registro</th>
                <th className="text-center px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">Rol</th>
                <th className="text-center px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr key={user._id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm font-black shrink-0 ${user.role === 'admin' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-teal-500/10 border-teal-500/20 text-teal-400'}`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {user.name}
                          {user.role === 'admin' && <Crown className="w-3 h-3 text-amber-400" />}
                        </div>
                        <div className="text-xs text-gray-500 md:hidden">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400 hidden md:table-cell">{user.email}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${user.role === 'admin' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-teal-500/10 border-teal-500/20 text-teal-400'}`}>
                      {user.role === 'admin' ? <ShieldCheck className="w-2.5 h-2.5" /> : <UserIcon className="w-2.5 h-2.5" />}
                      {user.role === 'admin' ? 'Admin' : 'Cliente'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => handleRoleToggle(user)}
                      disabled={updating === user._id}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${user.role === 'admin' ? 'text-red-400 border-red-500/20 hover:bg-red-500/10' : 'text-teal-400 border-teal-500/20 hover:bg-teal-500/10'}`}
                    >
                      {updating === user._id ? '...' : user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-white/[0.04] text-xs text-gray-600">
            Mostrando {filtered.length} de {users.length} usuarios
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
