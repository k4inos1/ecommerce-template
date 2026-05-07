import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';

function AdminRoute() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  return <AdminPanel />;
}

export default AdminRoute;
