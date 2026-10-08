const http = require('http');

async function testPaystackInit() {
  console.log('Testing Paystack Initialize endpoint structure...');
  const body = JSON.stringify({
    customerName: 'Test Customer',
    email: 'test@example.com',
    phoneNumber: '08012345678',
    deliveryAddress: '123 Main St',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    items: [{ productId: 'notebook-a5', quantity: 2 }]
  });
  console.log('Payload:', body);
}

testPaystackInit();
