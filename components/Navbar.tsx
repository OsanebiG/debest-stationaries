'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadCart = () => {
      try {
        const c = JSON.parse(localStorage.getItem('debest-cart') || '[]');
        setCount(c.reduce((s: number, x: any) => s + (x.quantity || 0), 0));
      } catch (e) {
        console.error(e);
      }
    };

    loadCart();
    window.addEventListener('storage', loadCart);

    // Auth state check
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      window.removeEventListener('storage', loadCart);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <header style={{ borderBottom: '1px solid #e7e9ed', position: 'sticky', top: 0, zIndex: 20, background: '#fff' }}>
      <div className="container" style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#0f766e', textDecoration: 'none' }}>
          DEBEST Stationaries
        </Link>

        <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#334155', fontWeight: 600 }}>
            Shop
          </Link>
          <Link href="/orders" style={{ textDecoration: 'none', color: '#334155', fontWeight: 600 }}>
            My Orders
          </Link>
          <Link href="/cart" style={{ textDecoration: 'none', color: '#334155', fontWeight: 600, position: 'relative' }}>
            Cart {count > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: 12, marginLeft: 4, fontWeight: 700 }}>{count}</span>}
          </Link>

          {user ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>
                {user.email?.split('@')[0]}
              </span>
              <button onClick={handleSignOut} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>
                Sign Out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-secondary" style={{ padding: '8px 18px' }}>
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
