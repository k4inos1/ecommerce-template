'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, ArrowRight, Package } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function TransbankResultContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token_ws = params.get('token_ws');
  const TBK_TOKEN = params.get('TBK_TOKEN');
  const TBK_ORDEN_COMPRA = params.get('TBK_ORDEN_COMPRA');
  const TBK_ID_SESION = params.get('TBK_ID_SESION');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'cancelled'>('loading');

  useEffect(() => {
    // 1. User clicked "Anular" on WebPay page (returns TBK_TOKEN but NO token_ws)
    if (TBK_TOKEN && !token_ws) {
      setStatus('cancelled');
      return;
    }

    // 2. Normal flow: token_ws is present
    if (token_ws) {
      const confirmPayment = async () => {
        try {
          const auth = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
          const res = await fetch(`${API}/api/transbank/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
            body: JSON.stringify({ token_ws }),
          });
          const data = await res.json();
          if (data.success && data.response.response_code === 0) {
            setStatus('success');
          } else {
            setStatus('error');
          }
        } catch (err) {
          console.error(err);
          setStatus('error');
        }
      };
      confirmPayment();
    } else {
      // No tokens at all
      setStatus('error');
    }
  }, [token_ws, TBK_TOKEN]);

  if (status === 'loading') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-8" />
        <h1 className="text-2xl font-bold text-white mb-3">Confirmando pago...</h1>
        <p className="text-gray-400">Por favor no cierres esta ventana.</p>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-8">
          <XCircle className="w-10 h-10 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Pago Cancelado</h1>
        <p className="text-gray-400 mb-8">Cancelaste el proceso de pago en WebPay.</p>
        <button onClick={() => router.push('/checkout')} className="btn-primary w-full">Volver al Checkout</button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Error en el Pago</h1>
        <p className="text-gray-400 mb-8">Tu banco rechazó la transacción o hubo un error de conexión con WebPay.</p>
        <button onClick={() => router.push('/checkout')} className="btn-primary w-full">Intentar nuevamente</button>
      </div>
    );
  }

  // Success
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-24 h-24 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-8">
        <CheckCircle className="w-12 h-12 text-green-400" />
      </div>
      <h1 className="text-3xl font-display font-bold text-white mb-3">¡Pago Exitoso con WebPay!</h1>
      <p className="text-gray-400 mb-8">Tu transacción fue aprobada. Prepararemos tu orden pronto.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/mis-ordenes" className="btn-primary">Ver mis órdenes <ArrowRight className="w-4 h-4" /></Link>
        <Link href="/products" className="btn-ghost">Seguir comprando</Link>
      </div>
    </div>
  );
}

export default function TransbankResultPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <TransbankResultContent />
    </Suspense>
  );
}
