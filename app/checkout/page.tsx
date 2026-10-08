'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProduct, naira } from '@/lib/products';
import { supabase } from '@/lib/supabase';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<{ id: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerName: '',
    email: '',
    phoneNumber: '',
    deliveryAddress: '',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
  });

  useEffect(() => {
    try {
      const storedCart = JSON.parse(localStorage.getItem('debest-cart') || '[]');
      setCart(storedCart);

      const savedForm = JSON.parse(localStorage.getItem('debest-checkout') || '{}');
      if (savedForm && typeof savedForm === 'object') {
        setForm((prev) => ({ ...prev, ...savedForm }));
      }
    } catch (e) {
      console.error(e);
    }

    // Check if logged in user
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        if (data.user.email) {
          setForm((prev) => ({
            ...prev,
            email: prev.email || data.user.email || '',
            customerName: prev.customerName || data.user.user_metadata?.full_name || '',
          }));
        }
      }
    });
  }, []);

  const rows = cart.map((x) => ({ ...x, p: getProduct(x.id) })).filter((x) => x.p);
  const total = rows.reduce((s, x) => s + (x.p ? x.p.price * x.quantity : 0), 0);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (rows.length === 0) {
      setError('Your cart is empty. Please add items before checking out.');
      return;
    }

    setLoading(true);

    try {
      // Save form preference locally
      localStorage.setItem('debest-checkout', JSON.stringify(form));

      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          deliveryAddress: form.deliveryAddress,
          city: form.city,
          state: form.state,
          country: form.country,
          items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('Paystack authorization URL missing');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during checkout');
      setLoading(false);
    }
  }

  if (rows.length === 0) {
    return (
      <main className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h1>Checkout</h1>
        <p style={{ margin: '20px 0', color: '#666' }}>Your cart is empty.</p>
        <Link href="/" className="btn btn-primary">
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: '40px 0' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Checkout</h1>
      <p style={{ color: '#666', marginBottom: 30 }}>Enter your delivery details to proceed to secure Paystack payment.</p>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 14, borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40 }}>
        <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Delivery Information</h2>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="customerName" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Full Name *
            </label>
            <input
              id="customerName"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              required
              placeholder="e.g. Jane Doe"
              style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="jane@example.com"
                style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8 }}
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Phone Number *
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                required
                placeholder="08012345678"
                style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="deliveryAddress" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Delivery Address *
            </label>
            <textarea
              id="deliveryAddress"
              name="deliveryAddress"
              value={form.deliveryAddress}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Street address, house number, area"
              style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div>
              <label htmlFor="city" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>City *</label>
              <input
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8 }}
              />
            </div>
            <div>
              <label htmlFor="state" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>State *</label>
              <input
                id="state"
                name="state"
                value={form.state}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8 }}
              />
            </div>
            <div>
              <label htmlFor="country" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Country</label>
              <input
                id="country"
                name="country"
                value={form.country}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8 }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 16,
              background: '#0f766e',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Initializing Paystack...' : `Pay ${naira(total)} with Paystack`}
          </button>
        </form>

        {/* Summary sidebar */}
        <aside style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb', height: 'fit-content' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Order Summary</h2>
          <div style={{ borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 16 }}>
            {rows.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.p?.name}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {naira(item.p?.price || 0)} x {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>
                  {naira((item.p?.price || 0) * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}>
            <span>Total</span>
            <span style={{ color: '#0f766e' }}>{naira(total)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}