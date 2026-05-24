import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './AdminPanel.css';

interface Order {
  id: string;
  customerName: string;
  customerAddress: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  paymentMethod: string;
  timestamp: number;
  status: string;
}

function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Load orders from localStorage (in a real app, this would be from Firebase)
    const savedOrders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    setOrders(savedOrders);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-CL');
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Panel de Administración</h1>
        <button onClick={handleLogout} className="logout-btn">
          Cerrar Sesión
        </button>
      </header>

      <div className="admin-content">
        <div className="filter-bar">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            Todas ({orders.length})
          </button>
          <button 
            className={filter === 'pending' ? 'active' : ''} 
            onClick={() => setFilter('pending')}
          >
            Pendientes ({orders.filter(o => o.status === 'pending').length})
          </button>
          <button 
            className={filter === 'completed' ? 'active' : ''} 
            onClick={() => setFilter('completed')}
          >
            Completadas ({orders.filter(o => o.status === 'completed').length})
          </button>
        </div>

        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <p className="no-orders">No hay órdenes para mostrar</p>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <h3>Orden #{order.id.substring(0, 8)}</h3>
                  <span className={`status-badge ${order.status}`}>
                    {order.status === 'pending' ? 'Pendiente' : 'Completada'}
                  </span>
                </div>
                <div className="order-details">
                  <p><strong>Cliente:</strong> {order.customerName}</p>
                  <p><strong>Dirección:</strong> {order.customerAddress}</p>
                  <p><strong>Pago:</strong> {order.paymentMethod}</p>
                  <p><strong>Fecha:</strong> {formatDate(order.timestamp)}</p>
                </div>
                <div className="order-items">
                  <h4>Productos:</h4>
                  <ul>
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.quantity}x {item.name} - {formatMoney(item.price * item.quantity)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="order-total">
                  <strong>Total: {formatMoney(order.total)}</strong>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
