import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { naira } from '@/lib/products';

export default async function SuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let order: any = null;
  try {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    order = data;
  } catch (e) {
    console.error(e);
  }

  return (
    <main className="container" style={{ padding: '80px 0', maxWidth: 650, margin: '0 auto' }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 16, border: '1px solid #e5e7eb', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, background: '#dcfce7', color: '#15803d', fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          ✓
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Order Confirmed!</h1>
        <p style={{ color: '#52606d', marginBottom: 24, fontSize: 16 }}>
          Thank you for your purchase from DEBEST Stationaries.
        </p>

        <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, textAlign: 'left', marginBottom: 28, border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
            <span style={{ color: '#64748b' }}>Order Number:</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>#{id}</span>
          </div>

          {order && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Customer:</span>
                <span style={{ fontWeight: 600 }}>{order.customer_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Email:</span>
                <span style={{ fontWeight: 600 }}>{order.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Payment Status:</span>
                <span style={{ fontWeight: 700, color: order.status === 'paid' ? '#16a34a' : '#d97706', textTransform: 'capitalize' }}>
                  {order.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, paddingTop: 10, borderTop: '1px solid #e2e8f0', marginTop: 10 }}>
                <span style={{ fontWeight: 700 }}>Total Paid:</span>
                <span style={{ fontWeight: 800, color: '#0f766e' }}>{naira(Number(order.total_amount))}</span>
              </div>
            </>
          )}
        </div>

        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
          A confirmation email has been sent to your email address.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            Continue Shopping
          </Link>
          <Link href="/orders" className="btn btn-secondary" style={{ padding: '12px 24px' }}>
            View All Orders
          </Link>
        </div>
      </div>
    </main>
  );
}
