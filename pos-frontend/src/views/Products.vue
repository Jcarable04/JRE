<template>
  <div class="products-management-page">
    <!-- Hero Header -->
    <header class="management-header">
      <div class="header-content">
        <h1>📦 Product Inventory</h1>
        <p class="subtitle">Manage your water products and inventory</p>
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <span class="stat-number">{{ totalProducts }}</span>
              <span class="stat-label">Total Products</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <span class="stat-number">{{ lowStockCount }}</span>
              <span class="stat-label">Low Stock</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-info">
              <span class="stat-number">{{ averagePrice }}</span>
              <span class="stat-label">Avg Price</span>
            </div>
          </div>
        </div>
      </div>
      <div class="wave-animation"></div>
    </header>

    <!-- Main Content -->
    <main class="management-content">
      <!-- Add Product Card -->
      <div class="add-product-card glass-card">
        <h2 class="section-title">➕ Add New Product</h2>
        <div class="product-form">
          <div class="form-row">
            <div class="form-group">
              <label for="product-name">
                <span class="label-icon">🏷️</span> Product Name
              </label>
              <input 
                id="product-name"
                v-model="newProduct.name"
                placeholder="e.g., Premium Drinking Water"
                class="form-input"
                @focus="animateInput"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>
                <span class="label-icon">🔄</span> Service Type
              </label>
              <div class="select-wrapper">
                <select v-model="newProduct.service_type" class="form-select">
                  <option value="" disabled>Select Service Type</option>
                  <option value="Refill" class="option">Refill</option>
                  <option value="Sample" class="option">Sample</option>
                  <option value="Unit" class="option">Unit</option>
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>

            <div class="form-group">
              <label>
                <span class="label-icon">🧴</span> Container Type
              </label>
              <div class="select-wrapper">
                <select v-model="newProduct.container_type" class="form-select">
                  <option value="" disabled>Select Container Type</option>
                  <option value="Slim Gallon" class="option">Slim Gallon</option>
                  <option value="Round Gallon" class="option">Round Gallon</option>
                  <option value="Bottle Per Case" class="option">Bottle Per Case</option>
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>
                <span class="label-icon">💰</span> Price (₱)
              </label>
              <input 
                type="number" 
                v-model.number="newProduct.price"
                placeholder="0.00"
                class="form-input"
                min="0"
                step="0.01"
              />
            </div>

            <div class="form-group">
              <label>
                <span class="label-icon">📦</span> Stock Quantity
              </label>
              <input 
                type="number" 
                v-model.number="newProduct.stocks"
                placeholder="0"
                class="form-input"
                min="0"
              />
            </div>
          </div>

          <button 
            @click="addNewProduct" 
            :disabled="!isFormValid"
            class="add-product-btn"
            :class="{ 'pulse-animation': isFormValid }"
          >
            <span class="btn-icon">✨</span>
            Add Product
          </button>
        </div>
      </div>

      <!-- Products List -->
      <div class="products-section">
        <div class="section-header">
          <h2 class="section-title">📋 Product List</h2>
          <div class="search-filter">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input 
                v-model="searchQuery"
                placeholder="Search products..."
                class="search-input"
              />
            </div>
            <div class="filter-buttons">
              <button 
                v-for="filter in filters"
                :key="filter.key"
                @click="setFilter(filter.key)"
                class="filter-btn"
                :class="{ active: activeFilter === filter.key }"
              >
                {{ filter.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Products Grid -->
        <div class="products-grid">
          <div 
            v-for="product in filteredProducts"
            :key="product.id"
            class="product-card"
            :class="{ 'low-stock-card': product.stocks < 10 }"
          >
            <div class="product-card-header">
              <div class="product-badge" :class="getServiceBadgeClass(product.service_type)">
                {{ product.service_type }}
              </div>
              <div class="product-actions">
                <button 
                  @click="startEdit(product)"
                  class="icon-btn edit-btn"
                  title="Edit"
                >
                  ✏️
                </button>
                <button 
                  @click="confirmDelete(product.id)"
                  class="icon-btn delete-btn"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div class="product-content">
              <h3 class="product-name">{{ product.name }}</h3>
              
              <div class="product-details">
                <div class="detail-item">
                  <span class="detail-icon">🧴</span>
                  <span class="detail-value">{{ product.container_type }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">💰</span>
                  <span class="detail-value">₱{{ product.price.toFixed(2) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">📦</span>
                  <span class="detail-value" :class="{ 'low-stock': product.stocks < 10 }">
                    {{ product.stocks }} units
                  </span>
                </div>
              </div>

              <!-- Edit Mode -->
              <div v-if="editingProductId === product.id" class="edit-form">
                <div class="edit-inputs">
                  <input v-model="editingProduct.name" class="edit-input" />
                  <select v-model="editingProduct.service_type" class="edit-select">
                    <option value="Refill">Refill</option>
                    <option value="Sample">Sample</option>
                    <option value="Unit">Unit</option>
                  </select>
                  <select v-model="editingProduct.container_type" class="edit-select">
                    <option value="Slim Gallon">Slim Gallon</option>
                    <option value="Round Gallon">Round Gallon</option>
                    <option value="Bottle Per Case">Bottle Per Case</option>
                  </select>
                  <input 
                    type="number" 
                    v-model.number="editingProduct.price"
                    class="edit-input"
                    min="0"
                  />
                  <input 
                    type="number" 
                    v-model.number="editingProduct.stocks"
                    class="edit-input"
                    min="0"
                  />
                </div>
                <div class="edit-actions">
                  <button @click="saveEdit" class="save-btn">💾 Save</button>
                  <button @click="cancelEdit" class="cancel-btn">❌ Cancel</button>
                </div>
              </div>
            </div>

            <div class="product-card-footer">
              <div class="stock-indicator">
                <div 
                  class="stock-bar"
                  :style="{ width: getStockPercentage(product.stocks) + '%' }"
                  :class="{ 'low-stock-bar': product.stocks < 10 }"
                ></div>
              </div>
              <div class="last-updated">
                ID: {{ product.id }}
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredProducts.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No products found</h3>
            <p v-if="searchQuery">Try adjusting your search or filter</p>
            <p v-else>Add your first product to get started!</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Floating Action Button -->
    <button 
      @click="scrollToTop"
      class="fab"
      :class="{ visible: showFab }"
    >
      ⬆️
    </button>

    <!-- Toast Notification -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      <span class="toast-icon">{{ toast.icon }}</span>
      {{ toast.message }}
    </div>
  </div>
</template>

<script>
import { reactive, onMounted, computed, ref } from 'vue'
import { usePosStore } from '../store/index'

export default {
  setup() {
    const store = usePosStore()
    const searchQuery = ref('')
    const activeFilter = ref('all')
    const editingProductId = ref(null)
    const editingProduct = reactive({})
    const showFab = ref(false)
    const toast = reactive({
      show: false,
      message: '',
      type: 'success',
      icon: '✅'
    })

    const newProduct = reactive({
      name: '',
      service_type: '',
      container_type: '',
      price: 0,
      stocks: 0,
      category: 'water',
      is_stocked: 1
    })

    const filters = [
      { key: 'all', label: 'All Products' },
      { key: 'low-stock', label: 'Low Stock' },
      { key: 'refill', label: 'Refill' },
      { key: 'sample', label: 'Sample' },
      { key: 'unit', label: 'Unit' }
    ]

    onMounted(() => {
      store.fetchProducts()
      window.addEventListener('scroll', handleScroll)
    })

    const products = computed(() => store.products)

    const totalProducts = computed(() => products.value.length)

    const lowStockCount = computed(() => {
      return products.value.filter(p => p.stocks < 10).length
    })

    const averagePrice = computed(() => {
      if (products.value.length === 0) return '₱0.00'
      const avg = products.value.reduce((sum, p) => sum + p.price, 0) / products.value.length
      return `₱${avg.toFixed(2)}`
    })

    const filteredProducts = computed(() => {
      let filtered = products.value

      // Search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(query) ||
          p.service_type.toLowerCase().includes(query) ||
          p.container_type.toLowerCase().includes(query)
        )
      }

      // Category filter
      if (activeFilter.value === 'low-stock') {
        filtered = filtered.filter(p => p.stocks < 10)
      } else if (activeFilter.value === 'refill') {
        filtered = filtered.filter(p => p.service_type === 'Refill')
      } else if (activeFilter.value === 'sample') {
        filtered = filtered.filter(p => p.service_type === 'Sample')
      } else if (activeFilter.value === 'unit') {
        filtered = filtered.filter(p => p.service_type === 'Unit')
      }

      return filtered
    })

    const isFormValid = computed(() => {
      return (
        newProduct.name.trim() &&
        newProduct.service_type &&
        newProduct.container_type &&
        newProduct.price > 0
      )
    })

    const showToast = (message, type = 'success') => {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      }
      
      toast.message = message
      toast.type = type
      toast.icon = icons[type] || icons.info
      toast.show = true

      setTimeout(() => {
        toast.show = false
      }, 3000)
    }

    const addNewProduct = async () => {
      if (!isFormValid.value) {
        showToast('Please fill all required fields', 'warning')
        return
      }

      try {
        await store.addProduct({ 
          name: newProduct.name,
          service_type: newProduct.service_type,
          container_type: newProduct.container_type,
          price: newProduct.price,
          stocks: newProduct.stocks,
          category: 'water',
          is_stocked: 1
        })

        // Reset form with animation
        Object.assign(newProduct, {
          name: '',
          service_type: '',
          container_type: '',
          price: 0,
          stocks: 0,
          category: 'water',
          is_stocked: 1
        })

        showToast('Product added successfully!', 'success')
        
        // Scroll to show the new product
        setTimeout(() => {
          const productsGrid = document.querySelector('.products-grid')
          if (productsGrid) {
            productsGrid.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      } catch (error) {
        console.error('Error adding product:', error)
        showToast('Failed to add product: ' + error.message, 'error')
      }
    }

    const startEdit = (product) => {
      editingProductId.value = product.id
      Object.assign(editingProduct, { ...product })
    }

    const saveEdit = async () => {
      try {
        const productData = {
          name: editingProduct.name,
          service_type: editingProduct.service_type,
          container_type: editingProduct.container_type,
          price: Number(editingProduct.price) || 0,
          stocks: Number(editingProduct.stocks) || 0
        }
        
        await store.updateProduct(editingProductId.value, productData)
        editingProductId.value = null
        Object.assign(editingProduct, {})
        showToast('Product updated successfully!', 'success')
      } catch (error) {
        console.error('Error updating product:', error)
        showToast('Failed to update product: ' + error.message, 'error')
      }
    }

    const cancelEdit = () => {
      editingProductId.value = null
      Object.assign(editingProduct, {})
    }

    const confirmDelete = async (id) => {
      if (!confirm('Are you sure you want to delete this product?')) return

      try {
        await store.deleteProduct(id)
        showToast('Product deleted successfully!', 'success')
      } catch (error) {
        console.error('Error deleting product:', error)
        showToast('Failed to delete product: ' + error.message, 'error')
      }
    }

    const setFilter = (filter) => {
      activeFilter.value = filter
    }

    const getServiceBadgeClass = (serviceType) => {
      const classes = {
        'Refill': 'badge-refill',
        'Sample': 'badge-sample',
        'Unit': 'badge-unit'
      }
      return classes[serviceType] || ''
    }

    const getStockPercentage = (stocks) => {
      const maxStock = 100 // You can adjust this based on your needs
      return Math.min((stocks / maxStock) * 100, 100)
    }

    const handleScroll = () => {
      showFab.value = window.scrollY > 300
    }

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const animateInput = (event) => {
      event.target.classList.add('input-focus')
      setTimeout(() => {
        event.target.classList.remove('input-focus')
      }, 500)
    }

    return {
      newProduct,
      products,
      searchQuery,
      activeFilter,
      filters,
      editingProductId,
      editingProduct,
      showFab,
      toast,
      totalProducts,
      lowStockCount,
      averagePrice,
      filteredProducts,
      isFormValid,
      addNewProduct,
      startEdit,
      saveEdit,
      cancelEdit,
      confirmDelete,
      setFilter,
      getServiceBadgeClass,
      getStockPercentage,
      scrollToTop,
      animateInput
    }
  }
}
</script>

<style scoped>
.products-management-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding-bottom: 50px;
}

/* Header Styles */
.management-header {
  background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
  color: white;
  padding: 40px 20px 100px;
  position: relative;
  overflow: hidden;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

h1 {
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 10px;
  background: linear-gradient(to right, #ffffff, #e0f2fe);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 40px;
}

.stats-overview {
  display: flex;
  gap: 20px;
  margin-top: 30px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 180px;
  transition: transform 0.3s, background 0.3s;
  animation: slideUp 0.6s ease-out;
}

.stat-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
}

.stat-card:nth-child(2) { animation-delay: 0.1s; }
.stat-card:nth-child(3) { animation-delay: 0.2s; }

.stat-icon {
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.2);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.wave-animation {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23f8fafc' fill-opacity='1' d='M0,160L48,176C96,192,192,224,288,208C384,192,480,128,576,128C672,128,768,192,864,192C960,192,1056,128,1152,117.3C1248,107,1344,149,1392,170.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
  background-size: cover;
  animation: wave 20s linear infinite;
}

/* Main Content */
.management-content {
  max-width: 1200px;
  margin: -60px auto 0;
  padding: 0 20px;
  position: relative;
  z-index: 2;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin-bottom: 30px;
  animation: fadeIn 0.6s ease-out;
}

/* Add Product Form */
.add-product-card {
  margin-bottom: 40px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #475569;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-icon {
  font-size: 1.1rem;
}

.form-input, .form-select {
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
  background: white;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.input-focus {
  animation: pulse 0.5s ease;
}

.select-wrapper {
  position: relative;
}

.select-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #64748b;
}

.form-select {
  appearance: none;
  width: 100%;
  cursor: pointer;
}

.add-product-btn {
  align-self: flex-start;
  padding: 16px 32px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
  margin-top: 10px;
}

.add-product-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
}

.add-product-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Products Section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 20px;
}

.search-filter {
  display: flex;
  gap: 20px;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.search-input {
  padding: 12px 16px 12px 48px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  width: 250px;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  width: 300px;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.filter-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  margin-top: 30px;
}

.product-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s;
  border: 1px solid #e2e8f0;
  animation: cardAppear 0.5s ease-out;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.low-stock-card {
  border-left: 4px solid #ef4444;
  animation: pulseWarning 2s infinite;
}

.product-card-header {
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.badge-refill { background: linear-gradient(135deg, #3b82f6, #8b5cf6); }
.badge-sample { background: linear-gradient(135deg, #10b981, #059669); }
.badge-unit { background: linear-gradient(135deg, #f59e0b, #d97706); }

.product-actions {
  display: flex;
  gap: 10px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.edit-btn {
  background: #dbeafe;
  color: #3b82f6;
}

.edit-btn:hover {
  background: #3b82f6;
  color: white;
}

.delete-btn {
  background: #fee2e2;
  color: #ef4444;
}

.delete-btn:hover {
  background: #ef4444;
  color: white;
}

.product-content {
  padding: 20px;
}

.product-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 15px;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-icon {
  font-size: 1.1rem;
  opacity: 0.7;
}

.detail-value {
  color: #475569;
  font-weight: 500;
}

.detail-value.low-stock {
  color: #ef4444;
  font-weight: 600;
}

/* Edit Form */
.edit-form {
  margin-top: 20px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  animation: slideDown 0.3s ease-out;
}

.edit-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.edit-input, .edit-select {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
}

.edit-actions {
  display: flex;
  gap: 10px;
}

.save-btn, .cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.save-btn {
  background: #10b981;
  color: white;
}

.save-btn:hover {
  background: #059669;
}

.cancel-btn {
  background: #64748b;
  color: white;
}

.cancel-btn:hover {
  background: #475569;
}

/* Product Card Footer */
.product-card-footer {
  padding: 20px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
}

.stock-indicator {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
}

.stock-bar {
  height: 100%;
  background: linear-gradient(to right, #10b981, #059669);
  border-radius: 3px;
  transition: width 1s ease;
}

.low-stock-bar {
  background: linear-gradient(to right, #ef4444, #dc2626);
}

.last-updated {
  font-size: 0.8rem;
  color: #64748b;
  text-align: right;
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #475569;
  margin-bottom: 10px;
}

.empty-state p {
  color: #64748b;
}

/* FAB */
.fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
  transition: all 0.3s;
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

.fab:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

/* Toast */
.toast {
  position: fixed;
  bottom: 30px;
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
  z-index: 1000;
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

/* Animations */
@keyframes wave {
  0% { background-position-x: 0; }
  100% { background-position-x: 1440px; }
}

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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes pulseWarning {
  0%, 100% { 
    border-left-color: #ef4444;
    box-shadow: 0 0 0 rgba(239, 68, 68, 0);
  }
  50% { 
    border-left-color: #dc2626;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toastSlideIn {
  to {
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes pulse-animation {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.pulse-animation {
  animation: pulse-animation 2s infinite;
}

/* Responsive Design */
@media (max-width: 768px) {
  .management-header {
    padding: 30px 15px 80px;
  }

  h1 {
    font-size: 2.2rem;
  }

  .stats-overview {
    flex-direction: column;
    align-items: center;
  }

  .stat-card {
    width: 100%;
    max-width: 300px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-filter {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .search-input:focus {
    width: 100%;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .add-product-btn {
    width: 100%;
    justify-content: center;
  }

  .fab {
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
  }
}

@media (max-width: 480px) {
  .management-content {
    padding: 0 15px;
  }

  .glass-card {
    padding: 20px;
  }

  .product-card {
    margin: 0 -5px;
  }

  .edit-inputs {
    grid-template-columns: 1fr;
  }
}
</style>