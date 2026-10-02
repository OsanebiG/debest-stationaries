
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signInWithGoogle() {
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function signInWithEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 420, margin: '60px auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        Sign in to DEBEST Stationaries
      </h1>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading}
        style={{
          width: '100%',
          padding: 14,
          border: '1px solid #ccc',
          borderRadius: 8,
          background: 'white',
          cursor: 'pointer',
          marginBottom: 20,
        }}
      >
        {loading ? 'Please wait...' : 'Continue with Google'}
      </button>

      <div style={{ textAlign: 'center', margin: '16px 0' }}>OR</div>

      <form onSubmit={signInWithEmail}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            display: 'block',
            width: '100%',
            padding: 12,
            margin: '8px 0 16px',
            border: '1px solid #ccc',
            borderRadius: 8,
          }}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            display: 'block',
            width: '100%',
            padding: 12,
            margin: '8px 0 16px',
            border: '1px solid #ccc',
            borderRadius: 8,
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 14,
            border: 'none',
            borderRadius: 8,
            background: '#087d70',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Sign in
        </button>
      </form>

      {error && (
        <p style={{ color: 'red', marginTop: 16 }}>{error}</p>
      )}
    </main>
  );
}