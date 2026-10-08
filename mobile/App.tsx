import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  StyleSheet,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import AuthScreen from './components/AuthScreen';
import { supabase } from './lib/supabase';
type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
};

type CartItem = Product & {
  quantity: number;
};
type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: string;
    name: string;
  } | null;
};

type Order = {
  id: string;
  customer_name: string;
  email: string;
  phone_number: string;
  delivery_address: string;
  city: string;
  state: string;
  country: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
};

type Tab =
  | 'Home'
  | 'Shop'
  | 'Cart'
  | 'Orders'
  | 'Account'
  | 'Checkout'
  | 'OrderDetails';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://debest-stationaries.vercel.app';

const API_URL = `${API_BASE_URL}/api/products`;
const ORDERS_API_URL = `${API_BASE_URL}/api/orders`;
const PAYSTACK_INIT_URL = `${API_BASE_URL}/api/paystack/initialize`;
const PAYSTACK_VERIFY_URL = `${API_BASE_URL}/api/paystack/verify`;

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG')}`;

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [activeScreen, setActiveScreen] = useState('Home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orders, setOrders] = useState<Order[]>([]);
const [ordersLoading, setOrdersLoading] = useState(false);
const [ordersError, setOrdersError] = useState('');
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

useEffect(() => {
  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    setIsAuthenticated(!!data.session);
    if (data.session?.user?.email) {
      setCustomerEmail(data.session.user.email);
    }
  };

  checkSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setIsAuthenticated(!!session);
    if (session?.user?.email) {
      setCustomerEmail(session.user.email);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);

useEffect(() => {
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(API_URL);

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Products API error ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid products response from API');
      }

      const formattedProducts: Product[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        category: item.category || 'Other',
        image: productImages[item.id] || item.image_url || '',
      }));

      setProducts(formattedProducts);
    } catch (err) {
      console.error('PRODUCT FETCH ERROR:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load products.'
      );
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, []);

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [cart]
  );

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((product) => product.category))
    );

    return ['All', ...uniqueCategories];
  }, [products]);

  const featuredProducts = products.slice(0, 4);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') {
      return products;
    }

    return products.filter(
      (product) => product.category === selectedCategory
    );
  }, [products, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  const increaseQuantity = (productId: string) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (productId: string) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

 const handleCheckout = () => {
  if (cart.length === 0) {
    Alert.alert(
      'Cart is empty',
      'Add a product before checkout.'
    );
    return;
  }

  setActiveScreen('Checkout');
  

};

const productImages: Record<string, string> = {
  'notebook-a5':
    'https://s.alicdn.com/@sc04/kf/H72c5ab0aade84dc1afa67205d1072227m/Wholesale-Customized-Small-Side-spiral-Pocket-Note-Book-Notepad-with-Coated-Paper-Hard-Cover-and-Custom-Logo-Printing.png',

  'blue-pen-pack':
    'https://www.nextparty.com.au/cdn/shop/files/ballpoint-pens-10pk-blue-ink-colour-484922.jpg?v=1721878996',

  'marker-set':
    'https://cld-assets.dick-blick.com/image/upload/f_auto/q_auto/v1748373976/21338-1009-3ww-l.jpg',

  'office-file':
    'https://kingjim.com/cdn/shop/products/2274b.jpg?v=1719551202',

  'sticky-notes':
    'https://multimedia.3m.com/mws/media/2236809J/post-it-super-sticky-notes-654-15ssasstjp.jpg?width=506',

  'ruler-30cm':
    'https://www.schooldepot.co.nz/cdn/shop/products/Celco-Ruler-30-cm-Clear-Plastic.jpg?v=1687405585&width=1445',
};
  const ProductCard = ({ product }: { product: Product }) => {
  const imageUrl = productImages[product.id];

  return (
    <View style={styles.productCard}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.productImage}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>
            DEBEST
          </Text>
        </View>
      )}

      <Text style={styles.productCategory}>
        {product.category}
      </Text>

      <Text
        style={styles.productName}
        numberOfLines={2}
      >
        {product.name}
      </Text>

      <Text style={styles.productPrice}>
        {formatNaira(product.price)}
      </Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addToCart(product)}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>
          Add to Cart
        </Text>
      </TouchableOpacity>
    </View>
  );
};
  const renderHome = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>DEBEST</Text>
          <Text style={styles.logoSubtitle}>
            Stationaries
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerCart}
          onPress={() => setActiveTab('Cart')}
        >
          <Text style={styles.headerCartIcon}>🛒</Text>

          {cartCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroSmall}>
          WELCOME TO
        </Text>

        <Text style={styles.heroTitle}>
          DEBEST
        </Text>

        <Text style={styles.heroDescription}>
          Quality stationery for work, school and everyday life.
        </Text>

        <TouchableOpacity
          style={styles.shopNowButton}
          onPress={() => setActiveTab('Shop')}
        >
          <Text style={styles.shopNowText}>
            Shop Now
          </Text>
        </TouchableOpacity>
      </View>

      {/* Featured heading */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Featured Products
        </Text>

        <TouchableOpacity
          onPress={() => setActiveTab('Shop')}
        >
          <Text style={styles.seeAll}>
            See all
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#0f766e"
          />
          <Text style={styles.loadingText}>
            Loading products...
          </Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>
          {error}
        </Text>
      ) : (
        <View style={styles.productGrid}>
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderShop = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>
          Shop
        </Text>

        <Text style={styles.pageSubtitle}>
          Find everything you need.
        </Text>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category &&
                styles.categoryChipActive,
            ]}
            onPress={() =>
              setSelectedCategory(category)
            }
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category &&
                  styles.categoryChipTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#0f766e"
          />
          <Text style={styles.loadingText}>
            Loading products...
          </Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>
          {error}
        </Text>
      ) : (
        <View style={styles.productGrid}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderCheckout = () => (
  <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.scrollContent}
  >
    <View style={styles.pageHeader}>
      <Text style={styles.pageTitle}>Checkout</Text>

      <Text style={styles.pageSubtitle}>
        Complete your order
      </Text>
    </View>

    <View style={styles.checkoutForm}>
      <Text style={styles.formLabel}>Full Name</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your full name"
        value={customerName}
        onChangeText={setCustomerName}
      />

      <Text style={styles.formLabel}>Phone Number</Text>

      <TextInput
        style={styles.input}
        placeholder="08012345678"
        keyboardType="phone-pad"
        value={customerPhone}
        onChangeText={setCustomerPhone}
      />

      <Text style={styles.formLabel}>Email</Text>

<TextInput
  style={styles.input}
  placeholder="test@example.com"
  keyboardType="email-address"
  autoCapitalize="none"
  value={customerEmail}
  onChangeText={setCustomerEmail}
/>

      <Text style={styles.formLabel}>Delivery Address</Text>

      <TextInput
        style={[styles.input, styles.addressInput]}
        placeholder="Enter your delivery address"
        multiline
        value={deliveryAddress}
        onChangeText={setDeliveryAddress}
      />
    </View>

    <View style={styles.totalCard}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Order Total</Text>

        <Text style={styles.totalAmount}>
          {formatNaira(cartTotal)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.checkoutButton}
        onPress={async () => {
          if (
            !customerName ||
            !customerEmail ||
            !customerPhone ||
            !deliveryAddress
          ) {
            Alert.alert(
              'Incomplete Details',
              'Please fill in all delivery details.'
            );
            return;
          }

          try {
            const initRes = await fetch(PAYSTACK_INIT_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerName,
                email: customerEmail,
                phoneNumber: customerPhone,
                deliveryAddress,
                city: 'Lagos',
                state: 'Lagos',
                country: 'Nigeria',
                items: cart.map((item) => ({
                  productId: item.id,
                  quantity: item.quantity,
                })),
              }),
            });

            const initData = await initRes.json();
            if (!initRes.ok || !initData.authorization_url) {
              throw new Error(
                initData.error || 'Failed to initialize Paystack payment'
              );
            }

            // Open Paystack URL in WebBrowser
            await WebBrowser.openAuthSessionAsync(
              initData.authorization_url,
              'debest://checkout/callback'
            );

            // Verify payment server-side
            const verifyRes = await fetch(
              `${PAYSTACK_VERIFY_URL}?reference=${encodeURIComponent(
                initData.reference
              )}`
            );
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setCart([]);
              setCustomerName('');
              setCustomerPhone('');
              setDeliveryAddress('');
              fetchOrders();
              setActiveScreen('Orders');

              Alert.alert(
                'Order Paid & Placed 🎉',
                `Your payment was successful.\nOrder total: ${formatNaira(
                  initData.totalAmount
                )}`
              );
            } else {
              Alert.alert(
                'Payment Status',
                'If payment was completed, your order will update shortly.'
              );
              fetchOrders();
              setActiveScreen('Orders');
            }
          } catch (error) {
            console.error('Checkout error:', error);
            Alert.alert(
              'Checkout Failed',
              error instanceof Error ? error.message : 'Could not complete checkout.'
            );
          }
        }}
      >
        <Text style={styles.checkoutText}>
          Pay with Paystack
        </Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);
  const renderCart = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>
          Your Cart
        </Text>

        <Text style={styles.pageSubtitle}>
          {cartCount} item{cartCount === 1 ? '' : 's'}
        </Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>
            🛒
          </Text>

          <Text style={styles.emptyTitle}>
            Your cart is empty
          </Text>

          <Text style={styles.emptyText}>
            Add some stationery products to get started.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setActiveScreen('Shop')}
          >
            <Text style={styles.primaryButtonText}>
              Start Shopping
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {cart.map((item) => (
            <View
              key={item.id}
              style={styles.cartItem}
            >
            {item.image ? (
  typeof item.image === 'string' ? (
    item.image.endsWith('.svg') ? (
      <SvgUri
        uri={item.image}
        width={80}
        height={80}
      />
    ) : (
      <Image
        source={{ uri: item.image }}
        style={styles.cartImage}
      />
    )
  ) : (
    <Image
      source={item.image}
      style={styles.cartImage}
    />
  )
) : (
  <View style={styles.cartImagePlaceholder}>
    <Text>📦</Text>
  </View>
)}

              <View style={styles.cartItemInfo}>
                <Text
                  style={styles.cartItemName}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>

                <Text style={styles.cartItemPrice}>
                  {formatNaira(item.price)}
                </Text>

                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      decreaseQuantity(item.id)
                    }
                  >
                    <Text style={styles.quantityText}>
                      −
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.quantity}>
                    {item.quantity}
                  </Text>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      increaseQuantity(item.id)
                    }
                  >
                    <Text style={styles.quantityText}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Subtotal
              </Text>

              <Text style={styles.totalAmount}>
                {formatNaira(cartTotal)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>
                Total
              </Text>

              <Text style={styles.grandTotal}>
                {formatNaira(cartTotal)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutText}>
                Proceed to Checkout
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );

  const fetchOrders = async () => {
  if (!customerEmail) {
    setOrders([]);
    return;
  }

  try {
    setOrdersLoading(true);
    setOrdersError('');

    const response = await fetch(
      `${ORDERS_API_URL}?email=${encodeURIComponent(customerEmail)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load orders');
    }

    setOrders(data);
  } catch (error) {
    console.error('Fetch orders error:', error);
    setOrdersError('Unable to load your orders.');
  } finally {
    setOrdersLoading(false);
  }
};
useEffect(() => {
  if (activeScreen === 'Orders') {
    fetchOrders();
  }
}, [activeScreen, customerEmail]);

const renderOrders = () => (
  <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.scrollContent}
  >
    <View style={styles.pageHeader}>
      <Text style={styles.pageTitle}>My Orders</Text>

      <Text style={styles.pageSubtitle}>
        Track your stationery orders.
      </Text>
    </View>

    {ordersLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f766e" />

        <Text style={styles.loadingText}>
          Loading your orders...
        </Text>
      </View>
    ) : ordersError ? (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>⚠️</Text>

        <Text style={styles.emptyTitle}>
          Unable to load orders
        </Text>

        <Text style={styles.emptyText}>
          {ordersError}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={fetchOrders}
        >
          <Text style={styles.primaryButtonText}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    ) : orders.length === 0 ? (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📦</Text>

        <Text style={styles.emptyTitle}>
          No orders yet
        </Text>

        <Text style={styles.emptyText}>
          Your orders will appear here after you place an order.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setActiveScreen('Shop')}
        >
          <Text style={styles.primaryButtonText}>
            Shop Now
          </Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View>
        {orders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            activeOpacity={0.8}
            onPress={() => {
              setSelectedOrder(order);
              setActiveScreen('OrderDetails');
            }}
          >
            <View style={styles.orderCardTop}>
              <View>
                <Text style={styles.orderNumber}>
                  Order #{order.id.slice(0, 8)}
                </Text>

                <Text style={styles.orderDate}>
                  {new Date(
                    order.created_at
                  ).toLocaleDateString('en-NG')}
                </Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {order.status}
                </Text>
              </View>
            </View>

            <View style={styles.orderDivider} />

            <Text style={styles.orderItemsText}>
              {order.items.length}{' '}
              {order.items.length === 1 ? 'item' : 'items'}
            </Text>

            <View style={styles.orderCardBottom}>
              <Text style={styles.orderTotalLabel}>
                Total
              </Text>

              <Text style={styles.orderTotal}>
                {formatNaira(Number(order.total_amount))}
              </Text>
            </View>

            <Text style={styles.viewOrderText}>
              View Order →
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </ScrollView>
);

const renderOrderDetails = () => {
  if (!selectedOrder) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>
          Order not found
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setActiveScreen('Orders')}
      >
        <Text style={styles.backButtonText}>
          ← Back to Orders
        </Text>
      </TouchableOpacity>

      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>
          Order Details
        </Text>

        <Text style={styles.pageSubtitle}>
          Order #{selectedOrder.id.slice(0, 8)}
        </Text>
      </View>

      <View style={styles.orderDetailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Status
          </Text>

          <Text style={styles.detailValue}>
            {selectedOrder.status}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Order Date
          </Text>

          <Text style={styles.detailValue}>
            {new Date(
              selectedOrder.created_at
            ).toLocaleDateString('en-NG')}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Items
      </Text>

      <View style={styles.orderDetailsCard}>
        {selectedOrder.items.map((item) => (
          <View
            key={item.id}
            style={styles.detailItem}
          >
            <View style={styles.detailItemInfo}>
              <Text style={styles.detailItemName}>
                {item.product?.name || 'Product'}
              </Text>

              <Text style={styles.detailItemQuantity}>
                Qty: {item.quantity}
              </Text>
            </View>

            <Text style={styles.detailItemPrice}>
              {formatNaira(Number(item.subtotal))}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        Delivery
      </Text>

      <View style={styles.orderDetailsCard}>
        <Text style={styles.deliveryText}>
          {selectedOrder.delivery_address}
        </Text>

        <Text style={styles.deliveryText}>
          {selectedOrder.city}, {selectedOrder.state}
        </Text>

        <Text style={styles.deliveryText}>
          {selectedOrder.country}
        </Text>

        <Text style={styles.deliveryText}>
          Phone: {selectedOrder.phone_number}
        </Text>

        <Text style={styles.deliveryText}>
          Email: {selectedOrder.email}
        </Text>
      </View>

      <View style={styles.grandTotalCard}>
        <Text style={styles.grandTotalLabel}>
          Order Total
        </Text>

        <Text style={styles.grandTotal}>
          {formatNaira(
            Number(selectedOrder.total_amount)
          )}
        </Text>
      </View>
    </ScrollView>
  );
};

const renderAccount = () => {
  if (!isAuthenticated) {
    return (
      <AuthScreen
        onAuthenticated={() => {
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Account</Text>

        <Text style={styles.pageSubtitle}>
          Manage your DEBEST account.
        </Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileIcon}>
          <Text style={styles.profileIconText}>👤</Text>
        </View>

        <View>
          <Text style={styles.profileTitle}>
            {customerEmail ? customerEmail.split('@')[0] : 'Welcome to DEBEST'}
          </Text>

          <Text style={styles.profileSubtitle}>
            {customerEmail || 'Signed in'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.accountOption}
        onPress={() => setActiveScreen('Orders')}
      >
        <Text style={styles.accountOptionIcon}>📦</Text>
        <Text style={styles.accountOptionText}>
          My Orders
        </Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.accountOption}
        onPress={async () => {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setCustomerEmail('');
          Alert.alert('Signed Out', 'You have been signed out.');
        }}
      >
        <Text style={styles.accountOptionIcon}>🚪</Text>
        <Text style={styles.accountOptionText}>
          Sign Out
        </Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Shop':
        return renderShop();

      case 'Cart':
        return renderCart();

        case 'Checkout':
      return renderCheckout();

      case 'Orders':
        return renderOrders();
        
     case 'OrderDetails':
       return renderOrderDetails();

      case 'Account':
        return renderAccount();

      case 'Home':
      default:
        return renderHome();
    }
  };

  const TabButton = ({
    tab,
    icon,
    label,
  }: {
    tab: Tab;
    icon: string;
    label: string;
  }) => {
    const active = activeScreen === tab;

    return (
      <TouchableOpacity
        style={styles.tabButton}
       onPress={() => setActiveScreen(tab)}
        activeOpacity={0.8}
      >
        <View style={styles.tabIconContainer}>
          <Text
            style={[
              styles.tabIcon,
              active && styles.tabIconActive,
            ]}
          >
            {icon}
          </Text>

          {tab === 'Cart' && cartCount > 0 && (
            <View style={styles.bottomBadge}>
              <Text style={styles.bottomBadgeText}>
                {cartCount}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.tabLabel,
            active && styles.tabLabelActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        {renderScreen()}
      </View>

      {/* Mobile Bottom Navigation */}
      <View style={styles.bottomTabBar}>
        <TabButton
          tab="Home"
          icon="⌂"
          label="Home"
        />

        <TabButton
          tab="Shop"
          icon="🛍"
          label="Shop"
        />

        <TabButton
          tab="Cart"
          icon="🛒"
          label="Cart"
        />

        <TabButton
          tab="Orders"
          icon="📦"
          label="Orders"
        />

        <TabButton
          tab="Account"
          icon="👤"
          label="Account"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },

    checkoutForm: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },

  addressInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  screen: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 110,
  },

  /* Header */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  logo: {
    fontSize: 27,
    fontWeight: '900',
    color: '#0f766e',
    letterSpacing: -1,
  },

  logoSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },

  headerCart: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e6f5f2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCartIcon: {
    fontSize: 25,
  },

  headerBadge: {
    position: 'absolute',
    top: -3,
    right: -2,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Hero */

  hero: {
    backgroundColor: '#0f766e',
    borderRadius: 28,
    padding: 30,
    marginBottom: 32,
  },

  heroSmall: {
    color: '#d7f5f0',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },

  heroTitle: {
    color: '#fff',
    fontSize: 50,
    fontWeight: '900',
    letterSpacing: -2,
    marginBottom: 12,
  },

  heroDescription: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 27,
    marginBottom: 24,
  },

  shopNowButton: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 25,
    paddingVertical: 16,
    borderRadius: 16,
  },

  shopNowText: {
    color: '#0f766e',
    fontSize: 16,
    fontWeight: '800',
  },

  /* Sections */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
  },

  seeAll: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f766e',
  },

  pageHeader: {
    marginBottom: 22,
  },

  pageTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
  },

  pageSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 5,
  },

  /* Products */

  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  productImage: {
    width: '100%',
    height: 145,
    borderRadius: 15,
    backgroundColor: '#f1f3f6',
    marginBottom: 12,
  },

  imagePlaceholder: {
    width: '100%',
    height: 145,
    borderRadius: 15,
    backgroundColor: '#eef1f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  placeholderText: {
    color: '#0f766e',
    fontWeight: '900',
  },

  productCategory: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },

  productName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    minHeight: 42,
  },

  productPrice: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 12,
  },

  addButton: {
    backgroundColor: '#0f766e',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Shop categories */

  categoryScroll: {
    marginBottom: 20,
  },

  categoryContainer: {
    paddingRight: 20,
  },

  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  categoryChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },

  categoryChipText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
  },

  categoryChipTextActive: {
    color: '#fff',
  },

  /* Loading / errors */

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },

  errorText: {
    textAlign: 'center',
    color: '#dc2626',
    marginTop: 30,
  },

  /* Cart */

  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  cartImage: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#f1f3f6',
  },

  cartImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#f1f3f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartItemInfo: {
    flex: 1,
    marginLeft: 14,
  },

  cartItemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  cartItemPrice: {
    color: '#0f766e',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 7,
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#e6f5f2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityText: {
    color: '#0f766e',
    fontSize: 20,
    fontWeight: '800',
  },

  quantity: {
    minWidth: 35,
    textAlign: 'center',
    fontWeight: '800',
    color: '#111827',
  },

  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    color: '#6b7280',
    fontSize: 15,
  },

  totalAmount: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },

  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  grandTotalCard: {
  backgroundColor: '#0f766e',
  borderRadius: 16,
  padding: 18,
  marginBottom: 30,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

  grandTotal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f766e',
  },

  checkoutButton: {
    backgroundColor: '#0f766e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },

  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  /* Empty states */

  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 35,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 20,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#111827',
  },

  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 22,
  },

  primaryButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 13,
  },

  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
  },

  /* Account */

  profileCard: {
    backgroundColor: '#0f766e',
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  profileIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  profileIconText: {
    fontSize: 26,
  },

  profileTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },

  profileSubtitle: {
    color: '#d7f5f0',
    fontSize: 12,
    marginTop: 4,
    maxWidth: 230,
    lineHeight: 17,
  },

  accountOption: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  accountOptionIcon: {
    fontSize: 21,
    width: 35,
  },

  accountOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  arrow: {
    fontSize: 25,
    color: '#9ca3af',
  },

  /* Bottom navigation */

  bottomTabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 82,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 8,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
  },

  tabIcon: {
    fontSize: 23,
    opacity: 0.55,
  },

  tabIconActive: {
    opacity: 1,
  },

  tabLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    fontWeight: '600',
  },

  tabLabelActive: {
    color: '#0f766e',
    fontWeight: '800',
  },

  bottomBadge: {
    position: 'absolute',
    right: -10,
    top: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
    orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  orderDate: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 5,
  },

  statusBadge: {
    backgroundColor: '#e6f5f2',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
    textTransform: 'capitalize',
  },

  orderDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 14,
  },

  orderItemsText: {
    fontSize: 14,
    color: '#6b7280',
  },

  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  orderTotalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },

  orderTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  viewOrderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f766e',
    marginTop: 14,
  },

  backButton: {
    marginBottom: 16,
  },

  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f766e',
  },

  orderDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },

  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  detailItemInfo: {
    flex: 1,
    paddingRight: 12,
  },

  detailItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  detailItemQuantity: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },

  detailItemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  deliveryText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  
});