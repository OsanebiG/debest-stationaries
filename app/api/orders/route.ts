import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

    const missingFields: string[] = [];

    if (!customerName) missingFields.push('customerName');
    if (!email) missingFields.push('email');
    if (!phoneNumber) missingFields.push('phoneNumber');
    if (!deliveryAddress) missingFields.push('deliveryAddress');
    if (!city) missingFields.push('city');
    if (!state) missingFields.push('state');
    if (!country) missingFields.push('country');
    if (!items || items.length === 0) missingFields.push('items');

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const productIds = items.map(
      (item: { productId: string }) => item.productId
    );

    const { data: products, error: productsError } = await supabaseAdmin
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

    const orderItems = items.map(
      (item: { productId: string; quantity: number }) => {
       const product = products.find(
  (p: { id: string; name: string; price: number }) =>
    p.id === item.productId
);
        if (!product) {
          throw new Error(
            `Product not found: ${item.productId}`
          );
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
      (
        total: number,
        item: { subtotal: number }
      ) => total + item.subtotal,
      0
    );

    const { data: order, error: orderError } = await supabaseAdmin
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
      await supabaseAdmin
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
    console.error('ORDER CREATION ERROR:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Fetch orders error:', ordersError);

      return NextResponse.json(
        { error: ordersError.message },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json([]);
    }

    const orderIds = orders.map(
      (order: any) => order.id
    );

    const { data: orderItems, error: itemsError } =
      await supabaseAdmin
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

    if (itemsError) {
      console.error(
        'Fetch order items error:',
        itemsError
      );

      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    const productIds = [
      ...new Set(
        (orderItems || []).map(
          (item: any) => item.product_id
        )
      ),
    ];

    let products: any[] = [];

    if (productIds.length > 0) {
      const {
        data: productData,
        error: productsError,
      } = await supabaseAdmin
        .from('products')
        .select('id, name')
        .in('id', productIds);

      if (productsError) {
        console.error(
          'Fetch products error:',
          productsError
        );

        return NextResponse.json(
          { error: productsError.message },
          { status: 500 }
        );
      }

      products = productData || [];
    }

    const result = orders.map((order: any) => ({
      ...order,
      items: (orderItems || [])
        .filter(
          (item: any) => item.order_id === order.id
        )
        .map((item: any) => ({
          ...item,
          product:
            products.find(
              (product: any) =>
                product.id === item.product_id
            ) || null,
        })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET orders error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}