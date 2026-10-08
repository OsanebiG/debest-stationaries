'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const orderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) {
      setError('Missing payment reference.');
      setLoading(false);
      return;
    }

    async function verifyPayment() {
      try {
        const query = new URLSearchParams({ reference: reference! });
        if (orderId) query.set('orderId', orderId);

        const res = await fetch(`/api/paystack/verify?${query.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || data.message || 'Payment verification failed');
        }

        // Clear local cart
        localStorage.removeItem('debest-cart');
        window.dispatchEvent(new Event('storage'));

        // Redirect to order success page
        const finalOrderId = data.orderId || orderId;
        router.push(`/order-success/${finalOrderId}`);
      } catch (err) {
        console.error('Verification error:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify payment');
        setLoading(false);
      }
    }

    verifyPayment();
  }, [reference, orderId, router]);

  if (loading) {
    return (
      <main className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h2>Verifying your payment with Paystack...</h2>
        <p style={{ color: '#666', marginTop: 8 }}>Please wait while we confirm your transaction.</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: '80px 0', textAlign: 'center', maxWidth: 600 }}>
      <div className="card" style={{ padding: 40, border: '1px solid #fee2e2', background: '#fff' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h1 style={{ color: '#991b1b', marginBottom: 12 }}>Payment Verification Failed</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>{error}</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link href="/checkout" className="btn btn-primary">
            Try Checkout Again
          </Link>
          <Link href="/cart" className="btn btn-secondary">
            Return to Cart
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 100 }}>Loading verification...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
