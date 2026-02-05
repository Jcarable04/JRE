<template>
  <div class="inventory-page">
    <!-- Enhanced Header with Gradient and Stats -->
    <header class="inventory-header">
      <div class="header-gradient"></div>
      <div class="header-content">
        <div class="header-title">
          <div class="title-icon">🏢</div>
          <div>
            <h1>JRE Inventory Management</h1>
            <p class="subtitle">Track and manage inventory across multiple companies</p>
          </div>
        </div>
        
        <!-- Enhanced Quick Stats -->
        <div class="quick-stats-grid">
          <div class="stat-card gradient-1">
            <div class="stat-icon-bg">
              <div class="stat-icon">🏢</div>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ totalCompanies }}</span>
              <span class="stat-label">Companies</span>
            </div>
            <div class="stat-trend" v-if="totalCompanies > 0">✓ Active</div>
          </div>
          
          <div class="stat-card gradient-2">
            <div class="stat-icon-bg">
              <div class="stat-icon">📦</div>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ totalItems }}</span>
              <span class="stat-label">Total Items</span>
            </div>
            <div class="stat-trend" v-if="totalItems > 0">📈</div>
          </div>
          
          <div class="stat-card gradient-3">
            <div class="stat-icon-bg">
              <div class="stat-icon">💰</div>
            </div>
            <div class="stat-info">
              <span class="stat-number">₱{{ formatCurrency(totalInventoryValue) }}</span>
              <span class="stat-label">Total Value</span>
            </div>
            <div class="stat-trend" v-if="totalInventoryValue > 0">💎</div>
          </div>
          
          <div class="stat-card gradient-4">
            <div class="stat-icon-bg">
              <div class="stat-icon">⚠️</div>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ lowStockItems }}</span>
              <span class="stat-label">Low Stock</span>
            </div>
            <div class="stat-trend warning" v-if="lowStockItems > 0">Needs attention</div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="main-content-container">
      <!-- Sidebar with Glass Effect -->
      <aside class="sidebar glass-effect">
        <div class="sidebar-header">
          <div class="sidebar-title">
            <h3>🏢 Companies</h3>
            <span class="badge">{{ totalCompanies }}</span>
          </div>
          <button @click="showAddCompany = true" class="add-btn floating">
            <span class="btn-icon">+</span>
            <span class="btn-text">Add Company</span>
          </button>
        </div>
        
        <!-- Search with Icon -->
        <div class="search-container">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              v-model="companySearch"
              @input="searchCompanies"
              placeholder="Search companies..."
              class="search-input"
            />
            <button v-if="companySearch" @click="companySearch = ''; searchCompanies()" class="clear-search">
              ✕
            </button>
          </div>
        </div>
        
        <!-- Enhanced Company List -->
        <div class="company-list-container">
          <div v-if="filteredCompanies.length === 0" class="empty-state">
            <div class="empty-icon">🏢</div>
            <p>No companies found</p>
            <button @click="showAddCompany = true" class="empty-action-btn">
              + Add Company
            </button>
          </div>
          
          <div v-else class="company-list">
            <div 
              v-for="company in filteredCompanies"
              :key="company.id"
              @click="selectCompany(company)"
              class="company-card"
              :class="{ 
                'active': selectedCompany?.id === company.id,
                'has-low-stock': getCompanyLowStockCount(company) > 0
              }"
            >
              <div class="company-card-header">
                <div class="company-avatar-wrapper">
                  <div class="company-avatar" :style="{ background: getCompanyColor(company.name) }">
                    {{ getCompanyInitials(company.name) }}
                  </div>
                  <div class="company-status" :class="getStockStatusClass(company.stockStatus)"></div>
                </div>
                
                <div class="company-meta">
                  <h4 class="company-name">{{ company.name }}</h4>
                  <div class="company-tags">
                    <span class="tag">
                      <span class="tag-icon">📦</span>
                      {{ company.item_count || 0 }} items
                    </span>
                    <span class="tag" :class="getStockStatusClass(company.stockStatus)">
                      {{ company.stockStatus || 'Good' }}
                    </span>
                  </div>
                </div>
                
                <div class="company-actions">
                  <button @click.stop="editCompany(company)" class="icon-btn edit">
                    <span>✏️</span>
                  </button>
                  <button @click.stop="deleteCompany(company.id)" class="icon-btn delete">
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
              
              <div v-if="company.items && company.items.length > 0" class="company-stats">
                <div class="stat-mini">
                  <span class="stat-label">Value:</span>
                  <span class="stat-value">₱{{ formatCurrency(getCompanyValue(company)) }}</span>
                </div>
                <div class="stat-mini">
                  <span class="stat-label">Low Stock:</span>
                  <span class="stat-value warning">{{ getCompanyLowStockCount(company) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Inventory Area -->
      <main class="main-content">
        <!-- Selected Company Header -->
        <div v-if="selectedCompany" class="company-dashboard">
          <div class="dashboard-header">
            <div class="company-profile">
              <div class="company-avatar-large" :style="{ background: getCompanyColor(selectedCompany.name) }">
                {{ getCompanyInitials(selectedCompany.name) }}
              </div>
              <div class="company-info">
                <div class="company-title">
                  <h2>{{ selectedCompany.name }}</h2>
                  <span class="company-badge" :class="getStockStatusClass(selectedCompany.stockStatus)">
                    {{ selectedCompany.stockStatus || 'Good' }}
                  </span>
                </div>
                <div class="company-contact">
                  <div class="contact-item" v-if="selectedCompany.email">
                    <span class="contact-icon">📧</span>
                    <span class="contact-text">{{ selectedCompany.email }}</span>
                  </div>
                  <div class="contact-item" v-if="selectedCompany.phone">
                    <span class="contact-icon">📱</span>
                    <span class="contact-text">{{ selectedCompany.phone }}</span>
                  </div>
                  <div class="contact-item" v-if="selectedCompany.address">
                    <span class="contact-icon">📍</span>
                    <span class="contact-text">{{ selectedCompany.address }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="dashboard-actions">
              <div class="action-group">
                <button @click="showAddItem = true" class="action-btn primary">
                  <span class="btn-icon">+</span>
                  Add Item
                </button>
                <button @click="exportCompanyInventory" class="action-btn secondary">
                  <span class="btn-icon">📥</span>
                  Export
                </button>
                <button @click="fetchCompanyStats" class="action-btn stats">
                  <span class="btn-icon">📊</span>
                  Stats
                </button>
                <button @click="deselectCompany" class="action-btn danger">
                  <span class="btn-icon">✕</span>
                  Close
                </button>
              </div>
            </div>
          </div>

          <!-- Inventory Controls -->
          <div class="inventory-controls-panel">
            <div class="controls-section">
              <h3 class="section-title">
                <span class="title-icon">📦</span>
                Inventory Items
                <span class="item-count">({{ filteredItems.length }})</span>
              </h3>
              
              <div class="view-switcher">
                <button 
                  @click="setView('grid')"
                  class="view-btn"
                  :class="{ 'active': viewMode === 'grid' }"
                >
                  <span class="view-icon">🟦</span>
                  Grid
                </button>
                <button 
                  @click="setView('table')"
                  class="view-btn"
                  :class="{ 'active': viewMode === 'table' }"
                >
                  <span class="view-icon">📋</span>
                  Table
                </button>
              </div>
            </div>
            
            <div class="controls-section">
              <div class="search-filter-group">
                <div class="search-wrapper">
                  <span class="search-icon">🔍</span>
                  <input 
                    v-model="itemSearch"
                    @input="searchItems"
                    placeholder="Search items..."
                    class="search-input"
                  />
                </div>
                
                <select v-model="filterBy" class="filter-select">
                  <option value="all">All Items</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="in-stock">In Stock</option>
                </select>
                
                <button @click="refreshInventory" class="refresh-btn">
                  <span class="btn-icon">🔄</span>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <!-- Grid View -->
          <div v-if="viewMode === 'grid' && filteredItems.length > 0" class="inventory-grid">
            <div 
              v-for="item in filteredItems"
              :key="item.id"
              class="inventory-card"
              :class="{
                'low-stock': item.quantity <= (item.low_stock_threshold || 10),
                'out-of-stock': item.quantity === 0
              }"
            >
              <div class="card-header">
                <div class="item-category">{{ item.category || 'Uncategorized' }}</div>
                <div class="item-actions">
                  <button @click="editItem(item)" class="card-btn edit">
                    ✏️
                  </button>
                  <button @click="deleteItem(item.id)" class="card-btn delete">
                    🗑️
                  </button>
                </div>
              </div>
              
              <div class="card-body">
                <h4 class="item-title">{{ item.name }}</h4>
                <p class="item-description" v-if="item.description">
                  {{ item.description }}
                </p>
                
                <div class="item-meta">
                  <div class="meta-item">
                    <span class="meta-label">SKU:</span>
                    <span class="meta-value">{{ item.sku || 'N/A' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Last Updated:</span>
                    <span class="meta-value">{{ formatDate(item.last_updated) }}</span>
                  </div>
                </div>
                
                <div class="item-stats">
                  <div class="stat-item">
                    <div class="stat-label">Quantity</div>
                    <div class="stat-value">{{ item.quantity }} {{ item.unit }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">Unit Price</div>
                    <div class="stat-value">₱{{ formatPrice(item) }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">Total Value</div>
                    <div class="stat-value total">₱{{ formatTotal(item) }}</div>
                  </div>
                </div>
                
                <!-- Stock Indicator -->
                <div class="stock-indicator">
                  <div class="stock-label">{{ getStockStatusText(item) }}</div>
                  <div class="stock-bar">
                    <div 
                      class="stock-fill"
                      :style="{ width: getStockPercentage(item) + '%' }"
                      :class="getStockClass(item)"
                    ></div>
                  </div>
                  <div class="stock-info">
                    <span>Threshold: {{ item.low_stock_threshold || 10 }}</span>
                  </div>
                </div>
              </div>
              
              <div class="card-footer">
                <button @click="adjustStock(item, 'increase')" class="action-btn success">
                  <span class="btn-icon">➕</span>
                  Add Stock
                </button>
                <button @click="adjustStock(item, 'decrease')" class="action-btn warning">
                  <span class="btn-icon">➖</span>
                  Reduce
                </button>
                <button @click="quickAdjust(item.id, 1)" class="action-btn quick-add">
                  <span class="btn-icon">+1</span>
                </button>
                <button @click="quickAdjust(item.id, -1)" class="action-btn quick-remove">
                  <span class="btn-icon">-1</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Table View -->
          <div v-if="viewMode === 'table' && filteredItems.length > 0" class="inventory-table-container">
            <div class="table-responsive">
              <table class="inventory-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Value</th>
                    <th>Stock Status</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="item in filteredItems"
                    :key="item.id"
                    :class="getStockClass(item)"
                  >
                    <td class="item-cell">
                      <div class="item-info">
                        <div class="item-name">{{ item.name }}</div>
                        <div v-if="item.description" class="item-desc">{{ item.description }}</div>
                        <div v-if="item.sku" class="item-sku">SKU: {{ item.sku }}</div>
                      </div>
                    </td>
                    <td>{{ item.category || '—' }}</td>
                    <td>
                      <div class="quantity-cell">
                        <span class="quantity-value">{{ item.quantity }}</span>
                        <div class="quantity-controls">
                          <button @click="quickAdjust(item.id, 1)" class="qty-btn plus">+1</button>
                          <button @click="quickAdjust(item.id, -1)" class="qty-btn minus">-1</button>
                        </div>
                      </div>
                    </td>
                    <td class="price-cell">₱{{ formatPrice(item) }}</td>
                    <td class="total-cell">₱{{ formatTotal(item) }}</td>
                    <td>
                      <span class="status-badge" :class="getStockClass(item)">
                        {{ getStockStatusText(item) }}
                      </span>
                    </td>
                    <td>{{ formatDate(item.last_updated) }}</td>
                    <td>
                      <div class="table-actions">
                        <button @click="editItem(item)" class="table-btn edit" title="Edit">
                          ✏️
                        </button>
                        <button @click="adjustStock(item, 'increase')" class="table-btn success" title="Add Stock">
                          ➕
                        </button>
                        <button @click="deleteItem(item.id)" class="table-btn delete" title="Delete">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredItems.length === 0" class="empty-inventory-state">
            <div class="empty-illustration">
              <div class="empty-icon">📦</div>
              <div class="empty-message">
                <h3>No items found</h3>
                <p v-if="itemSearch || filterBy !== 'all'">
                  Try adjusting your search or filter settings
                </p>
                <p v-else>
                  This company doesn't have any inventory items yet
                </p>
              </div>
            </div>
            <button @click="showAddItem = true" class="primary-btn large">
              <span class="btn-icon">+</span>
              Add First Item
            </button>
          </div>

          <!-- Inventory Summary -->
          <div v-if="selectedCompany && filteredItems.length > 0" class="inventory-summary-panel">
            <div class="summary-header">
              <h4>📊 Inventory Summary</h4>
              <div class="summary-actions">
                <button @click="exportCompanyInventory" class="summary-btn">
                  <span class="btn-icon">📥</span>
                  Export Report
                </button>
              </div>
            </div>
            
            <div class="summary-stats-grid">
              <div class="summary-stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-content">
                  <div class="stat-label">Total Items</div>
                  <div class="stat-value">{{ selectedCompany.item_count || 0 }}</div>
                </div>
              </div>
              
              
              
              <div class="summary-stat-card warning">
                <div class="stat-icon">⚠️</div>
                <div class="stat-content">
                  <div class="stat-label">Low Stock</div>
                  <div class="stat-value">{{ getLowStockCount() }}</div>
                </div>
              </div>
              
              <div class="summary-stat-card danger">
                <div class="stat-icon">⛔</div>
                <div class="stat-content">
                  <div class="stat-label">Out of Stock</div>
                  <div class="stat-value">{{ getOutOfStockCount() }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Welcome State -->
        <div v-else class="welcome-state">
          <div class="welcome-content">
            <div class="welcome-illustration">
              <div class="illustration-icon">🏢</div>
            </div>
            <div class="welcome-message">
              <h2>Welcome to Inventory Management</h2>
              <p>Select a company from the sidebar to view and manage their inventory.</p>
              <p>Create a new company to get started with inventory tracking.</p>
            </div>
            <div class="welcome-actions">
              <button @click="showAddCompany = true" class="primary-btn xlarge">
                <span class="btn-icon">+</span>
                Create New Company
              </button>
              <button @click="loadTestData" class="secondary-btn">
                <span class="btn-icon">📋</span>
                Load Test Data
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modals -->
    <!-- Add/Edit Company Modal -->
    <div v-if="showAddCompany" class="modal-overlay" @click.self="closeModals">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ editingCompany ? 'Edit Company' : 'Create New Company' }}</h3>
          <button @click="closeModals" class="modal-close">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Company Name *</label>
              <input v-model="companyForm.name" placeholder="Enter company name" class="form-input" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="companyForm.email" placeholder="contact@company.com" class="form-input" />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input v-model="companyForm.phone" placeholder="+63 912 345 6789" class="form-input" />
            </div>
            <div class="form-group">
              <label>Address</label>
              <textarea v-model="companyForm.address" placeholder="Company address" class="form-textarea"></textarea>
            </div>
            <div class="form-group full-width">
              <label>Notes</label>
              <textarea v-model="companyForm.notes" placeholder="Additional notes..." class="form-textarea"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModals" class="secondary-btn">Cancel</button>
          <button @click="saveCompany" class="primary-btn">
            {{ editingCompany ? 'Update Company' : 'Create Company' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Item Modal -->
    <div v-if="showAddItem" class="modal-overlay" @click.self="closeModals">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ editingItem ? 'Edit Item' : 'Add New Item' }}</h3>
          <button @click="closeModals" class="modal-close">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Item Name *</label>
              <input v-model="itemForm.name" placeholder="Enter item name" class="form-input" />
            </div>
            
            <div class="form-group">
              <label>Quantity *</label>
              <input type="number" v-model.number="itemForm.quantity" placeholder="0" min="0" class="form-input" />
            </div>
            <div class="form-group">
              <label>Unit</label>
              <select v-model="itemForm.unit" class="form-select">
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="g">Grams</option>
                <option value="L">Liters</option>
                <option value="m">Meters</option>
                <option value="box">Boxes</option>
                <option value="pack">Packs</option>
                <option value="set">Sets</option>
                <option value="roll">Rolls</option>
              </select>
            </div>
            <div class="form-group">
              <label>Unit Price (₱) *</label>
              <input type="number" v-model.number="itemForm.unit_price" placeholder="0.00" min="0" step="0.01" class="form-input" />
            </div>
            <div class="form-group">
              <label>Low Stock Threshold</label>
              <input type="number" v-model.number="itemForm.low_stock_threshold" placeholder="10" min="1" class="form-input" />
            </div>
            <div class="form-group full-width">
              <label>Description</label>
              <textarea v-model="itemForm.description" placeholder="Item description..." class="form-textarea"></textarea>
            </div>
            <div class="form-group">
              <label>SKU / Barcode</label>
              <input v-model="itemForm.sku" placeholder="Optional SKU or barcode" class="form-input" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModals" class="secondary-btn">Cancel</button>
          <button @click="saveItem" class="primary-btn">
            {{ editingItem ? 'Update Item' : 'Add Item' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toast.show" class="toast-notification" :class="toast.type">
      <div class="toast-icon">{{ toast.icon }}</div>
      <div class="toast-content">
        <div class="toast-message">{{ toast.message }}</div>
      </div>
      <button @click="toast.show = false" class="toast-close">✕</button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';

const API_BASE_URL = 'http://localhost:3000';

export default {
  name: 'Inventory',
  setup() {
    // State
    const companies = ref([]);
    const filteredCompanies = ref([]);
    const selectedCompany = ref(null);
    const companyItems = ref([]);
    const showAddCompany = ref(false);
    const showAddItem = ref(false);
    const companySearch = ref('');
    const itemSearch = ref('');
    const filterBy = ref('all');
    const viewMode = ref('grid');
    const editingCompany = ref(null);
    const editingItem = ref(null);
    
    // Forms
    const companyForm = reactive({
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    });
    
    const itemForm = reactive({
      name: '',
      category: '',
      quantity: 0,
      unit: 'pcs',
      unit_price: 0,
      low_stock_threshold: 10,
      description: '',
      sku: ''
    });
    
    // Toast
    const toast = reactive({
      show: false,
      message: '',
      type: 'info',
      icon: 'ℹ️'
    });
    
    // Computed properties
    const totalCompanies = computed(() => companies.value.length);
    const totalItems = computed(() => {
      return companies.value.reduce((total, company) => {
        return total + (company.item_count || 0);
      }, 0);
    });
    const totalInventoryValue = computed(() => {
      return companies.value.reduce((total, company) => {
        return total + getCompanyValue(company);
      }, 0);
    });
    const lowStockItems = computed(() => {
      return companies.value.reduce((total, company) => {
        return total + getCompanyLowStockCount(company);
      }, 0);
    });
    
    const filteredItems = computed(() => {
      let items = [...companyItems.value];
      
      // Apply search filter
      if (itemSearch.value) {
        const searchTerm = itemSearch.value.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm) ||
          item.sku?.toLowerCase().includes(searchTerm) ||
          item.category?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply stock filter
      switch (filterBy.value) {
        case 'low-stock':
          items = items.filter(item => {
            const threshold = item.low_stock_threshold || 10;
            return item.quantity <= threshold && item.quantity > 0;
          });
          break;
        case 'out-of-stock':
          items = items.filter(item => item.quantity === 0);
          break;
        case 'in-stock':
          items = items.filter(item => {
            const threshold = item.low_stock_threshold || 10;
            return item.quantity > threshold;
          });
          break;
      }
      
      return items;
    });
    
    // Helper methods
    const getCompanyInitials = (name) => {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    };
    
    const getCompanyColor = (name) => {
      const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)'
      ];
      const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
      return colors[index];
    };
    
    const getStockStatusClass = (status) => {
      if (!status) return 'success';
      const statusLower = status.toLowerCase();
      if (statusLower.includes('good') || statusLower.includes('excellent')) return 'success';
      if (statusLower.includes('low') || statusLower.includes('warning')) return 'warning';
      if (statusLower.includes('out') || statusLower.includes('danger')) return 'danger';
      return 'success';
    };
    
    const getCompanyValue = (company) => {
      if (!company.items) return 0;
      return company.items.reduce((total, item) => {
        const price = parseFloat(item.unit_price) || 0;
        const quantity = parseFloat(item.quantity) || 0;
        return total + (price * quantity);
      }, 0);
    };
    
    const getCompanyLowStockCount = (company) => {
      if (!company.items) return 0;
      return company.items.filter(item => {
        const threshold = item.low_stock_threshold || 10;
        return parseFloat(item.quantity) <= threshold && parseFloat(item.quantity) > 0;
      }).length;
    };
    
    const formatCurrency = (value) => {
      return parseFloat(value || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };
    
    const formatPrice = (item) => {
      const price = parseFloat(item.unit_price) || 0;
      return formatCurrency(price);
    };
    
    const formatTotal = (item) => {
      const price = parseFloat(item.unit_price) || 0;
      const quantity = parseFloat(item.quantity) || 0;
      return formatCurrency(price * quantity);
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    const getStockPercentage = (item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const maxStock = Math.max(quantity * 2, 100);
      return Math.min((quantity / maxStock) * 100, 100);
    };
    
    const getStockClass = (item) => {
      const quantity = parseFloat(item.quantity) || 0;
      if (quantity === 0) return 'out-of-stock';
      const threshold = item.low_stock_threshold || 10;
      if (quantity <= threshold) return 'low-stock';
      return 'in-stock';
    };
    
    const getStockStatusText = (item) => {
      const quantity = parseFloat(item.quantity) || 0;
      if (quantity === 0) return 'Out of Stock';
      const threshold = item.low_stock_threshold || 10;
      if (quantity <= threshold) return 'Low Stock';
      return 'In Stock';
    };
    
    const getCompanyTotalValue = () => {
      if (!selectedCompany.value) return 0;
      return getCompanyValue(selectedCompany.value);
    };
    
    const getLowStockCount = () => {
      if (!selectedCompany.value || !companyItems.value) return 0;
      return companyItems.value.filter(item => {
        const threshold = item.low_stock_threshold || 10;
        return parseFloat(item.quantity) <= threshold && parseFloat(item.quantity) > 0;
      }).length;
    };
    
    const getOutOfStockCount = () => {
      if (!selectedCompany.value || !companyItems.value) return 0;
      return companyItems.value.filter(item => parseFloat(item.quantity) === 0).length;
    };
    
    // API Methods
    const fetchCompanies = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/companies`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        companies.value = data;
        filteredCompanies.value = data;
        showToast('Companies loaded successfully', 'success', '✅');
      } catch (error) {
        console.error('Error fetching companies:', error);
        showToast('Error loading companies. Make sure backend is running.', 'error', '❌');
      }
    };
    
    const fetchCompanyItems = async (companyId) => {
      try {
        const response = await fetch(`${API_BASE_URL}/companies/${companyId}/items`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        companyItems.value = data;
      } catch (error) {
        console.error('Error fetching company items:', error);
        companyItems.value = [];
        showToast('Error loading items', 'error', '❌');
      }
    };
    
    const fetchCompanyStats = async () => {
      if (!selectedCompany.value) return;
      try {
        const response = await fetch(`${API_BASE_URL}/companies/${selectedCompany.value.id}/stats`);
        if (response.ok) {
          const data = await response.json();
          showToast(`Company stats loaded: ${data.itemCount} items, Total Value: ₱${formatCurrency(data.totalValue)}`, 'info', '📊');
        }
      } catch (error) {
        console.error('Error fetching company stats:', error);
      }
    };
    
    const searchCompanies = () => {
      if (!companySearch.value) {
        filteredCompanies.value = companies.value;
        return;
      }
      const searchTerm = companySearch.value.toLowerCase();
      filteredCompanies.value = companies.value.filter(company =>
        company.name.toLowerCase().includes(searchTerm) ||
        company.email?.toLowerCase().includes(searchTerm) ||
        company.address?.toLowerCase().includes(searchTerm)
      );
    };
    
    const searchItems = () => {
      // Computed property handles filtering
    };
    
    const selectCompany = async (company) => {
      selectedCompany.value = company;
      await fetchCompanyItems(company.id);
    };
    
    const deselectCompany = () => {
      selectedCompany.value = null;
      companyItems.value = [];
    };
    
    const setView = (mode) => {
      viewMode.value = mode;
    };
    
    const refreshInventory = async () => {
      await fetchCompanies();
      if (selectedCompany.value) {
        await fetchCompanyItems(selectedCompany.value.id);
      }
      showToast('Inventory refreshed', 'success', '🔄');
    };
    
    const editCompany = (company) => {
      editingCompany.value = company;
      Object.assign(companyForm, company);
      showAddCompany.value = true;
    };
    
    const saveCompany = async () => {
      try {
        if (editingCompany.value) {
          // Update company
          const response = await fetch(`${API_BASE_URL}/companies/${editingCompany.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyForm)
          });
          
          if (response.ok) {
            const updatedCompany = await response.json();
            const index = companies.value.findIndex(c => c.id === updatedCompany.id);
            if (index !== -1) {
              companies.value[index] = { ...companies.value[index], ...updatedCompany };
            }
            if (selectedCompany.value?.id === updatedCompany.id) {
              selectedCompany.value = { ...selectedCompany.value, ...updatedCompany };
            }
            showToast('Company updated successfully', 'success', '✅');
          } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update company');
          }
        } else {
          // Create new company
          const response = await fetch(`${API_BASE_URL}/companies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyForm)
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.company) {
              companies.value.push(result.company);
            } else {
              companies.value.push(result);
            }
            showToast('Company created successfully', 'success', '✅');
          } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create company');
          }
        }
        closeModals();
        searchCompanies();
      } catch (error) {
        console.error('Error saving company:', error);
        showToast(error.message, 'error', '❌');
      }
    };
    
    const deleteCompany = async (id) => {
      if (!confirm('Are you sure you want to delete this company? This will also delete all its inventory items.')) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          companies.value = companies.value.filter(c => c.id !== id);
          filteredCompanies.value = filteredCompanies.value.filter(c => c.id !== id);
          if (selectedCompany.value?.id === id) {
            selectedCompany.value = null;
            companyItems.value = [];
          }
          showToast('Company deleted successfully', 'success', '✅');
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete company');
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        showToast(error.message, 'error', '❌');
      }
    };
    
    const editItem = (item) => {
      editingItem.value = item;
      Object.assign(itemForm, {
        name: item.name,
        category: item.category,
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit,
        unit_price: parseFloat(item.unit_price) || 0,
        low_stock_threshold: item.low_stock_threshold || 10,
        description: item.description,
        sku: item.sku
      });
      showAddItem.value = true;
    };
    
    const saveItem = async () => {
      try {
        if (!selectedCompany.value) return;
        
        if (!itemForm.name || itemForm.unit_price === undefined) {
          throw new Error('Item name and unit price are required');
        }
        
        const itemData = {
          name: itemForm.name,
          category: itemForm.category || null,
          quantity: parseFloat(itemForm.quantity) || 0,
          unit: itemForm.unit || 'pcs',
          unit_price: parseFloat(itemForm.unit_price) || 0,
          description: itemForm.description || null,
          sku: itemForm.sku || null,
          low_stock_threshold: itemForm.low_stock_threshold || 10
        };
        
        if (editingItem.value) {
          // Update item
          const response = await fetch(`${API_BASE_URL}/items/${editingItem.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
          });
          
          if (response.ok) {
            const updatedItem = await response.json();
            const index = companyItems.value.findIndex(i => i.id === updatedItem.id);
            if (index !== -1) {
              companyItems.value[index] = updatedItem;
            }
            showToast('Item updated successfully', 'success', '✅');
          } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update item');
          }
        } else {
          // Create new item
          const response = await fetch(`${API_BASE_URL}/companies/${selectedCompany.value.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
          });
          
          if (response.ok) {
            const newItem = await response.json();
            companyItems.value.push(newItem);
            // Update company item count
            const companyIndex = companies.value.findIndex(c => c.id === selectedCompany.value.id);
            if (companyIndex !== -1) {
              companies.value[companyIndex].item_count = (companies.value[companyIndex].item_count || 0) + 1;
            }
            showToast('Item added successfully', 'success', '✅');
          } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add item');
          }
        }
        closeModals();
      } catch (error) {
        console.error('Error saving item:', error);
        showToast(error.message, 'error', '❌');
      }
    };
    
    const deleteItem = async (id) => {
      if (!confirm('Are you sure you want to delete this item?')) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/items/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          companyItems.value = companyItems.value.filter(i => i.id !== id);
          // Update company item count
          if (selectedCompany.value) {
            const companyIndex = companies.value.findIndex(c => c.id === selectedCompany.value.id);
            if (companyIndex !== -1) {
              companies.value[companyIndex].item_count = Math.max(0, (companies.value[companyIndex].item_count || 1) - 1);
            }
          }
          showToast('Item deleted successfully', 'success', '✅');
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete item');
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        showToast(error.message, 'error', '❌');
      }
    };
    
    const adjustStock = async (item, action) => {
      const amount = prompt(`Enter amount to ${action} (current: ${item.quantity}):`, '1');
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/items/${item.id}/adjust-stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: action,
            quantity: parseFloat(amount),
            reason: 'manual_adjustment',
            notes: `${action} stock by ${amount}`,
            created_by: 'user'
          })
        });
        
        if (response.ok) {
          const updatedItem = await response.json();
          const index = companyItems.value.findIndex(i => i.id === updatedItem.id);
          if (index !== -1) {
            companyItems.value[index] = updatedItem;
          }
          showToast(`Stock ${action}d by ${amount}`, 'success', '✅');
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to adjust stock');
        }
      } catch (error) {
        console.error('Error adjusting stock:', error);
        showToast(error.message, 'error', '❌');
      }
    };
    
    const quickAdjust = async (itemId, amount) => {
      try {
        const item = companyItems.value.find(i => i.id === itemId);
        if (!item) return;
        
        const action = amount > 0 ? 'increase' : 'decrease';
        const absAmount = Math.abs(amount);
        
        const response = await fetch(`${API_BASE_URL}/items/${itemId}/adjust-stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: action,
            quantity: absAmount,
            reason: 'quick_adjustment',
            notes: `Quick ${action} by ${absAmount}`,
            created_by: 'user'
          })
        });
        
        if (response.ok) {
          const updatedItem = await response.json();
          const index = companyItems.value.findIndex(i => i.id === updatedItem.id);
          if (index !== -1) {
            companyItems.value[index] = updatedItem;
          }
          showToast(`Stock ${action}d by ${absAmount}`, 'success', '✅');
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to adjust stock');
        }
      } catch (error) {
        console.error('Error quick adjusting stock:', error);
        showToast(error.message, 'error', '❌');
      }
    };
    
    const exportCompanyInventory = async () => {
      if (!selectedCompany.value) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/companies/${selectedCompany.value.id}/export`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${selectedCompany.value.name.replace(/\s+/g, '_')}_inventory_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          showToast('Inventory exported successfully', 'success', '📥');
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to export inventory');
        }
      } catch (error) {
        console.error('Error exporting inventory:', error);
        showToast(error.message, 'error', '❌');
      }
    };
    
    const loadTestData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/inventory/test-data`);
        if (response.ok) {
          await fetchCompanies();
          showToast('Test data loaded successfully', 'success', '📋');
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to load test data');
        }
      } catch (error) {
        console.error('Error loading test data:', error);
        showToast(error.message, 'error', '❌');
      }
    };
    
    const closeModals = () => {
      showAddCompany.value = false;
      showAddItem.value = false;
      editingCompany.value = null;
      editingItem.value = null;
      
      // Reset forms
      Object.keys(companyForm).forEach(key => companyForm[key] = '');
      Object.keys(itemForm).forEach(key => {
        if (key === 'quantity' || key === 'unit_price' || key === 'low_stock_threshold') {
          itemForm[key] = key === 'low_stock_threshold' ? 10 : 0;
        } else if (key === 'unit') {
          itemForm[key] = 'pcs';
        } else {
          itemForm[key] = '';
        }
      });
    };
    
    const showToast = (message, type = 'info', icon = 'ℹ️') => {
      toast.message = message;
      toast.type = type;
      toast.icon = icon;
      toast.show = true;
      
      setTimeout(() => {
        toast.show = false;
      }, 3000);
    };
    
    // Lifecycle
    onMounted(() => {
      fetchCompanies();
    });
    
    return {
      // State
      companies,
      filteredCompanies,
      selectedCompany,
      showAddCompany,
      showAddItem,
      companySearch,
      itemSearch,
      filterBy,
      viewMode,
      editingCompany,
      editingItem,
      
      // Forms
      companyForm,
      itemForm,
      
      // Toast
      toast,
      
      // Computed
      totalCompanies,
      totalItems,
      totalInventoryValue,
      lowStockItems,
      filteredItems,
      
      // Methods
      getCompanyInitials,
      getCompanyColor,
      getStockStatusClass,
      getCompanyValue,
      getCompanyLowStockCount,
      formatCurrency,
      formatPrice,
      formatTotal,
      formatDate,
      getStockPercentage,
      getStockClass,
      getStockStatusText,
      getCompanyTotalValue,
      getLowStockCount,
      getOutOfStockCount,
      fetchCompanyStats,
      searchCompanies,
      searchItems,
      selectCompany,
      deselectCompany,
      setView,
      refreshInventory,
      editCompany,
      saveCompany,
      deleteCompany,
      editItem,
      saveItem,
      deleteItem,
      adjustStock,
      quickAdjust,
      exportCompanyInventory,
      loadTestData,
      closeModals,
      showToast
    };
  }
};
</script>

