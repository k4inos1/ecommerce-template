'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/ui/AdminLayout';
import { getToken } from '@/lib/api';
import { MessageSquare, Send, User, Search, Loader2, Bot } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Room {
  _id: string; lastMessage: string; lastTime: string; user?: { name: string; email: string };
}

export default function AdminSupport() {
  const router = useRouter();
  const token = getToken();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API}/api/support/rooms`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setRooms(data);
    } catch { console.error('Error fetching rooms'); }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/support/history/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMessages(data);
    } catch { console.error('Error fetching messages'); }
  };

  useEffect(() => {
    if (!token) { router.push('/admin/login'); return; }
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    fetchMessages(activeRoom);
    const interval = setInterval(() => fetchMessages(activeRoom), 4000);
    return () => clearInterval(interval);
  }, [activeRoom]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeRoom) return;
    const content = input; setInput(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/support/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, room: activeRoom })
      });
      if (res.ok) {
        const newMessage = await res.json(); setMessages(prev => [...prev, newMessage]);
      }
    } catch { console.error('Error sending'); }
    finally { setLoading(false); }
  };

  return (
    <AdminLayout title="Centro de Soporte">
      <div className="flex bg-[#0f0f1a] rounded-3xl border border-white/10 h-[700px] overflow-hidden">
        {/* Sidebar Rooms */}
        <div className="w-[300px] border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input placeholder="Buscar tickets..." className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
            {rooms.length === 0 ? (
              <div className="p-10 text-center text-xs text-gray-600">No hay chats activos</div>
            ) : rooms.map(r => (
              <button key={r._id} onClick={() => setActiveRoom(r._id)}
                className={`w-full p-4 text-left transition-colors hover:bg-white/[0.03] ${activeRoom === r._id ? 'bg-teal-600/10 border-l-2 border-teal-500' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white truncate max-w-[140px]">{r.user?.name || 'Invitado'}</span>
                  <span className="text-[10px] text-gray-500">{new Date(r.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{r.lastMessage}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white/[0.01]">
          {activeRoom ? (
            <>
              <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-600/20 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-tight">{rooms.find(r => r._id === activeRoom)?.user?.name || 'Invitado'}</h3>
                    <p className="text-[10px] text-gray-500">{rooms.find(r => r._id === activeRoom)?.user?.email || 'ID: ' + activeRoom}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Activo</span>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%]">
                      <div className={`p-4 rounded-3xl text-sm ${m.sender === 'admin' ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                        {m.content}
                      </div>
                      <div className={`text-[9px] text-gray-600 mt-1 uppercase font-bold tracking-widest ${m.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                        {m.sender === 'admin' ? 'Tú (Soporte)' : 'Cliente'} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="p-5 border-t border-white/5 bg-white/[0.02] flex gap-3">
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe una respuesta oficial..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors shadow-inner" />
                <button type="submit" disabled={loading || !input.trim()}
                  className="w-14 bg-teal-600 text-white rounded-2xl flex items-center justify-center hover:bg-teal-500 shadow-lg shadow-teal-900/40 disabled:opacity-50 transition-all active:scale-95">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40">
              <div className="w-20 h-20 bg-white/5 rounded-[40px] flex items-center justify-center mb-6 border border-white/5">
                <MessageSquare className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-display font-black text-white mb-2">Centro de Control de Soporte</h3>
              <p className="text-sm text-gray-500 max-w-xs">Selecciona un ticket de la izquierda para comenzar a asistir a tus clientes en tiempo real.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
