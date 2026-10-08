import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendOrderConfirmation } from '@/lib/mailgun';
import { products as fallbackProducts } from '@/lib/products';

export async function POST(request: Request) {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json({ error: 'PAYSTACK_SECRET_KEY not set' }, { status: 500 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (signature) {
      const hash = crypto.createHmac('sha512', paystackSecretKey).update(rawBody).digest('hex');
      if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid Paystack signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const orderId = data.metadata?.order_id;

      let orderQuery = supabaseAdmin.from('orders').select('*');
      if (orderId) {
        orderQuery = orderQuery.eq('id', orderId);
      } else {
        orderQuery = orderQuery.eq('paystack_reference', reference);
      }

      const { data: order } = await orderQuery.single();

      if (order && order.status !== 'paid') {
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'paid',
            paystack_reference: reference,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        const { data: itemsData } = await supabaseAdmin
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        const items = itemsData || [];
        const productIds = items.map((i) => i.product_id);

        const { data: productData } = await supabaseAdmin
          .from('products')
          .select('id, name')
          .in('id', productIds);

        const formattedItems = items.map((item) => {
          const prod = (productData || []).find((p) => p.id === item.product_id) ||
            fallbackProducts.find((p) => p.id === item.product_id);
          return {
            name: prod?.name || item.product_id,
            quantity: item.quantity,
            unitPrice: Number(item.unit_price),
            subtotal: Number(item.subtotal),
          };
        });

        try {
          await sendOrderConfirmation({
            to: order.email,
            name: order.customer_name,
            orderId: order.id,
            total: Number(order.total_amount),
            items: formattedItems,
            address: order.delivery_address,
            city: order.city,
            state: order.state,
            country: order.country,
          });
        } catch (e) {
          console.error('Webhook Mailgun error:', e);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PAYSTACK WEBHOOK ERROR:', error);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }
}
