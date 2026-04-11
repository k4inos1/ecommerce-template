'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null; // We might need to store this on login

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  // Polling for new messages
  useEffect(() => {
    if (!isOpen || !token || !userId) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API}/api/support/history/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) { console.error('Chat error:', err); }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 4000);
    return () => clearInterval(interval);
  }, [isOpen, token, userId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !token || !userId) return;

    const content = input;
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/support/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ content, room: userId })
      });
      if (res.ok) {
        const newMessage = await res.json();
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (err) { console.error('Send error:', err); }
    finally { setLoading(false); }
  };

  if (!token) return null; // Only for logged-in users

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      {/* Bubble */}
      <button onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'bg-white text-slate-900 rotate-90' : 'bg-teal-500 text-white shadow-teal-900/40'}`}>
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[350px] h-[500px] bg-[#0f151a] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
            <h3 className="font-bold flex items-center gap-2">
              <Bot className="w-5 h-5" /> Soporte TechStore
            </h3>
            <p className="text-[10px] text-teal-100 opacity-80 mt-1 uppercase tracking-widest font-bold">Respuesta en tiempo real</p>
          </div>

          {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/[0.02] custom-scrollbar">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-500">¿Tienes alguna duda técnica?<br/>Envíanos un mensaje.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.sender === 'admin' ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-teal-500 text-white rounded-tr-none'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white/[0.03] border-t border-white/5 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe tu mensaje..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors" />
            <button type="submit" disabled={loading || !input.trim()}
              className="w-10 h-10 bg-teal-500 text-white rounded-xl flex items-center justify-center hover:bg-teal-400 disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
