<template>
  <div class="dashboard">
    <h1>📊 POS Dashboard</h1>
    
    <!-- Date Filter -->
    <div class="date-filter">
      <select v-model="timeFilter" @change="fetchDashboardData">
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="all">All Time</option>
      </select>
      <button @click="refreshData" class="refresh-btn" :disabled="loading">
        🔄 {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <!-- Total Sales -->
      <div class="stat-card sales-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <h3>Total Sales</h3>
          <p class="stat-value">₱{{ totalSalesAmount.toFixed(2) }}</p>
          <p class="stat-sub">{{ totalSalesCount }} transaction(s)</p>
          <p class="stat-trend" v-if="salesTrend">
            {{ salesTrend > 0 ? '↑' : '↓' }} {{ Math.abs(salesTrend) }}% from last period
          </p>
        </div>
      </div>

      <!-- Today's Sales -->
      <div class="stat-card today-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <h3>Today's Sales</h3>
          <p class="stat-value">₱{{ todaySales.toFixed(2) }}</p>
          <p class="stat-sub">{{ todayCount }} sale(s) today</p>
          <p class="stat-trend">
            Average: ₱{{ avgSaleAmount.toFixed(2) }}
          </p>
        </div>
      </div>

      <!-- Inventory Status -->
      <div class="stat-card inventory-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <h3>Inventory</h3>
          <p class="stat-value">{{ totalProducts }}</p>
          <p class="stat-sub">Products in stock</p>
          <p class="stat-trend" :class="{ 'warning': lowStockCount > 0 }">
            {{ lowStockCount }} low stock item(s)
          </p>
        </div>
      </div>

      <!-- Top Product -->
      <div class="stat-card top-product-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-content">
          <h3>Top Product</h3>
          <p class="stat-value" v-if="topProduct">{{ topProduct.name }}</p>
          <p class="stat-sub" v-if="topProduct">
            Sold: {{ topProduct.sold }} units
          </p>
          <p class="stat-trend" v-if="topProduct">
            Revenue: ₱{{ (topProduct.revenue || 0).toFixed(2) }}
          </p>
          <p v-else class="stat-sub">No sales data</p>
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="recent-section">
      <div class="section-header">
        <h2>🕒 Recent Transactions</h2>
        <router-link to="/sales-history" class="view-all">View All →</router-link>
      </div>
      
      <div v-if="loading" class="loading">Loading recent sales...</div>
      <div v-else-if="recentSales.length === 0" class="no-data">
        No recent transactions
      </div>
      <table v-else class="recent-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Time</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sale in recentSales" :key="sale.id">
            <td><strong>#{{ sale.id }}</strong></td>
            <td>{{ sale.customer_name }}</td>
            <td>{{ formatTime(sale.created_at) }}</td>
            <td>{{ sale.items_count || 1 }} item(s)</td>
            <td class="amount">₱{{ Number(sale.total_amount || 0).toFixed(2) }}</td>
            <td>
              <span :class="['status', sale.status || 'pending']">
                {{ sale.status || 'pending' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Low Stock Alert -->
    <div v-if="lowStock.length > 0" class="alert-section">
      <div class="section-header">
        <h2>⚠️ Low Stock Alert</h2>
        <router-link to="/inventory" class="view-all">Manage Inventory →</router-link>
      </div>
      <div class="alert-grid">
        <div v-for="product in lowStock" :key="product.id" class="alert-item">
          <div class="alert-product">
            <span class="product-name">{{ product.name }}</span>
            <span class="product-stock" :class="{ 'critical': product.stocks <= 5 }">
              {{ product.stocks }} left
            </span>
          </div>
          <div class="product-details">
            <span>Price: ₱{{ product.price?.toFixed(2) }}</span>
            <span>Category: {{ product.category || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2>⚡ Quick Actions</h2>
      <div class="action-buttons">
        <router-link to="/sales" class="action-btn primary">
          💰 New Sale
        </router-link>
        <router-link to="/products" class="action-btn secondary">
          📦 Add Product
        </router-link>
        <router-link to="/inventory" class="action-btn secondary">
          📊 View Inventory
        </router-link>
        <button @click="printDailyReport" class="action-btn secondary">
          📄 Daily Report
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePosStore } from '../store/index';
import axios from 'axios';

const API = 'http://localhost:3000';
const store = usePosStore();
const loading = ref(false);
const timeFilter = ref('today');
const dashboardData = ref({
  sales: [],
  todaySales: [],
  products: [],
  topProduct: null
});

// Fetch all dashboard data
const fetchDashboardData = async () => {
  loading.value = true;
  try {
    // Fetch sales data with time filter
    const salesRes = await axios.get(`${API}/sales-history`);
    dashboardData.value.sales = salesRes.data;
    
    // Fetch today's sales
    const todayRes = await axios.get(`${API}/sales-today`);
    dashboardData.value.todaySales = todayRes.data;
    
    // Fetch products
    await store.fetchProducts();
    
    // Calculate top product
    calculateTopProduct();
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

// Calculate top selling product
const calculateTopProduct = () => {
  const productSales = {};
  
  // Group sales by product
  dashboardData.value.sales.forEach(sale => {
    // This would need sale items data for accurate calculation
    // For now, we'll use a simplified version
  });
  
  // Find product with most sales
  // For now, return first product or null
  dashboardData.value.topProduct = store.products[0] || null;
};

// Computed properties
const totalSalesCount = computed(() => dashboardData.value.sales.length);
const totalSalesAmount = computed(() => 
  dashboardData.value.sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0)
);
const todaySales = computed(() => 
  dashboardData.value.todaySales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0)
);
const todayCount = computed(() => dashboardData.value.todaySales.length);
const avgSaleAmount = computed(() => 
  todayCount.value > 0 ? todaySales.value / todayCount.value : 0
);
const totalProducts = computed(() => store.products.length);
const lowStock = computed(() => 
  store.products.filter(p => p.stocks < 10) // Low stock threshold: 10
);
const lowStockCount = computed(() => lowStock.value.length);
const recentSales = computed(() => 
  dashboardData.value.sales.slice(0, 5) // Last 5 sales
);
const salesTrend = computed(() => {
  // Calculate sales trend (simplified)
  if (dashboardData.value.sales.length < 2) return 0;
  return 12.5; // Placeholder - implement real calculation
});

// Top product (simplified)
const topProduct = computed(() => {
  if (store.products.length === 0) return null;
  
  // Find product with most sales (simplified)
  return {
    name: store.products[0].name,
    sold: 15, // Placeholder
    revenue: 450 // Placeholder
  };
});

// Helper functions
const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const refreshData = () => {
  fetchDashboardData();
  store.fetchProducts();
};

const printDailyReport = () => {
  window.print();
};

// Lifecycle
onMounted(() => {
  fetchDashboardData();
  store.fetchProducts();
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 2rem;
}

.date-filter {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  align-items: center;
}

.date-filter select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  min-width: 150px;
}

.refresh-btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 2.5rem;
  display: flex;
  align-items: center;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 5px 0;
  color: #2c3e50;
}

.stat-sub {
  color: #7f8c8d;
  margin: 5px 0;
  font-size: 0.9rem;
}

.stat-trend {
  font-size: 0.85rem;
  margin: 5px 0 0 0;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
}

.stat-trend.warning {
  background: #fff3cd;
  color: #856404;
}

/* Card Colors */
.sales-card { border-left: 4px solid #2ecc71; }
.today-card { border-left: 4px solid #3498db; }
.inventory-card { border-left: 4px solid #f39c12; }
.top-product-card { border-left: 4px solid #9b59b6; }

/* Recent Transactions */
.recent-section, .alert-section, .quick-actions {
  background: white;
  border-radius: 10px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.view-all {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.view-all:hover {
  text-decoration: underline;
}

/* Recent Table */
.recent-table {
  width: 100%;
  border-collapse: collapse;
}

.recent-table th {
  text-align: left;
  padding: 12px 15px;
  background: #f8f9fa;
  color: #7f8c8d;
  font-weight: 600;
  border-bottom: 2px solid #eee;
}

.recent-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
}

.recent-table tr:hover {
  background: #f8f9fa;
}

.amount {
  font-weight: bold;
  color: #2c3e50;
}

.status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
}

.status.completed {
  background: #d4edda;
  color: #155724;
}

/* Alert Section */
.alert-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.alert-item {
  padding: 15px;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  background: #fff9e6;
}

.alert-product {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.product-name {
  font-weight: 600;
  color: #2c3e50;
}

.product-stock {
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
}

.product-stock.critical {
  background: #f8d7da;
  color: #721c24;
}

.product-details {
  display: flex;
  justify-content: space-between;
  color: #7f8c8d;
  font-size: 0.9rem;
}

/* Quick Actions */
.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 15px 25px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #2ecc71;
  color: white;
  border: none;
}

.action-btn.secondary {
  background: #f8f9fa;
  color: #2c3e50;
  border: 1px solid #ddd;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.action-btn.primary:hover {
  background: #27ae60;
}

.action-btn.secondary:hover {
  background: #e9ecef;
}

/* Loading & No Data */
.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    text-align: center;
    justify-content: center;
  }
  
  .recent-table {
    font-size: 0.9rem;
  }
  
  .recent-table th, 
  .recent-table td {
    padding: 8px 10px;
  }
}
</style>