import { Suspense } from 'react';
import AdminImportClient from './AdminImportClient';

export default function AdminImportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Cargando...</div>}>
      <AdminImportClient />
    </Suspense>
  );
}
