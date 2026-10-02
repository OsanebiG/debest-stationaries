type OrderEmail = {
  to: string;
  name: string;
  orderId: string;
  total: number;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  address: string;
  city: string;
  state: string;
  country: string;
};

export async function sendOrderConfirmation(order: OrderEmail) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !domain || !from) {
    throw new Error('Mailgun environment variables are not configured');
  }

  const form = new URLSearchParams();
  form.set('from', from);
  form.set('to', order.to);
  form.set('subject', `Order confirmation: ${order.orderId}`);
  form.set(
    'text',
    `Hello ${order.name},

Thank you for your order.

Order ID: ${order.orderId}
Total: ₦${order.total.toLocaleString('en-NG')}

${order.items
  .map(
    (item) =>
      `${item.name} x ${item.quantity} — ₦${item.subtotal.toLocaleString('en-NG')}`
  )
  .join('\n')}

Delivery address: ${order.address}, ${order.city}, ${order.state}, ${order.country}

Thank you for shopping with DEBEST Stationaries.`
  );

  const response = await fetch(
    `https://api.mailgun.net/v3/${domain}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Mailgun failed to send the email');
  }

  return { sent: true, result };
}