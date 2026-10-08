const http = require('http');

const data = JSON.stringify({
  customerName: 'Test User',
  email: 'test@example.com',
  phoneNumber: '08012345678',
  deliveryAddress: '123 Main Street',
  city: 'Lagos',
  state: 'Lagos',
  country: 'Nigeria',
  items: [
    { productId: 'notebook-a5', quantity: 2 },
    { productId: 'blue-pen-pack', quantity: 1 }
  ]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/paystack/initialize',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
