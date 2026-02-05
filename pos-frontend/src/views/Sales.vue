<template>
  <div class="sales-page">
    <!-- Customer Header -->
    <header class="customer-header">
      <div class="header-content">
        <div class="header-main">
          <h1>🛒 Order Now</h1>
          <div class="mobile-toggle" @click="toggleMobileMenu" v-if="isMobile">
            {{ showMobileMenu ? '✕' : '☰' }}
          </div>
        </div>
        
        <div class="customer-info" :class="{ 'show-mobile': showMobileMenu }">
          <div class="welcome-text">
            Welcome to JRE FoodHub! 👋
          </div>
          <div class="store-info">
            <span class="store-item">
              <span class="store-icon">📍</span>
              <span class="store-text">Purok 2, Plaridel, Lipa, Batangas</span>
            </span>
            <span class="store-item">
              <span class="store-icon">⏰</span>
              <span class="store-text">Open: 8:00 AM - 8:00 PM</span>
            </span>
          </div>
        </div>
      </div>
      
      <!-- Progress Indicator -->
      <div class="progress-indicator">
        <div class="progress-step" :class="{ active: currentStep >= 1 }">
          <div class="step-number">1</div>
          <div class="step-label">Select Products</div>
        </div>
        <div class="progress-step" :class="{ active: currentStep >= 2 }">
          <div class="step-number">2</div>
          <div class="step-label">Add to Cart</div>
        </div>
        <div class="progress-step" :class="{ active: currentStep >= 3 }">
          <div class="step-number">3</div>
          <div class="step-label">Checkout</div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Left Column: Products & Cart -->
      <div class="content-left">
        <!-- Customer Info Form -->
        <div class="customer-form card" @animationend="onCardAnimation">
          <div class="card-header" @click="toggleSection('customer')" v-if="isMobile">
            <h2 class="section-title">👤 Customer Information</h2>
            <span class="toggle-icon">{{ showCustomerForm ? '−' : '+' }}</span>
          </div>
          <div class="card-body" :class="{ 'show-section': showCustomerForm || !isMobile }">
            <h2 class="section-title desktop-title">👤 Customer Information</h2>
            <div class="form-group" :class="{ 'mobile-layout': isMobile }">
              <div class="input-group">
                <label for="customer-name" class="input-label">Full Name</label>
                <input 
                  id="customer-name"
                  v-model="customer.name" 
                  placeholder="Enter your full name" 
                  required
                  class="form-input"
                  @input="updateProgress"
                />
              </div>
              <div class="input-group">
                <label for="customer-address" class="input-label">Delivery Address</label>
                <input 
                  id="customer-address"
                  v-model="customer.address" 
                  placeholder="Enter delivery address" 
                  required
                  class="form-input"
                  @input="updateProgress"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Products Selection -->
        <div class="products-section card" @animationend="onCardAnimation">
          <div class="card-header" @click="toggleSection('products')" v-if="isMobile">
            <h2 class="section-title">📦 Available Products</h2>
            <span class="toggle-icon">{{ showProducts ? '−' : '+' }}</span>
          </div>
          <div class="card-body" :class="{ 'show-section': showProducts || !isMobile }">
            <h2 class="section-title desktop-title">📦 Available Products</h2>
            
            <!-- Product Grid for Mobile/Tablet, Table for Desktop -->
            <div v-if="isMobile" class="products-grid">
              <div 
                v-for="product in products" 
                :key="product.id"
                class="product-card"
                :class="{ 'out-of-stock': product.stocks === 0 }"
              >
                <div class="product-info">
                  <h3 class="product-name">{{ product.name }}</h3>
                  <div class="product-details">
                    <span class="product-service">{{ product.service_type }}</span>
                    <span class="product-container">{{ product.container_type }}</span>
                  </div>
                  <div class="product-pricing">
                    <span class="product-price">₱{{ product.price.toFixed(2) }}</span>
                    <span class="product-stock" :class="{ 'low-stock': product.stocks < 10 }">
                      Stock: {{ product.stocks }}
                    </span>
                  </div>
                </div>
                
                <div class="product-actions">
                  <div class="quantity-selector">
                    <button 
                      @click="decreaseProductQty(product)"
                      :disabled="product.orderQty <= 1"
                      class="qty-btn minus"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      v-model.number="product.orderQty"
                      min="1"
                      :max="product.stocks"
                      :disabled="product.stocks === 0"
                      class="qty-input"
                    />
                    <button 
                      @click="increaseProductQty(product)"
                      :disabled="product.orderQty >= product.stocks"
                      class="qty-btn plus"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    @click="addToCart(product)" 
                    :disabled="product.stocks === 0 || product.orderQty < 1"
                    class="add-to-cart-btn"
                    :class="{ 'pulse-animation': product.orderQty > 0 && !isMobile }"
                  >
                    <span class="btn-icon">🛒</span>
                    <span class="btn-text">Add</span>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Desktop Table -->
            <div v-else class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Service</th>
                    <th>Container</th>
                    <th>Price</th>
                    <th>Stocks</th>
                    <th>Quantity</th>
                    <th>Add</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in products" :key="product.id">
                    <td>{{ product.name }}</td>
                    <td>{{ product.service_type }}</td>
                    <td>{{ product.container_type }}</td>
                    <td>₱{{ product.price.toFixed(2) }}</td>
                    <td :class="{ 'low-stock': product.stocks < 10 }">{{ product.stocks }}</td>
                    <td>
                      <div class="table-qty-controls">
                        <button 
                          @click="decreaseProductQty(product)"
                          :disabled="product.orderQty <= 1 || product.stocks === 0"
                          class="table-qty-btn"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          v-model.number="product.orderQty"
                          min="1"
                          :max="product.stocks"
                          :disabled="product.stocks === 0"
                          class="table-qty-input"
                        />
                        <button 
                          @click="increaseProductQty(product)"
                          :disabled="product.orderQty >= product.stocks"
                          class="table-qty-btn"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <button 
                        @click="addToCart(product)" 
                        :disabled="product.stocks === 0 || product.orderQty < 1"
                        class="add-btn"
                        :class="{ 'pulse-animation': product.orderQty > 0 }"
                      >
                        Add to Cart
                      </button>
                    </td>
                  </tr>
                  <tr v-if="products.length === 0">
                    <td colspan="7" class="empty-products">
                      <div class="empty-state">
                        <span class="empty-icon">📦</span>
                        <p>No products available</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Cart Section -->
        <div class="cart-section card" @animationend="onCardAnimation">
          <div class="card-header" @click="toggleSection('cart')" v-if="isMobile">
            <div class="cart-header-left">
              <h2 class="section-title">🛒 Your Cart</h2>
              <span class="cart-count-badge" v-if="cart.length > 0">{{ cart.length }}</span>
            </div>
            <span class="toggle-icon">{{ showCart ? '−' : '+' }}</span>
          </div>
          <div class="card-body" :class="{ 'show-section': showCart || !isMobile }">
            <div class="cart-header-desktop" v-if="!isMobile">
              <h2 class="section-title desktop-title">🛒 Your Cart</h2>
              <span class="cart-count-badge" v-if="cart.length > 0">{{ cart.length }} items</span>
            </div>
            
            <div class="table-container">
              <div v-if="cart.length" class="cart-items">
                <!-- Mobile Cart Items -->
                <div v-if="isMobile" class="cart-items-mobile">
                  <div v-for="item in cart" :key="item.id" class="cart-item-mobile">
                    <div class="cart-item-info">
                      <h3 class="item-name">{{ item.name }}</h3>
                      <div class="item-details">
                        <span>{{ item.service_type }} • {{ item.container_type }}</span>
                        <span class="item-price">₱{{ item.price.toFixed(2) }} each</span>
                      </div>
                    </div>
                    
                    <div class="cart-item-actions">
                      <div class="cart-qty-controls">
                        <button 
                          @click="decreaseQty(item.id)"
                          :disabled="item.qty <= 1"
                          class="cart-qty-btn"
                        >
                          −
                        </button>
                        <span class="cart-qty-display">{{ item.qty }}</span>
                        <button 
                          @click="increaseQty(item.id)"
                          :disabled="item.qty >= getProductStock(item.id)"
                          class="cart-qty-btn"
                        >
                          +
                        </button>
                      </div>
                      
                      <div class="cart-item-right">
                        <div class="item-subtotal">₱{{ item.subtotal.toFixed(2) }}</div>
                        <button 
                          @click="removeFromCart(item.id)"
                          class="remove-item-btn"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Desktop Cart Table -->
                <table v-else>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Subtotal</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in cart" :key="item.id">
                      <td class="product-cell">
                        <div class="product-info-cell">
                          <strong>{{ item.name }}</strong>
                          <div class="product-details-cell">
                            {{ item.service_type }} • {{ item.container_type }}
                          </div>
                        </div>
                      </td>
                      <td>₱{{ item.price.toFixed(2) }}</td>
                      <td>
                        <div class="qty-controls">
                          <button @click="decreaseQty(item.id)" :disabled="item.qty <= 1" class="qty-btn">
                            −
                          </button>
                          <span class="qty-display">{{ item.qty }}</span>
                          <button @click="increaseQty(item.id)" :disabled="item.qty >= getProductStock(item.id)" class="qty-btn">
                            +
                          </button>
                        </div>
                      </td>
                      <td class="subtotal-cell">₱{{ item.subtotal.toFixed(2) }}</td>
                      <td>
                        <button @click="removeFromCart(item.id)" class="remove-btn">
                          Remove
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div v-else class="empty-cart">
                <div class="empty-state">
                  <span class="empty-icon">🛒</span>
                  <h3>Your cart is empty</h3>
                  <p>Add some products to get started!</p>
                </div>
              </div>
            </div>
            
            <!-- Cart Summary -->
            <div v-if="cart.length > 0" class="cart-summary">
              <div class="summary-row">
                <span>Items:</span>
                <span>{{ cart.length }}</span>
              </div>
              <div class="summary-row">
                <span>Total Quantity:</span>
                <span>{{ totalQuantity }}</span>
              </div>
              <div class="summary-row total">
                <span>Total Amount:</span>
                <span class="total-amount">₱{{ cartTotal.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Checkout Section -->
        <div class="checkout-section">
          <button 
            @click="checkout" 
            :disabled="!canCheckout"
            class="checkout-btn"
            :class="{ 'pulse-animation': canCheckout }"
          >
            <span class="btn-icon">✅</span>
            <span class="btn-text">Complete Order</span>
            <span class="btn-total">₱{{ cartTotal.toFixed(2) }}</span>
          </button>
          
          <!-- Quick Actions for Mobile -->
          <div v-if="isMobile && cart.length > 0" class="quick-actions">
            <button @click="clearCart" class="quick-btn clear-btn">
              🗑️ Clear Cart
            </button>
            <button @click="scrollToProducts" class="quick-btn add-more-btn">
              ➕ Add More
            </button>
          </div>
        </div>
        
        <!-- Receipt -->
        <div v-if="lastSale" class="receipt-section card">
          <div class="receipt-content">
            <div class="receipt-header">
              <h3 class="receipt-title">🎉 Order Confirmed!</h3>
              <div class="receipt-badge">#{{ lastSale.id }}</div>
            </div>
            
            <div class="receipt-details">
              <div class="receipt-row">
                <span class="receipt-label">Customer:</span>
                <span class="receipt-value">{{ lastSale.customer_name }}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Date & Time:</span>
                <span class="receipt-value">{{ lastSale.created_at }}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Total Amount:</span>
                <span class="receipt-value total">₱{{ lastSale.total_amount }}</span>
              </div>
              
              <div class="receipt-actions">
                <button @click="printReceipt" class="print-btn">
                  🖨️ Print Receipt
                </button>
                <button @click="lastSale = null" class="close-btn">
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Order Guide -->
      <div class="content-right">
        <div class="order-guide card" :class="{ 'mobile-hidden': isMobile && !showOrderGuide }">
          <div class="guide-header" @click="toggleOrderGuide" v-if="isMobile">
            <h3>📋 How to Order</h3>
            <span class="toggle-icon">{{ showOrderGuide ? '−' : '+' }}</span>
          </div>
          
          <div class="guide-content" :class="{ 'show-guide': showOrderGuide || !isMobile }">
            <h3 class="guide-title desktop-title">📋 How to Order</h3>
            
            <ol class="steps-list">
              <li class="step-item">
                <span class="step-number">1</span>
                <span class="step-text">Select products from catalog</span>
              </li>
              <li class="step-item">
                <span class="step-number">2</span>
                <span class="step-text">Add items to your cart</span>
              </li>
              <li class="step-item">
                <span class="step-number">3</span>
                <span class="step-text">Enter customer information</span>
              </li>
              <li class="step-item">
                <span class="step-number">4</span>
                <span class="step-text">Complete order & checkout</span>
              </li>
              <li class="step-item">
                <span class="step-number">5</span>
                <span class="step-text">Pay upon delivery/pickup</span>
              </li>
            </ol>
            
            <!-- Live Cart Summary -->
            <div class="live-summary">
              <h4 class="summary-title">🛒 Live Cart Summary</h4>
              <div class="summary-items">
                <div class="summary-item">
                  <span>Items in cart:</span>
                  <span class="summary-value">{{ cart.length }}</span>
                </div>
                <div class="summary-item">
                  <span>Total quantity:</span>
                  <span class="summary-value">{{ totalQuantity }}</span>
                </div>
                <div class="summary-item total">
                  <span>Order total:</span>
                  <span class="summary-value total">₱{{ cartTotal.toFixed(2) }}</span>
                </div>
              </div>
              
              <!-- Stock Status -->
              <div class="stock-status">
                <h4 class="status-title">📊 Stock Status</h4>
                <div class="status-items">
                  <div class="status-item in-stock">
                    <span class="status-dot"></span>
                    <span>In Stock: {{ inStockCount }}</span>
                  </div>
                  <div class="status-item low-stock">
                    <span class="status-dot"></span>
                    <span>Low Stock: {{ lowStockCount }}</span>
                  </div>
                  <div class="status-item out-of-stock">
                    <span class="status-dot"></span>
                    <span>Out of Stock: {{ outOfStockCount }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="contact-info">
              <h4>📞 Contact Us</h4>
              <div class="contact-details">
                <p><span class="contact-icon">📱</span> 0912-345-6789</p>
                <p><span class="contact-icon">✉️</span> jrefoodhub@email.com</p>
                <p><span class="contact-icon">📍</span> Purok 2, Plaridel, Lipa, Batangas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Floating Action Button for Mobile -->
    <button 
      v-if="isMobile && cart.length > 0"
      @click="scrollToCheckout"
      class="fab-checkout"
      :class="{ 'show-fab': showFab }"
    >
      <span class="fab-icon">🛒</span>
      <span class="fab-count">{{ cart.length }}</span>
      <span class="fab-text">Checkout ₱{{ cartTotal.toFixed(2) }}</span>
    </button>
    
    <!-- Toast Notification -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      <span class="toast-icon">{{ toast.icon }}</span>
      <span class="toast-message">{{ toast.message }}</span>
    </div>
  </div>
</template>

<script>
import { reactive, computed, onMounted, ref, onUnmounted } from 'vue';
import { usePosStore } from '../store';
import axios from 'axios';

const API = 'http://localhost:3000';

export default {
  setup() {
    const store = usePosStore();
    const isMobile = ref(false);
    const showMobileMenu = ref(false);
    const showCustomerForm = ref(true);
    const showProducts = ref(true);
    const showCart = ref(true);
    const showOrderGuide = ref(true);
    const showFab = ref(false);
    const currentStep = ref(1);
    const lastScroll = ref(0);
    const toast = reactive({
      show: false,
      message: '',
      type: 'success',
      icon: '✅'
    });

    // Customer info
    const customer = reactive({
      name: '',
      address: ''
    });

    // Add lastSale reactive variable
    const lastSale = ref(null);

    // Check device type
    const checkDevice = () => {
      isMobile.value = window.innerWidth < 1024;
      if (!isMobile.value) {
        showMobileMenu.value = false;
        showCustomerForm.value = true;
        showProducts.value = true;
        showCart.value = true;
        showOrderGuide.value = true;
      }
    };

    // Fetch products
    const fetchProducts = async () => {
      await store.fetchProducts();
      store.products.forEach(p => {
        if (p.orderQty === undefined) p.orderQty = 1;
      });
    };

    onMounted(() => {
      fetchProducts();
      checkDevice();
      window.addEventListener('resize', checkDevice);
      window.addEventListener('scroll', handleScroll);
      
      // Auto-update progress based on form completion
      setInterval(updateProgress, 1000);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('scroll', handleScroll);
    });

    // Handle scroll for FAB
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      showFab.value = currentScroll > 200 && currentScroll > lastScroll.value;
      lastScroll.value = currentScroll;
    };

    // Update progress indicator
    const updateProgress = () => {
      let step = 1;
      if (customer.name.trim() && customer.address.trim()) step++;
      if (cart.value.length > 0) step++;
      currentStep.value = Math.min(step, 3);
    };

    // Toggle functions for mobile
    const toggleMobileMenu = () => {
      showMobileMenu.value = !showMobileMenu.value;
    };

    const toggleSection = (section) => {
      switch(section) {
        case 'customer':
          showCustomerForm.value = !showCustomerForm.value;
          break;
        case 'products':
          showProducts.value = !showProducts.value;
          break;
        case 'cart':
          showCart.value = !showCart.value;
          break;
      }
    };

    const toggleOrderGuide = () => {
      showOrderGuide.value = !showOrderGuide.value;
    };

    // Toast notification
    const showToast = (message, type = 'success') => {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      
      toast.message = message;
      toast.type = type;
      toast.icon = icons[type] || icons.info;
      toast.show = true;

      setTimeout(() => {
        toast.show = false;
      }, 3000);
    };

    // Card animation handler
    const onCardAnimation = (event) => {
      if (event.animationName === 'cardAppear') {
        event.target.classList.add('animated');
      }
    };

    // Scroll functions
    const scrollToProducts = () => {
      document.querySelector('.products-section')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    };

    const scrollToCheckout = () => {
      document.querySelector('.checkout-section')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    };

    // Reactive products & cart
    const products = computed(() => store.products);
    const cart = computed(() => store.cart);
    
    // New computed property for total quantity
    const totalQuantity = computed(() => {
      return cart.value.reduce((sum, item) => sum + item.qty, 0);
    });

    // Stock status counts
    const inStockCount = computed(() => {
      return products.value.filter(p => p.stocks >= 10).length;
    });

    const lowStockCount = computed(() => {
      return products.value.filter(p => p.stocks > 0 && p.stocks < 10).length;
    });

    const outOfStockCount = computed(() => {
      return products.value.filter(p => p.stocks === 0).length;
    });

    const getProductStock = (productId) => {
      const product = store.products.find(p => p.id === productId);
      return product ? product.stocks : 0;
    };

    // Product quantity controls
    const decreaseProductQty = (product) => {
      if (product.orderQty > 1) {
        product.orderQty--;
      }
    };

    const increaseProductQty = (product) => {
      if (product.orderQty < product.stocks) {
        product.orderQty++;
      }
    };

    const addToCart = (product) => {
      if (product.orderQty < 1) {
        showToast('Quantity must be at least 1', 'warning');
        return;
      }
      if (product.orderQty > product.stocks) {
        showToast(`Only ${product.stocks} items available in stock`, 'warning');
        return;
      }
      
      // Check if product already in cart
      const existingItem = store.cart.find(item => item.id === product.id);
      const totalRequested = (existingItem ? existingItem.qty : 0) + product.orderQty;
      
      if (totalRequested > product.stocks) {
        showToast(`Cannot add more than available stock (${product.stocks})`, 'warning');
        return;
      }
      
      store.addToCart({ 
        ...product, 
        qty: product.orderQty 
      });
      product.orderQty = 1; // reset after adding
      showToast(`${product.name} added to cart!`, 'success');
      updateProgress();
    };

    const increaseQty = (id) => {
      const item = store.cart.find(item => item.id === id);
      if (item) {
        const product = store.products.find(p => p.id === id);
        if (product && item.qty < product.stocks) {
          store.increaseQty(id);
          updateProgress();
        } else {
          showToast(`Only ${product.stocks} items available in stock`, 'warning');
        }
      }
    };

    const decreaseQty = (id) => {
      store.decreaseQty(id);
      updateProgress();
    };

    const removeFromCart = (id) => {
      store.removeFromCart(id);
      showToast('Item removed from cart', 'info');
      updateProgress();
    };

    const clearCart = () => {
      if (confirm('Are you sure you want to clear the cart?')) {
        store.clearCart();
        showToast('Cart cleared', 'info');
        updateProgress();
      }
    };

    const cartTotal = computed(() => store.cartTotal);

    const canCheckout = computed(() => 
      cart.value.length > 0 &&
      customer.name.trim() !== '' &&
      customer.address.trim() !== ''
    );

    const printReceipt = () => {
      window.print();
    };

    const checkout = async () => {
      if (!canCheckout.value) {
        showToast('Please fill customer information and add items to cart', 'warning');
        return;
      }

      const sale_items = cart.value.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.qty,
        unit_price: item.price
      }));

      try {
        const response = await axios.post(`${API}/sales`, { 
          customer_name: customer.name,
          customer_address: customer.address,
          sale_items 
        });

        console.log('Backend response:', response.data);
        
        const saleId = response.data.sale_id || response.data.saleId || response.data.id || 'N/A';
        const saleDate = new Date().toLocaleString('en-PH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Set lastSale data for receipt display
        lastSale.value = {
          id: saleId,
          customer_name: customer.name,
          created_at: saleDate,
          total_amount: cartTotal.value.toFixed(2)
        };
        
        showToast(`Order #${saleId} confirmed! Total: ₱${cartTotal.value.toFixed(2)}`, 'success');
        
        await store.fetchProducts();
        store.clearCart();
        customer.name = '';
        customer.address = '';
        updateProgress();
        
        // Scroll to receipt
        setTimeout(() => {
          document.querySelector('.receipt-section')?.scrollIntoView({ 
            behavior: 'smooth' 
          });
        }, 500);
        
      } catch (err) {
        console.error('Checkout error:', err);
        if (err.response?.data?.error) {
          showToast(`Error: ${err.response.data.error}`, 'error');
        } else {
          showToast('Failed to complete order. Please try again.', 'error');
        }
      }
    };

    return {
      customer,
      products,
      cart,
      lastSale,
      totalQuantity,
      cartTotal,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      isMobile,
      showMobileMenu,
      showCustomerForm,
      showProducts,
      showCart,
      showOrderGuide,
      showFab,
      currentStep,
      toast,
      addToCart,
      increaseQty,
      decreaseQty,
      removeFromCart,
      decreaseProductQty,
      increaseProductQty,
      getProductStock,
      canCheckout,
      checkout,
      printReceipt,
      clearCart,
      toggleMobileMenu,
      toggleSection,
      toggleOrderGuide,
      scrollToProducts,
      scrollToCheckout,
      onCardAnimation,
      updateProgress
    };
  }
};
</script>

