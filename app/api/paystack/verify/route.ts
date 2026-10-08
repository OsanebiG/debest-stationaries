import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendOrderConfirmation } from '@/lib/mailgun';
import { products as fallbackProducts } from '@/lib/products';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference')?.trim();
    const orderIdParam = searchParams.get('orderId')?.trim();

    if (!reference) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: 'PAYSTACK_SECRET_KEY is not configured on the server' },
        { status: 500 }
      );
    }

    // Call Paystack Verify API
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack verification failed:', paystackData);
      return NextResponse.json(
        { error: paystackData.message || 'Payment verification failed' },
        { status: 400 }
      );
    }

    const transactionData = paystackData.data;

    if (transactionData.status !== 'success') {
      return NextResponse.json({
        success: false,
        status: transactionData.status,
        message: `Payment status is ${transactionData.status}`,
      });
    }

    // Find the order by metadata order_id, orderIdParam, or paystack_reference
    const targetOrderId = transactionData.metadata?.order_id || orderIdParam;

    let orderQuery = supabaseAdmin.from('orders').select('*');
    if (targetOrderId) {
      orderQuery = orderQuery.eq('id', targetOrderId);
    } else {
      orderQuery = orderQuery.eq('paystack_reference', reference);
    }

    const { data: order, error: orderError } = await orderQuery.single();

    if (orderError || !order) {
      console.error('Order not found during verification:', orderError);
      return NextResponse.json(
        { error: 'Order matching reference could not be found' },
        { status: 404 }
      );
    }

    // If order is not yet marked paid, update it and send email
    if (order.status !== 'paid') {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          paystack_reference: reference,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Fetch order items to build email confirmation payload
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

      // Send Mailgun order confirmation email
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
      } catch (emailError) {
        console.error('Mailgun order confirmation email error:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      status: 'paid',
      orderId: order.id,
      order: {
        ...order,
        status: 'paid',
      },
    });
  } catch (error) {
    console.error('PAYSTACK VERIFY ERROR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
