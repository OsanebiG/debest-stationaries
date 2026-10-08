import { NextResponse } from 'next/server';
import { supabaseAdmin, getOrCreateUserId } from '@/lib/supabaseAdmin';
import { products as fallbackProducts } from '@/lib/products';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName,
      email,
      phoneNumber,
      deliveryAddress,
      city,
      state,
      country = 'Nigeria',
      items,
      userId = null,
      callbackUrl,
    } = body;

    const missingFields: string[] = [];
    if (!customerName) missingFields.push('customerName');
    if (!email) missingFields.push('email');
    if (!phoneNumber) missingFields.push('phoneNumber');
    if (!deliveryAddress) missingFields.push('deliveryAddress');
    if (!city) missingFields.push('city');
    if (!state) missingFields.push('state');
    if (!items || !Array.isArray(items) || items.length === 0) missingFields.push('items');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
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

    const finalUserId = userId || (await getOrCreateUserId(email));

    const productIds = items.map((i: { productId: string }) => i.productId);

    // Fetch product details from DB or fallback
    let dbProducts: { id: string; name: string; price: number }[] = [];
    const { data: fetchedProducts, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, price')
      .in('id', productIds);

    if (!productsError && fetchedProducts && fetchedProducts.length > 0) {
      dbProducts = fetchedProducts.map((p) => ({ ...p, price: Number(p.price) }));
    } else {
      dbProducts = fallbackProducts.map((p) => ({ id: p.id, name: p.name, price: p.price }));
    }

    const orderItems = items.map((item: { productId: string; quantity: number }) => {
      const product = dbProducts.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(product.price);
      const subtotal = unitPrice * quantity;
      return {
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        subtotal,
      };
    });

    const totalAmount = orderItems.reduce(
      (acc: number, item: { subtotal: number }) => acc + item.subtotal,
      0
    );

    // Create Order in DB
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: finalUserId,
        customer_name: customerName,
        email,
        phone_number: phoneNumber,
        delivery_address: deliveryAddress,
        city,
        state,
        country,
        total_amount: totalAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: orderError?.message || 'Failed to create order record' },
        { status: 500 }
      );
    }

    // Insert Order Items
    const itemsToInsert = orderItems.map(
      (item: {
        product_id: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
      }) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      })
    );

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Order items insertion error:', itemsError);
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    // Call Paystack API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectCallbackUrl = callbackUrl || `${appUrl}/checkout/verify?orderId=${order.id}`;

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(totalAmount * 100), // convert NGN to kobo
        callback_url: redirectCallbackUrl,
        metadata: {
          order_id: order.id,
          customer_name: customerName,
          phone_number: phoneNumber,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack initialize error:', paystackData);
      return NextResponse.json(
        { error: paystackData.message || 'Failed to initialize Paystack checkout' },
        { status: 500 }
      );
    }

    // Update order with reference
    const reference = paystackData.data.reference;
    await supabaseAdmin
      .from('orders')
      .update({ paystack_reference: reference })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      totalAmount,
      reference,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
    });
  } catch (error) {
    console.error('PAYSTACK INITIALIZE ERROR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
