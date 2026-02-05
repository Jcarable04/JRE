import { defineStore } from 'pinia';
import axios from 'axios';

const API = 'http://localhost:3000';

export const usePosStore = defineStore('pos', {
  // STATE
  state: () => ({
    products: [],
    sales: [],
    inventory: [],
    cart: [],
    dashboardStats: null,
    // INVENTORY STATES
    companies: [],
    selectedCompany: null,
    inventoryStats: null,
    companyItems: [],
    stockHistory: [],
    loading: false,
    error: null
  }),

  // GETTERS
  getters: {
    cartTotal(state) {
      return state.cart.reduce((sum, item) => sum + item.subtotal, 0);
    },
    
    // INVENTORY GETTERS
    totalCompanies: (state) => state.companies.length,
    
    totalItems: (state) => {
      return state.companies.reduce((total, company) => total + company.itemCount, 0);
    },
    
    totalInventoryValue: (state) => {
      let total = 0;
      state.companies.forEach(company => {
        company.items?.forEach(item => {
          total += item.quantity * item.unitPrice;
        });
      });
      return total;
    },
    
    lowStockItems: (state) => {
      let count = 0;
      state.companies.forEach(company => {
        company.items?.forEach(item => {
          if (item.quantity <= item.lowStockThreshold) {
            count++;
          }
        });
      });
      return count;
    },
    
    // Helper getters for selected company
    selectedCompanyItems: (state) => {
      return state.selectedCompany?.items || [];
    },
    
    companyTotalValue: (state) => {
      if (!state.selectedCompany?.items) return 0;
      return state.selectedCompany.items.reduce((total, item) => {
        return total + (item.quantity * item.unitPrice);
      }, 0);
    }
  },

  // ACTIONS
  actions: {
    // ========== PRODUCT ACTIONS ==========
    
    // Fetch products
    async fetchProducts() {
      try {
        console.log('Fetching products...');
        const res = await axios.get(`${API}/products`);
        this.products = res.data.map(p => ({
          ...p,
          orderQty: 1,
          price: Number(p.price) || 0,
          stocks: Number(p.stocks) || 0
        }));
        console.log('Products loaded:', this.products);
      } catch (error) {
        console.error('Error fetching products:', error);
        this.products = [];
        throw error;
      }
    },

    // Add new product
    async addProduct(productData) {
      try {
        const res = await axios.post(`${API}/products`, productData);
        const newProduct = {
          ...res.data,
          orderQty: 1,
          price: Number(res.data.price) || 0,
          stocks: Number(res.data.stocks) || 0
        };
        this.products.push(newProduct);
        return newProduct;
      } catch (error) {
        console.error('Error adding product:', error);
        throw error;
      }
    },

    // Update existing product
    async updateProduct(id, productData) {
      try {
        console.log('Updating product', id, 'with:', productData);
        const res = await axios.put(`${API}/products/${id}`, productData);
        
        // Update in local state
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
          this.products[index] = {
            ...this.products[index],
            ...res.data,
            price: Number(res.data.price) || 0,
            stocks: Number(res.data.stocks) || 0
          };
        }
        
        return res.data;
      } catch (error) {
        console.error('Error updating product:', error);
        throw error;
      }
    },

    // Delete product
    async deleteProduct(id) {
      try {
        await axios.delete(`${API}/products/${id}`);
        
        // Remove from local state
        this.products = this.products.filter(p => p.id !== id);
        return true;
      } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
      }
    },

    // ========== CART ACTIONS ==========
    
    // Add to cart
    addToCart(product) {
      console.log('Adding to cart:', product);
      
      const cartItem = {
        id: product.id,
        name: product.name,
        service_type: product.service_type,
        container_type: product.container_type,
        price: Number(product.price) || 0,
        qty: product.qty || 1,
        subtotal: 0
      };
      
      cartItem.subtotal = cartItem.price * cartItem.qty;
      
      const existing = this.cart.find(item => item.id === product.id);
      if (existing) {
        existing.qty += cartItem.qty;
        existing.subtotal = existing.qty * existing.price;
      } else {
        this.cart.push(cartItem);
      }
      
      console.log('Cart:', this.cart);
    },

    // Increase cart item quantity
    increaseQty(productId) {
      const item = this.cart.find(item => item.id === productId);
      if (item) {
        item.qty += 1;
        item.subtotal = item.qty * item.price;
      }
    },

    // Decrease cart item quantity
    decreaseQty(productId) {
      const item = this.cart.find(item => item.id === productId);
      if (item && item.qty > 1) {
        item.qty -= 1;
        item.subtotal = item.qty * item.price;
      }
    },

    // Remove from cart
    removeFromCart(productId) {
      this.cart = this.cart.filter(item => item.id !== productId);
    },

    // Clear cart
    clearCart() {
      this.cart = [];
    },

    // ========== SALES ACTIONS ==========
    
    // Checkout
    async checkout(customer_name, customer_address) {
      console.log('Checkout started...');
      
      if (!customer_name || !customer_address) {
        throw new Error('Customer name and address required');
      }

      if (this.cart.length === 0) {
        throw new Error('Cart is empty');
      }

      // Prepare sale items with proper structure
      const sale_items = this.cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.qty,
        unit_price: item.price
      }));

      console.log('Sending to backend:', { customer_name, customer_address, sale_items });

      try {
        const res = await axios.post(`${API}/sales`, {
          customer_name,
          customer_address,
          sale_items
        });

        console.log('Checkout success:', res.data);
        
        // Clear cart on success
        this.cart = [];
        return res.data;

      } catch (error) {
        console.error('Checkout error:', error);
        
        if (error.response) {
          console.error('Response error:', error.response.data);
          throw new Error(error.response.data.error || 'Checkout failed');
        }
        
        throw error;
      }
    },

    // ========== DASHBOARD & SALES HISTORY ==========
    
    // Fetch dashboard statistics
    async fetchDashboardStats() {
      try {
        const res = await axios.get(`${API}/dashboard-stats`);
        this.dashboardStats = res.data;
        return res.data;
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
      }
    },

    // Fetch sales history
    async fetchSalesHistory() {
      try {
        const res = await axios.get(`${API}/sales-history`);
        this.sales = res.data;
        return res.data;
      } catch (error) {
        console.error('Error fetching sales history:', error);
        throw error;
      }
    },

    // Fetch sale details
    async fetchSaleDetails(saleId) {
      try {
        const res = await axios.get(`${API}/sales/${saleId}`);
        return res.data;
      } catch (error) {
        console.error('Error fetching sale details:', error);
        throw error;
      }
    },

    // ========== INVENTORY ACTIONS ==========
    
    // Fetch all companies with inventory
    async fetchCompanies() {
      this.loading = true;
      this.error = null;
      try {
        console.log('Fetching companies...');
        const res = await axios.get(`${API}/companies`);
        this.companies = res.data;
        console.log('Companies loaded:', this.companies.length);
        return this.companies;
      } catch (error) {
        console.error('Error fetching companies:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Fetch single company with items
    async fetchCompany(companyId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get(`${API}/companies/${companyId}`);
        this.selectedCompany = res.data;
        return this.selectedCompany;
      } catch (error) {
        console.error('Error fetching company:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Create new company
    async createCompany(companyData) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.post(`${API}/companies`, companyData);
        const newCompany = res.data;
        this.companies.push(newCompany);
        return newCompany;
      } catch (error) {
        console.error('Error creating company:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Update company
    async updateCompany(companyId, companyData) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.put(`${API}/companies/${companyId}`, companyData);
        
        // Update in local state
        const index = this.companies.findIndex(c => c.id === companyId);
        if (index !== -1) {
          this.companies[index] = res.data;
        }
        
        // Update selected company if it's the one being edited
        if (this.selectedCompany?.id === companyId) {
          this.selectedCompany = res.data;
        }
        
        return res.data;
      } catch (error) {
        console.error('Error updating company:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Delete company
    async deleteCompany(companyId) {
      this.loading = true;
      this.error = null;
      try {
        await axios.delete(`${API}/companies/${companyId}`);
        
        // Remove from local state
        this.companies = this.companies.filter(c => c.id !== companyId);
        
        // Clear selected company if it was deleted
        if (this.selectedCompany?.id === companyId) {
          this.selectedCompany = null;
        }
        
        return true;
      } catch (error) {
        console.error('Error deleting company:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Search companies
    async searchCompanies(query) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get(`${API}/companies/search/${query}`);
        return res.data;
      } catch (error) {
        console.error('Error searching companies:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // ========== INVENTORY ITEMS ACTIONS ==========
    
    // Fetch items for a company
    async fetchCompanyItems(companyId, filter = 'all', search = '') {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get(`${API}/companies/${companyId}/items`, {
          params: { filter, search }
        });
        this.companyItems = res.data;
        return this.companyItems;
      } catch (error) {
        console.error('Error fetching company items:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Create new inventory item
    async createInventoryItem(companyId, itemData) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.post(`${API}/companies/${companyId}/items`, itemData);
        
        // Update selected company's items if it's the current company
        if (this.selectedCompany?.id === companyId) {
          this.selectedCompany.items = this.selectedCompany.items || [];
          this.selectedCompany.items.push(res.data);
          this.selectedCompany.itemCount = this.selectedCompany.items.length;
        }
        
        return res.data;
      } catch (error) {
        console.error('Error creating inventory item:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Update inventory item
    async updateInventoryItem(itemId, itemData) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.put(`${API}/items/${itemId}`, itemData);
        
        // Update in selected company's items
        if (this.selectedCompany?.items) {
          const index = this.selectedCompany.items.findIndex(i => i.id === itemId);
          if (index !== -1) {
            this.selectedCompany.items[index] = res.data;
          }
        }
        
        return res.data;
      } catch (error) {
        console.error('Error updating inventory item:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Delete inventory item
    async deleteInventoryItem(itemId) {
      this.loading = true;
      this.error = null;
      try {
        await axios.delete(`${API}/items/${itemId}`);
        
        // Remove from selected company's items
        if (this.selectedCompany?.items) {
          this.selectedCompany.items = this.selectedCompany.items.filter(i => i.id !== itemId);
          this.selectedCompany.itemCount = this.selectedCompany.items.length;
        }
        
        return true;
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Adjust item stock
    async adjustItemStock(itemId, adjustmentData) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.post(`${API}/items/${itemId}/adjust-stock`, adjustmentData);
        
        // Update in selected company's items
        if (this.selectedCompany?.items) {
          const index = this.selectedCompany.items.findIndex(i => i.id === itemId);
          if (index !== -1) {
            this.selectedCompany.items[index] = res.data;
          }
        }
        
        return res.data;
      } catch (error) {
        console.error('Error adjusting stock:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Get item history
    async fetchItemHistory(itemId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get(`${API}/items/${itemId}/history`);
        this.stockHistory = res.data;
        return this.stockHistory;
      } catch (error) {
        console.error('Error fetching item history:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // ========== INVENTORY ANALYTICS ACTIONS ==========
    
    // Get company statistics
    async fetchCompanyStats(companyId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get(`${API}/companies/${companyId}/stats`);
        return res.data;
      } catch (error) {
        console.error('Error fetching company stats:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Get global inventory statistics
    async fetchInventoryStats() {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get(`${API}/inventory/stats`);
        this.inventoryStats = res.data;
        return this.inventoryStats;
      } catch (error) {
        console.error('Error fetching inventory stats:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Export company inventory
    async exportCompanyInventory(companyId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(`${API}/companies/${companyId}/export`, {
          responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from content-disposition header
        const contentDisposition = response.headers['content-disposition'];
        let filename = `inventory_export.json`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch && filenameMatch.length === 2) {
            filename = filenameMatch[1];
          }
        }
        
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return true;
      } catch (error) {
        console.error('Error exporting inventory:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Load test data
    async loadInventoryTestData() {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get(`${API}/inventory/test-data`);
        // Refresh companies after loading test data
        await this.fetchCompanies();
        return res.data;
      } catch (error) {
        console.error('Error loading test data:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Clear selected company
    clearSelectedCompany() {
      this.selectedCompany = null;
      this.companyItems = [];
    },

    // Clear error
    clearError() {
      this.error = null;
    }
  }
});