<style scoped>
.sales-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  position: relative;
}

/* Header Styles */
.customer-header {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border-radius: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
  overflow: hidden;
}

.header-content {
  padding: 25px 30px;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h1 {
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.mobile-toggle {
  font-size: 1.8rem;
  cursor: pointer;
  padding: 5px;
  user-select: none;
}

.customer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  transition: all 0.3s ease;
}

.customer-info.show-mobile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255,255,255,0.2);
}

.welcome-text {
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0.95;
}

.store-info {
  display: flex;
  gap: 25px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.store-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.store-icon {
  font-size: 1.1rem;
}

.store-text {
  font-size: 0.9rem;
}

/* Progress Indicator */
.progress-indicator {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 20px 30px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.progress-step.active {
  opacity: 1;
}

.step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.progress-step.active .step-number {
  background: white;
  color: #3b82f6;
  box-shadow: 0 4px 10px rgba(255,255,255,0.3);
}

.step-label {
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
}

/* Main Content Layout */
.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  margin-top: 20px;
}

@media (max-width: 1023px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .content-right {
    order: -1;
  }
}

/* Card Styles */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  margin-bottom: 25px;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: cardAppear 0.5s ease-out;
}

.card.animated {
  animation: none;
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card:hover:not(.mobile-hidden) {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.12);
}

