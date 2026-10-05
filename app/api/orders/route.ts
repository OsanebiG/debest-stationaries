import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
      country,
      items,
    } = body;

    if (
      !customerName ||
      !email ||
      !phoneNumber ||
      !deliveryAddress ||
      !city ||
      !state ||
      !country ||
      !items ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required order information' },
        { status: 400 }
      );
    }

    // Get the products from Supabase
    const productIds = items.map(
      (item: { productId: string }) => item.productId
    );

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds);

    if (productsError) {
      return NextResponse.json(
        { error: productsError.message },
        { status: 500 }
      );
    }

    if (!products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products could not be found' },
        { status: 400 }
      );
    }

    // Calculate the order total from database prices
    const orderItems = items.map(
      (item: { productId: string; quantity: number }) => {
        const product = products.find(
          (p) => p.id === item.productId
        );

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const quantity = Number(item.quantity);
        const unitPrice = Number(product.price);
        const subtotal = unitPrice * quantity;

        return {
          product_id: product.id,
          quantity,
          unit_price: unitPrice,
          subtotal,
        };
      }
    );

    const totalAmount = orderItems.reduce(
  (total: number, item: { subtotal: number }) =>
    total + item.subtotal,
  0
);
    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
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

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    // Create the order items
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

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      // Remove the order if its items could not be created
      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);

      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order,
        totalAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation failed:', error);

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}