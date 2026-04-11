'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Mail } from 'lucide-react';

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get('order_id') || '';
  const sessionId = params.get('session_id') || '';

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      {/* Icon */}
      <div className="w-24 h-24 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-8">
        <CheckCircle className="w-12 h-12 text-green-400" />
      </div>

      <h1 className="text-3xl font-display font-bold text-white mb-3">¡Pago Confirmado!</h1>
      <p className="text-gray-400 mb-2">Tu orden fue procesada y guardada exitosamente.</p>

      {orderId && (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs font-mono text-gray-400 mb-6">
          <Package className="w-3.5 h-3.5" />
          Orden #{orderId.slice(-8).toUpperCase()}
        </div>
      )}

      <div className="card p-5 mb-8 text-left space-y-3">
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-400" /></div>
          Pago procesado por Stripe
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center"><Mail className="w-4 h-4 text-teal-400" /></div>
          Email de confirmación enviado
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center"><Package className="w-4 h-4 text-purple-400" /></div>
          Seguimiento disponible en Mis Órdenes
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/mis-ordenes" className="btn-primary">
          Ver mis órdenes <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/products" className="btn-ghost">Seguir comprando</Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