<style scoped>
/* Enhanced CSS with modern design */

.inventory-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Enhanced Header */
.inventory-header {
  background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
  color: white;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}

.header-gradient {
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  clip-path: polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
}

.title-icon {
  font-size: 3rem;
  background: rgba(255, 255, 255, 0.2);
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(to right, #ffffff, #e3f2fd);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-top: 8px;
}

/* Enhanced Quick Stats */
.quick-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 20px 20px 0 0;
}

.gradient-1::before { background: linear-gradient(90deg, #667eea, #764ba2); }
.gradient-2::before { background: linear-gradient(90deg, #f093fb, #f5576c); }
.gradient-3::before { background: linear-gradient(90deg, #4facfe, #00f2fe); }
.gradient-4::before { background: linear-gradient(90deg, #43e97b, #38f9d7); }

.stat-icon-bg {
  background: rgba(255, 255, 255, 0.2);
  width: 60px;
  height: 60px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  font-size: 1.8rem;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 2.2rem;
  font-weight: 800;
  display: block;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 5px;
  display: block;
}

.stat-trend {
  font-size: 0.85rem;
  opacity: 0.8;
}

.stat-trend.warning {
  color: #ffcc00;
  font-weight: 600;
}

/* Main Content Layout */
.main-content-container {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 30px;
  max-width: 1400px;
  margin: -40px auto 0;
  padding: 0 20px 40px;
  position: relative;
  z-index: 2;
}

/* Enhanced Sidebar */
.glass-effect {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
}

.sidebar {
  border-radius: 24px;
  overflow: hidden;
  height: fit-content;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-title h3 {
  font-size: 1.3rem;
  color: #1e293b;
  margin: 0;
}

.badge {
  background: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.add-btn.floating {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.add-btn.floating:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
}

.btn-icon {
  font-size: 1.2rem;
}

/* Enhanced Search */
.search-container {
  padding: 20px 24px;
}

.search-input-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 14px 20px 14px 45px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  background: white;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.5;
}
.clear-search {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: #f1f5f9;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Enhanced Company List */
.company-list-container {
  max-height: 600px;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.company-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.company-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.company-card.active {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.company-card.has-low-stock::after {
  content: '';
  position: absolute;
  top: 15px;
  right: 15px;
  width: 8px;
  height: 8px;
  background: #f59e0b;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.company-card-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.company-avatar-wrapper {
  position: relative;
}

.company-avatar {
  width: 50px;
  height: 50px;
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.company-status {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.company-status.success { background: #10b981; }
.company-status.warning { background: #f59e0b; }
.company-status.danger { background: #ef4444; }

.company-meta {
  flex: 1;
}

.company-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 5px;
}

.company-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  font-size: 0.75rem;
  padding: 4px 10px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag.success { background: #d1fae5; color: #065f46; }
.tag.warning { background: #fef3c7; color: #92400e; }
.tag.danger { background: #fee2e2; color: #dc2626; }

.company-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.company-card:hover .company-actions {
  opacity: 1;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.icon-btn.edit {
  background: #dbeafe;
  color: #1d4ed8;
}

.icon-btn.edit:hover {
  background: #3b82f6;
  color: white;
}

.icon-btn.delete {
  background: #fee2e2;
  color: #dc2626;
}

.icon-btn.delete:hover {
  background: #dc2626;
  color: white;
}

.company-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  padding-top: 15px;
  border-top: 1px solid #f1f5f9;
}

.stat-mini {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.stat-value.warning {
  color: #f59e0b;
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 20px;
}

.empty-action-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

/* Main Content */
.main-content {
  min-height: 800px;
}

/* Company Dashboard */
.company-dashboard {
  background: white;
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.08);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.company-profile {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.company-avatar-large {
  width: 80px;
  height: 80px;
  color: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.company-info {
  flex: 1;
}

.company-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.company-title h2 {
  font-size: 1.8rem;
  color: #1e293b;
  margin: 0;
}

.company-badge {
  font-size: 0.85rem;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
}

.company-badge.success { background: #d1fae5; color: #065f46; }
.company-badge.warning { background: #fef3c7; color: #92400e; }
.company-badge.danger { background: #fee2e2; color: #dc2626; }

.company-contact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 0.9rem;
}

.contact-icon {
  font-size: 1rem;
  opacity: 0.7;
}

.dashboard-actions {
  display: flex;
  align-items: center;
}

.action-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.action-btn.primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
}

.action-btn.secondary {
  background: #f1f5f9;
  color: #475569;
}

.action-btn.secondary:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

.action-btn.stats {
  background: #d1fae5;
  color: #065f46;
}

.action-btn.danger {
  background: #fee2e2;
  color: #dc2626;
}

/* Inventory Controls */
.inventory-controls-panel {
  background: #f8fafc;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.controls-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.section-title {
  font-size: 1.4rem;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 1.6rem;
}

.item-count {
  font-size: 1rem;
  color: #64748b;
  font-weight: normal;
}

.view-switcher {
  display: flex;
  gap: 8px;
  background: white;
  padding: 6px;
  border-radius: 12px;
}

.view-btn {
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.view-btn.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.view-icon {
  font-size: 1.1rem;
}

.search-filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap; /* Crucial: Allows items to wrap to a new line on mobile */
  margin-top: 15px;
}

.search-wrapper {
    flex: 1 1 100%; /* Force search bar to its own row */
  }

.filter-select {
  flex: 1;
  min-width: 140px;
  height: 42px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background-color: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 16px;
  background: #f8f9fa;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.2s;
}

.refresh-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-2px);
}

/* Enhanced Grid View */
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.inventory-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
}

.inventory-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
}

.inventory-card.low-stock {
  border-left: 4px solid #f59e0b;
}

.inventory-card.out-of-stock {
  border-left: 4px solid #ef4444;
}

.card-header {
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-category {
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.card-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.card-btn.edit {
  background: #dbeafe;
  color: #1d4ed8;
}

.card-btn.edit:hover {
  background: #3b82f6;
  color: white;
}

.card-btn.delete {
  background: #fee2e2;
  color: #dc2626;
}

.card-btn.delete:hover {
  background: #dc2626;
  color: white;
}

.card-body {
  padding: 20px;
}

.item-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.item-description {
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 20px;
  line-height: 1.5;
}

.item-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 0.85rem;
  color: #64748b;
}

.meta-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: #1e293b;
}

.item-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-value.total {
  color: #059669;
}

/* Stock Indicator */
.stock-indicator {
  margin-top: 20px;
}

.stock-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.stock-bar {
  height: 10px;
  background: #e2e8f0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 8px;
}

.stock-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.stock-fill.in-stock {
  background: linear-gradient(to right, #10b981, #059669);
}

.stock-fill.low-stock {
  background: linear-gradient(to right, #f59e0b, #d97706);
}

.stock-fill.out-of-stock {
  background: linear-gradient(to right, #ef4444, #dc2626);
}

.stock-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #64748b;
}

.card-footer {
  padding: 20px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn.success {
  flex: 1;
  background: #d1fae5;
  color: #065f46;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.action-btn.success:hover {
  background: #a7f3d0;
}

.action-btn.warning {
  flex: 1;
  background: #fef3c7;
  color: #92400e;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.action-btn.warning:hover {
  background: #fde68a;
}

.action-btn.quick-add,
.action-btn.quick-remove {
  width: 48px;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.action-btn.quick-add:hover {
  background: #3b82f6;
  color: white;
}

.action-btn.quick-remove:hover {
  background: #ef4444;
  color: white;
}

/* Enhanced Table View */
.inventory-table-container {
  margin-bottom: 30px;
}

.table-responsive {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.inventory-table thead {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.inventory-table th {
  padding: 18px 16px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.inventory-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.inventory-table tbody tr {
  transition: all 0.3s;
}

.inventory-table tbody tr:hover {
  background-color: #f8fafc;
}

.inventory-table tbody tr.low-stock {
  background: rgba(245, 158, 11, 0.05);
}

.inventory-table tbody tr.out-of-stock {
  background: rgba(239, 68, 68, 0.05);
}

.item-cell {
  min-width: 200px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-weight: 600;
  color: #1e293b;
}

.item-desc {
  font-size: 0.85rem;
  color: #64748b;
}

.item-sku {
  font-size: 0.8rem;
  color: #94a3b8;
  font-family: monospace;
}

.quantity-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-value {
  min-width: 40px;
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.quantity-controls {
  display: flex;
  gap: 6px;
}

.qty-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.qty-btn:hover {
  background: #f3f4f6;
}

.qty-btn.plus {
  color: #10b981;
  border-color: #10b981;
}

.qty-btn.minus {
  color: #ef4444;
  border-color: #ef4444;
}

.price-cell {
  font-weight: 600;
  color: #1e293b;
}

.total-cell {
  font-weight: 700;
  color: #059669;
  font-size: 1.1rem;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.in-stock {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.low-stock {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.out-of-stock {
  background: #fee2e2;
  color: #dc2626;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.table-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.table-btn.edit {
  background: #dbeafe;
  color: #1d4ed8;
}

.table-btn.edit:hover {
  background: #3b82f6;
  color: white;
}

.table-btn.success {
  background: #d1fae5;
  color: #065f46;
}

.table-btn.success:hover {
  background: #10b981;
  color: white;
}

.table-btn.delete {
  background: #fee2e2;
  color: #dc2626;
}

.table-btn.delete:hover {
  background: #dc2626;
  color: white;
}

/* Empty Inventory State */
.empty-inventory-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 20px;
  border: 2px dashed #e2e8f0;
}

.empty-illustration {
  margin-bottom: 30px;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.3;
  margin-bottom: 20px;
  display: inline-block;
}

.empty-message h3 {
  font-size: 1.8rem;
  color: #1e293b;
  margin-bottom: 10px;
}

.empty-message p {
  color: #64748b;
  margin-bottom: 10px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.primary-btn.large {
  padding: 16px 32px;
  font-size: 1.1rem;
}

.primary-btn.xlarge {
  padding: 18px 36px;
  font-size: 1.2rem;
}

/* Enhanced Inventory Summary */
.inventory-summary-panel {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid #e2e8f0;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.summary-header h4 {
  font-size: 1.4rem;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-btn {
  padding: 12px 20px;
  background: white;
  color: #475569;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.summary-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-2px);
}

.summary-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.summary-stat-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s;
  border: 1px solid #e2e8f0;
}

.summary-stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.summary-stat-card.warning {
  border-left: 4px solid #f59e0b;
}

.summary-stat-card.danger {
  border-left: 4px solid #ef4444;
}

.summary-stat-card .stat-icon {
  font-size: 2rem;
  background: rgba(59, 130, 246, 0.1);
  width: 60px;
  height: 60px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-stat-card.warning .stat-icon {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.summary-stat-card.danger .stat-icon {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 5px;
  display: block;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #1e293b;
  display: block;
  line-height: 1;
}

/* Welcome State */
.welcome-state {
  background: white;
  border-radius: 24px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.08);
}

.welcome-content {
  max-width: 600px;
  margin: 0 auto;
}

.welcome-illustration {
  margin-bottom: 40px;
}

.illustration-icon {
  font-size: 5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
}

.welcome-message h2 {
  font-size: 2.2rem;
  color: #1e293b;
  margin-bottom: 20px;
}

.welcome-message p {
  color: #64748b;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 15px;
}

.welcome-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 40px;
  flex-wrap: wrap;
}

/* Enhanced Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.modal-lg {
  max-width: 700px;
}

.modal-header {
  padding: 30px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.6rem;
  color: #1e293b;
  margin: 0;
}

.modal-close {
  width: 44px;
  height: 44px;
  border: none;
  background: #f1f5f9;
  border-radius: 12px;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.modal-close:hover {
  background: #e2e8f0;
}

.modal-body {
  padding: 30px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  margin-bottom: 0;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  color: #475569;
  font-weight: 500;
  margin-bottom: 10px;
  font-size: 0.95rem;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
  background: white;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.modal-footer {
  padding: 30px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.secondary-btn {
  padding: 14px 24px;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.secondary-btn:hover {
  background: #e2e8f0;
}

.primary-btn {
  padding: 14px 24px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
}

/* Enhanced Toast */
.toast-notification {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 15px;
  animation: toastSlideIn 0.3s ease-out forwards;
  z-index: 1001;
  max-width: 400px;
  width: 90%;
}

.toast-notification.success {
  border-left: 4px solid #10b981;
}

.toast-notification.error {
  border-left: 4px solid #ef4444;
}

.toast-notification.warning {
  border-left: 4px solid #f59e0b;
}

.toast-notification.info {
  border-left: 4px solid #3b82f6;
}

.toast-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
}

.toast-message {
  font-weight: 500;
  color: #1e293b;
}

.toast-close {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s;
}

.toast-close:hover {
  background: #f1f5f9;
  color: #475569;
}

/* Animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .main-content-container {
    grid-template-columns: 1fr;
    margin-top: -30px;
  }
  
  .sidebar {
    order: 2;
  }
}

@media (max-width: 768px) {
  .inventory-header {
    padding: 30px 15px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .quick-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .header-title {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .title-icon {
    width: 70px;
    height: 70px;
    font-size: 2.5rem;
  }
  
  .dashboard-header {
    flex-direction: column;
  }
  
  .company-profile {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .company-title {
    justify-content: center;
  }
  
  .company-contact {
    align-items: center;
  }
  
  .inventory-controls-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .controls-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-filter-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .inventory-grid {
    grid-template-columns: 1fr;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .welcome-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .action-group {
    flex-direction: column;
    width: 100%;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .quick-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .company-avatar-large {
    width: 60px;
    height: 60px;
    font-size: 1.4rem;
  }
  
  .modal {
    margin: 10px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .modal-footer {
    padding: 20px;
    flex-direction: column;
  }
  
  .primary-btn,
  .secondary-btn {
    width: 100%;
  }
  /* RESPONSIVE ENHANCEMENTS - ADD THESE TO YOUR EXISTING STYLE SECTION */

/* Mobile-First Responsive Breakpoints */
@media (max-width: 1200px) {
  .main-content-container {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-top: -20px;
  }
  
  .sidebar {
    order: 2;
    max-height: 500px;
  }
  
  .company-list-container {
    max-height: 400px;
  }
}

/* Tablet and Small Desktop */
@media (max-width: 1024px) {
  .quick-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .summary-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .inventory-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

/* Tablet Portrait */
@media (max-width: 768px) {
  .inventory-header {
    padding: 25px 15px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .header-title {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .title-icon {
    width: 70px;
    height: 70px;
    font-size: 2.5rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .company-profile {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .company-contact {
    align-items: center;
  }
  
  .inventory-controls-panel {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .controls-section {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .search-filter-group {
    flex-direction: column;
    gap: 12px;
  }
  
  .search-wrapper,
  .filter-select, 
  .refresh-btn {
    flex: 1; /* Dropdown and Refresh button share the second row equally */
    justify-content: center;
  }

  
  .welcome-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .action-group {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
  
  /* Simplify table for mobile */
  .inventory-table {
    min-width: 800px; /* Keep horizontal scroll on tablets */
  }
  
  .modal {
    margin: 10px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .modal-footer {
    padding: 20px;
    flex-direction: column;
    gap: 10px;
  }
  
  .primary-btn,
  .secondary-btn {
    width: 100%;
  }
}

/* Large Mobile */
@media (max-width: 640px) {
  .quick-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    flex-direction: row;
    text-align: left;
    gap: 15px;
  }
  
  .company-avatar-large {
    width: 60px;
    height: 60px;
    font-size: 1.4rem;
  }
  
  .company-title h2 {
    font-size: 1.5rem;
  }
  
  .inventory-grid {
    grid-template-columns: 1fr;
  }
  
  /* Adjust card layout for mobile */
  .card-footer {
    flex-direction: column;
  }
  
  .action-btn.success,
  .action-btn.warning {
    width: 100%;
  }
  
  .action-btn.quick-add,
  .action-btn.quick-remove {
    width: 100%;
    justify-content: center;
  }
  
  .item-stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  /* Hide some table columns on mobile */
  .inventory-table th:nth-child(2),
  .inventory-table td:nth-child(2),
  .inventory-table th:nth-child(5),
  .inventory-table td:nth-child(5),
  .inventory-table th:nth-child(7),
  .inventory-table td:nth-child(7) {
    display: none;
  }
}

/* Small Mobile */
@media (max-width: 480px) {
  .inventory-header {
    padding: 20px 10px;
  }
  
  h1 {
    font-size: 1.7rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .sidebar-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .add-btn.floating {
    justify-content: center;
  }
  
  .company-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .company-meta {
    width: 100%;
  }
  
  .company-tags {
    justify-content: flex-start;
  }
  
  .summary-stats-grid {
    grid-template-columns: 1fr;
  }
  
  /* Further simplify table for very small screens */
  .inventory-table {
    min-width: 600px;
  }
  
  .inventory-table th:nth-child(3),
  .inventory-table td:nth-child(3),
  .inventory-table th:nth-child(6),
  .inventory-table td:nth-child(6) {
    display: none;
  }
}

/* Extra Small Mobile */
@media (max-width: 360px) {
  h1 {
    font-size: 1.5rem;
  }
  
  .title-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
  
  .stat-icon-bg {
    margin: 0 auto;
  }
  
  .company-card-header {
    align-items: center;
    text-align: center;
  }
  
  .company-tags {
    justify-content: center;
  }
  
  .company-actions {
    opacity: 1; /* Always show on mobile */
    transform: translateX(0);
    justify-content: center;
    width: 100%;
    margin-top: 10px;
  }
}

/* Landscape Mode Optimizations */
@media (max-height: 600px) and (orientation: landscape) {
  .sidebar {
    max-height: 300px;
  }
  
  .company-list-container {
    max-height: 200px;
  }
  
  .modal {
    max-height: 80vh;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .action-btn,
  .primary-btn,
  .secondary-btn,
  .view-btn,
  .refresh-btn,
  .icon-btn,
  .card-btn,
  .table-btn,
  .qty-btn {
    min-height: 44px;
    min-width: 44px;
  }
  
  .company-card:hover,
  .inventory-card:hover,
  .stat-card:hover {
    transform: none;
  }
  
  .search-input {
  width: 100%;
  height: 42px;
  padding: 8px 12px 8px 38px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background: white;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}
}

/* High-DPI Screens */
@media (min-width: 1920px) {
  .main-content-container {
    max-width: 1600px;
  }
  
  .header-content {
    max-width: 1600px;
  }
  
  .inventory-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 30px;
  }
}

/* Print Styles */
@media print {
  .inventory-header,
  .sidebar,
  .inventory-controls-panel,
  .dashboard-actions,
  .summary-actions,
  .welcome-actions,
  .modal-overlay,
  .toast-notification,
  .card-footer,
  .table-actions,
  .quantity-controls {
    display: none !important;
  }
  
  .main-content-container {
    grid-template-columns: 1fr;
    margin: 0;
    padding: 0;
  }
  
  .company-dashboard,
  .inventory-table-container {
    box-shadow: none;
    border: 1px solid #ccc;
  }
  
  body {
    background: white !important;
  }
  
  .inventory-page {
    background: white !important;
  }
}

/* Fluid Typography for Better Scaling */
@media (max-width: 768px) {
  :root {
    font-size: 14px;
  }
  
  h1 { font-size: calc(1.5rem + 1vw); }
  h2 { font-size: calc(1.3rem + 0.5vw); }
  h3 { font-size: calc(1.1rem + 0.3vw); }
  h4 { font-size: calc(1rem + 0.2vw); }
}

/* Safe Area Insets for Notched Phones */
@supports (padding: max(0px)) {
  .inventory-page {
    padding-left: max(20px, env(safe-area-inset-left));
    padding-right: max(20px, env(safe-area-inset-right));
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
  
  .modal-overlay {
    padding-left: max(20px, env(safe-area-inset-left));
    padding-right: max(20px, env(safe-area-inset-right));
  }
}
}
</style>