
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProduct, naira } from '@/lib/products';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const product = getProduct(id);

  if (!product) {
    return (
      <main className="container" style={{ padding: 50 }}>
        <h1>Product not found</h1>
        <Link href="/">Back to shop</Link>
      </main>
    );
  }

  function addToCart() {
  if (!product) return;

  const cart = JSON.parse(localStorage.getItem('debest-cart') || '[]');
  const existing = cart.findIndex((item: any) => item.id === product.id);

  if (existing >= 0) {
    cart[existing].quantity = Math.min(
      cart[existing].quantity + 1,
      product.stock
    );
  } else {
    cart.push({ id: product.id, quantity: 1 });
  }

  localStorage.setItem('debest-cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('storage'));
}

  return (
    <main className="container" style={{ padding: '50px 0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
        }}
      >
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: '100%',
            background: '#f6f8f8',
            borderRadius: 18,
          }}
        />

        <div>
          <p style={{ color: '#0f766e', fontWeight: 800 }}>
            {product.category}
          </p>

          <h1>{product.name}</h1>

          <p style={{ fontSize: 28, fontWeight: 800 }}>
            {naira(product.price)}
          </p>

          <p style={{ color: '#667085', fontSize: 17 }}>
            {product.description}
          </p>

          <p>{product.stock} in stock</p>

          <button
            onClick={addToCart}
            className="btn btn-primary"
          >
            Add to cart
          </button>

          {' '}

          <Link href="/cart" className="btn btn-secondary">
            Go to cart
          </Link>
        </div>
      </div>
    </main>
  );
}