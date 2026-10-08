'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { naira } from '@/lib/products';
import { supabase } from '@/lib/supabase';

export default function OrdersPage() {
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setEmail(data.user.email);
        fetchOrders(data.user.email);
      }
    });
  }, []);

  async function fetchOrders(targetEmail: string) {
    if (!targetEmail.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(targetEmail.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchOrders(email);
  }

  return (
    <main className="container" style={{ padding: '50px 0', maxWidth: 900 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>My Orders</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Look up your stationery order history.</p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 36, maxWidth: 500 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          required
          style={{ flex: 1, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}
        />
        <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px 24px' }}>
          {loading ? 'Searching...' : 'Find Orders'}
        </button>
      </form>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 14, borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading orders...</div>
      ) : searched && orders.length === 0 ? (
        <div style={{ background: '#fff', padding: 40, borderRadius: 12, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ fontSize: 18, color: '#666', marginBottom: 16 }}>No orders found for <b>{email}</b>.</p>
          <Link href="/" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {orders.map((order) => (
            <div key={order.id} style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>Order #{order.id.slice(0, 8)}</span>
                  <span style={{ color: '#666', fontSize: 13, marginLeft: 12 }}>
                    {new Date(order.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                  </span>
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    background: order.status === 'paid' ? '#dcfce7' : '#fef3c7',
                    color: order.status === 'paid' ? '#15803d' : '#b45309',
                  }}
                >
                  {order.status}
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                {order.items?.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                    <span>
                      {item.product?.name || 'Stationery Item'} x {item.quantity}
                    </span>
                    <span style={{ fontWeight: 600 }}>{naira(Number(item.subtotal))}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 13, color: '#666' }}>
                  Delivery to: {order.delivery_address}, {order.city}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f766e' }}>
                  Total: {naira(Number(order.total_amount))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