.card-header {
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.card-header:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.card-body {
  padding: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.4s ease;
}

.card-body.show-section {
  padding: 25px;
  max-height: 5000px;
}

.section-title {
  color: #1e293b;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.desktop-title {
  margin-bottom: 20px;
}

.toggle-icon {
  font-size: 1.5rem;
  font-weight: 300;
  color: #64748b;
  transition: transform 0.3s ease;
}

.card-header:hover .toggle-icon {
  color: #3b82f6;
}

/* Form Styles */
.form-group {
  display: flex;
  gap: 20px;
}

.form-group.mobile-layout {
  flex-direction: column;
  gap: 15px;
}

.input-group {
  flex: 1;
}

.input-label {
  display: block;
  color: #475569;
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Products Section */
.products-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 15px;
  transition: all 0.3s;
}

.product-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.product-card.out-of-stock {
  opacity: 0.6;
  background: #f8fafc;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.product-details {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: #64748b;
}

.product-pricing {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.product-price {
  font-size: 1.2rem;
  font-weight: 700;
  color: #059669;
}

.product-stock {
  font-size: 0.9rem;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 20px;
  background: #f0f9ff;
  color: #0369a1;
}

.product-stock.low-stock {
  background: #fef2f2;
  color: #dc2626;
}

.product-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.qty-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-input {
  width: 50px;
  text-align: center;
  padding: 8px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
}

.add-to-cart-btn {
  flex: 1;
  padding: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.add-to-cart-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
}

.add-to-cart-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Desktop Table Styles */
.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

th {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #475569;
  font-weight: 600;
  padding: 16px;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
}

td {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

tr:hover {
  background-color: #f8fafc;
}

.table-qty-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-qty-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.table-qty-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.table-qty-input {
  width: 60px;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  text-align: center;
}

.add-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.add-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.add-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Cart Styles */
.cart-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cart-count-badge {
  background: #3b82f6;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  min-width: 24px;
  text-align: center;
}

.cart-header-desktop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.cart-items-mobile {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.cart-item-mobile {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 15px;
}

.cart-item-info {
  margin-bottom: 15px;
}

.item-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 5px;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #64748b;
  font-size: 0.9rem;
}

.item-price {
  font-weight: 500;
  color: #059669;
}

.cart-item-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-qty-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cart-qty-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-qty-display {
  min-width: 40px;
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.cart-item-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.item-subtotal {
  font-size: 1.2rem;
  font-weight: 700;
  color: #059669;
}

.remove-item-btn {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.remove-item-btn:hover {
  background: #dc2626;
  color: white;
}

.product-cell {
  min-width: 200px;
}

.product-info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-details-cell {
  font-size: 0.9rem;
  color: #64748b;
}

.subtotal-cell {
  font-weight: 700;
  color: #059669;
}

.remove-btn {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.remove-btn:hover {
  background: #dc2626;
  color: white;
}

/* Cart Summary */
.cart-summary {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  border: 1px solid #e2e8f0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.total {
  font-size: 1.2rem;
  font-weight: 700;
}

.total-amount {
  color: #059669;
  font-size: 1.3rem;
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 15px;
  display: inline-block;
}

.empty-state h3 {
  color: #475569;
  margin-bottom: 8px;
}

.empty-state p {
  color: #64748b;
  font-size: 1rem;
}

/* Checkout Section */
.checkout-section {
  margin-top: 20px;
  text-align: right;
}

.checkout-btn {
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.checkout-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.checkout-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-text {
  flex: 1;
  text-align: center;
}

.btn-total {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 1.1rem;
}

.quick-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.quick-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.clear-btn {
  background: #fee2e2;
  color: #dc2626;
}

.clear-btn:hover {
  background: #dc2626;
  color: white;
}

.add-more-btn {
  background: #f0f9ff;
  color: #0369a1;
}

.add-more-btn:hover {
  background: #0369a1;
  color: white;
}

/* Receipt Section */
.receipt-section {
  border: 2px solid #3b82f6;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.receipt-content {
  padding: 25px;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.receipt-title {
  color: #1e293b;
  font-size: 1.5rem;
  margin: 0;
}

.receipt-badge {
  background: #3b82f6;
  color: white;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 1.1rem;
}

.receipt-details {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.receipt-row:last-child {
  border-bottom: none;
}

.receipt-label {
  color: #475569;
  font-weight: 500;
}

.receipt-value {
  color: #1e293b;
  font-weight: 600;
}

.receipt-value.total {
  color: #059669;
  font-size: 1.2rem;
}

.receipt-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.print-btn, .close-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.print-btn {
  background: #3b82f6;
  color: white;
}

.print-btn:hover {
  background: #2563eb;
}

.close-btn {
  background: #e2e8f0;
  color: #475569;
}

.close-btn:hover {
  background: #cbd5e1;
}

/* Order Guide */
.order-guide {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
}

.order-guide.mobile-hidden {
  margin-bottom: 0;
}

.order-guide.mobile-hidden .card-header {
  border-radius: 16px;
}

.guide-header {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.guide-header h3 {
  color: white;
  margin: 0;
  font-size: 1.2rem;
}

.guide-content {
  padding: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.4s ease;
}

.guide-content.show-guide {
  padding: 25px;
  max-height: 5000px;
}

.guide-title {
  color: white;
  margin-bottom: 25px;
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0 0 30px 0;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.step-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.step-number {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.step-text {
  font-size: 0.95rem;
  line-height: 1.5;
}

.live-summary {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
}

.summary-title {
  color: white;
  font-size: 1.1rem;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-value {
  font-weight: 600;
}

.summary-value.total {
  color: #10b981;
  font-size: 1.1rem;
}

.stock-status {
  margin-top: 20px;
}

.status-title {
  color: white;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.status-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-item.in-stock .status-dot {
  background: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.status-item.low-stock .status-dot {
  background: #f59e0b;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
}

.status-item.out-of-stock .status-dot {
  background: #ef4444;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

.contact-info {
  margin-top: 25px;
  padding-top: 25px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.contact-info h4 {
  color: white;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-details p {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 0.9rem;
  color: #cbd5e1;
}

.contact-icon {
  font-size: 1.1rem;
  opacity: 0.8;
}

/* FAB for Mobile */
.fab-checkout {
  position: fixed;
  bottom: 30px;
  right: 20px;
  left: 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 18px 24px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(100px);
  z-index: 1000;
}

.fab-checkout.show-fab {
  opacity: 1;
  transform: translateY(0);
}

.fab-icon {
  font-size: 1.3rem;
}

.fab-count {
  background: rgba(255, 255, 255, 0.3);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
  min-width: 24px;
  text-align: center;
}

.fab-text {
  flex: 1;
  text-align: center;
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: toastSlideIn 0.3s ease-out forwards;
  z-index: 1001;
  max-width: 90%;
}

.toast.success {
  border-left: 4px solid #10b981;
}

.toast.error {
  border-left: 4px solid #ef4444;
}

.toast.warning {
  border-left: 4px solid #f59e0b;
}

.toast.info {
  border-left: 4px solid #3b82f6;
}

.toast-icon {
  font-size: 1.2rem;
}

.toast-message {
  font-weight: 500;
  color: #1e293b;
}

@keyframes toastSlideIn {
  to {
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes pulse-animation {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

.pulse-animation {
  animation: pulse-animation 2s infinite;
}

/* Responsive Breakpoints */
@media (max-width: 1023px) {
  .sales-page {
    padding: 15px;
  }
  
  .customer-header {
    border-radius: 16px;
    margin-bottom: 20px;
  }
  
  .header-content {
    padding: 20px;
  }
  
  h1 {
    font-size: 1.8rem;
  }
  
  .store-info {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .progress-indicator {
    padding: 15px 20px;
    gap: 20px;
  }
  
  .step-number {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }
  
  .step-label {
    font-size: 0.8rem;
  }
  
  .card {
    border-radius: 14px;
    margin-bottom: 20px;
  }
  
  .card-header {
    padding: 16px;
  }
  
  .card-body.show-section {
    padding: 20px;
  }
  
  .section-title {
    font-size: 1.2rem;
  }
  
  .form-input, .qty-input, .table-qty-input {
    padding: 12px;
  }
  
  .checkout-btn {
    padding: 16px;
    font-size: 1.1rem;
  }
}

@media (max-width: 767px) {
  .sales-page {
    padding: 12px;
  }
  
  h1 {
    font-size: 1.6rem;
  }
  
  .welcome-text {
    font-size: 1rem;
  }
  
  .store-text {
    font-size: 0.85rem;
  }
  
  .progress-indicator {
    gap: 10px;
    padding: 12px 15px;
  }
  
  .step-label {
    font-size: 0.75rem;
  }
  
  .form-group.mobile-layout {
    gap: 12px;
  }
  
  .product-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .quantity-selector {
    width: 100%;
    justify-content: center;
  }
  
  .add-to-cart-btn {
    width: 100%;
  }
  
  .cart-item-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .cart-item-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .fab-checkout {
    bottom: 20px;
    left: 12px;
    right: 12px;
    padding: 16px 20px;
    font-size: 1rem;
  }
  
  .toast {
    bottom: 80px;
    padding: 14px 20px;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .sales-page {
    padding: 10px;
  }
  
  .customer-header {
    border-radius: 14px;
    margin-bottom: 15px;
  }
  
  .header-content {
    padding: 16px;
  }
  
  h1 {
    font-size: 1.4rem;
  }
  
  .mobile-toggle {
    font-size: 1.5rem;
  }
  
  .card-header {
    padding: 14px;
  }
  
  .card-body.show-section {
    padding: 16px;
  }
  
  .section-title {
    font-size: 1.1rem;
  }
  
  .form-input {
    padding: 10px 12px;
  }
  
  .product-card {
    padding: 12px;
  }
  
  .checkout-btn {
    padding: 14px;
    font-size: 1rem;
  }
  
  .fab-checkout {
    bottom: 15px;
    left: 10px;
    right: 10px;
    padding: 14px 16px;
    font-size: 0.95rem;
  }
}

/* Print Styles */
@media print {
  .customer-header,
  .content-right,
  .checkout-section,
  .customer-form,
  .products-section,
  .cart-section,
  .fab-checkout,
  .toast {
    display: none !important;
  }
  
  .receipt-section {
    display: block !important;
    border: 2px solid #000;
    margin: 0;
    padding: 20px;
    box-shadow: none;
    background: white !important;
    color: #000 !important;
  }
  
  .receipt-section h3 {
    color: #000 !important;
  }
  
  .receipt-details {
    background: white;
    border: 1px solid #ccc;
  }
  
  .print-btn,
  .close-btn {
    display: none !important;
  }
}
</style>