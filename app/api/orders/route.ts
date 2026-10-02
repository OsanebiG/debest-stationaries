
import { NextResponse } from 'next/server';
import { sendOrderConfirmation } from '@/lib/mailgun';

export async function POST() {
  try {
    const result = await sendOrderConfirmation({
      to: 'osanebigift@gmail.com',
      name: 'Gift',
      orderId: 'TEST-001',
      total: 2500,
      items: [
        {
          name: 'Blue Ballpoint Pen Pack',
          quantity: 1,
          unitPrice: 2500,
          subtotal: 2500,
        },
      ],
      address: 'Test Address',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Mailgun test failed:', error);
    return NextResponse.json(
      { sent: false, error: 'Email test failed. Check the server terminal.' },
      { status: 500 }
    );
  }
}