
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    localStorage.setItem('debest-checkout', JSON.stringify(form));
    router.push('/order-success');
  }

  return (
    <main className="container" style={{ padding: '40px 0' }}>
      <h1>Checkout</h1>
      <p>Enter your delivery details.</p>

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        {Object.entries(form).map(([key, value]) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label
              htmlFor={key}
              style={{ display: 'block', marginBottom: 6 }}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
            <input
              id={key}
              name={key}
              value={value}
              onChange={handleChange}
              required
              className="input"
              style={{ width: '100%', padding: 12 }}
            />
          </div>
        ))}

        <button type="submit" className="btn btn-primary">
          Continue
        </button>
      </form>
    </main>
  );
}