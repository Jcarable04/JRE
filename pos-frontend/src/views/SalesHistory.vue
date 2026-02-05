<template>
  <div class="sales-history">
    <h1>📊 Sales History / Transactions</h1>
    
    <!-- Filters -->
    <div class="filters">
      <input 
        v-model="search" 
        placeholder="Search customer..." 
        @input="filterSales"
      />
      <select v-model="statusFilter" @change="filterSales">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <input 
        type="date" 
        v-model="dateFilter" 
        @change="filterSales"
      />
      <button @click="fetchSales" class="refresh-btn" :disabled="loading">
        🔄 {{ loading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>
    
    <!-- Stats Summary -->
    <div class="stats-summary">
      <div class="stat-item">
        <span class="stat-label">Total Sales:</span>
        <span class="stat-value">{{ totalSalesCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Amount:</span>
        <span class="stat-value">₱{{ totalSalesAmount.toFixed(2) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Showing:</span>
        <span class="stat-value">{{ filteredSales.length }} of {{ sales.length }}</span>
      </div>
    </div>
    
    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading transactions...</p>
    </div>
    
    <!-- Sales Table -->
    <div v-else class="sales-table">
      <div v-if="sales.length === 0" class="no-data-message">
        <p>No sales transactions found.</p>
        <p>Complete your first sale on the <router-link to="/sales">Sales page</router-link>.</p>
      </div>
      
      <div v-else>
        <table>
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Customer</th>
              <th>Date & Time</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in paginatedSales" :key="sale.id">
              <td><strong>#{{ sale.id }}</strong></td>
              <td>{{ sale.customer_name || 'N/A' }}</td>
              <td>{{ formatDateTime(sale.created_at) }}</td>
              <td>{{ sale.items_count || 0 }} items</td>
              <td class="amount">₱{{ Number(sale.total_amount || 0).toFixed(2) }}</td>
              <td>
                <span :class="['status-badge', sale.status || 'pending']">
                  {{ sale.status || 'pending' }}
                </span>
              </td>
              <td class="action-buttons">
                <button @click="viewDetails(sale.id)" class="view-btn" title="View Details">
                  👁️ View
                </button>
                <button @click="printReceipt(sale.id)" class="print-btn" title="Print Receipt">
                  🖨️ Print
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">
            ◀ Previous
          </button>
          <div class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
            <span class="page-total">({{ filteredSales.length }} items)</span>
          </div>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">
            Next ▶
          </button>
        </div>
      </div>
    </div>
    
    <!-- Sale Details Modal -->
    <div v-if="selectedSale" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>🧾 Sale Details #{{ selectedSale.id }}</h2>
          <button @click="closeModal" class="close-btn" title="Close">×</button>
        </div>
            <!-- Status Edit Modal -->
        <!-- Status Edit Modal -->
    <div v-if="statusEditModal" class="modal-overlay" @click.self="closeStatusEdit">
      <div class="modal-content status-edit-modal">
        <div class="modal-header">
          <h2>✏️ Edit Sale Status #{{ editingSale.id }}</h2>
          <button @click="closeStatusEdit" class="close-btn" title="Close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="current-status">
            <strong>Current Status:</strong>
            <span :class="['status-badge', editingSale.status]">
              {{ editingSale.status }}
            </span>
          </div>
          
          <div class="status-options">
            <label>Select New Status:</label>
            <div class="status-buttons">
              <button 
                @click="updateStatus('pending')"
                :class="['status-btn', editingSale.status === 'pending' ? 'active' : '']"
                :disabled="statusUpdating"
              >
                <span class="status-indicator pending"></span>
                Pending
              </button>
              <button 
                @click="updateStatus('processing')"
                :class="['status-btn', editingSale.status === 'processing' ? 'active' : '']"
                :disabled="statusUpdating"
              >
                <span class="status-indicator processing"></span>
                Processing
              </button>
              <button 
                @click="updateStatus('completed')"
                :class="['status-btn', editingSale.status === 'completed' ? 'active' : '']"
                :disabled="statusUpdating"
              >
                <span class="status-indicator completed"></span>
                Completed
              </button>
              <button 
                @click="updateStatus('cancelled')"
                :class="['status-btn', editingSale.status === 'cancelled' ? 'active' : '']"
                :disabled="statusUpdating"
              >
                <span class="status-indicator cancelled"></span>
                Cancelled
              </button>
            </div>
          </div>
          
          <div class="status-descriptions">
            <div class="description-item">
              <span class="status-indicator pending small"></span>
              <span><strong>Pending:</strong> Order received, awaiting processing</span>
            </div>
            <div class="description-item">
              <span class="status-indicator processing small"></span>
              <span><strong>Processing:</strong> Order being prepared/delivered</span>
            </div>
            <div class="description-item">
              <span class="status-indicator completed small"></span>
              <span><strong>Completed:</strong> Order delivered and payment received</span>
            </div>
            <div class="description-item">
              <span class="status-indicator cancelled small"></span>
              <span><strong>Cancelled:</strong> Order cancelled by customer or admin</span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            @click="saveStatusUpdate" 
            class="save-btn"
            :disabled="statusUpdating"
          >
            {{ statusUpdating ? 'Saving...' : 'Save Changes' }}
          </button>
          <button @click="closeStatusEdit" class="cancel-btn" :disabled="statusUpdating">
            Cancel
          </button>
        </div>
      </div>
    </div>
    
    <!-- Sale Details Modal -->
    <div v-if="selectedSale" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>🧾 Sale Details #{{ selectedSale.id }}</h2>
          <button @click="closeModal" class="close-btn" title="Close">×</button>
        </div>
        
        <div class="sale-details">
          <div class="customer-info">
            <h3>Customer Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Name:</strong>
                <span>{{ selectedSale.customer_name || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <strong>Address:</strong>
                <span>{{ selectedSale.customer_address || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <strong>Date:</strong>
                <span>{{ formatDateTime(selectedSale.created_at) }}</span>
              </div>
              <div class="info-item">
                <strong>Status:</strong>
                <div class="status-edit-container">
                  <select 
                    v-model="selectedSale.status" 
                    @change="updateSaleStatus(selectedSale)"
                    class="status-edit-select"
                    :disabled="statusUpdating"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <span v-if="statusUpdating" class="status-saving">Saving...</span>
                  <span v-else class="status-hint">Click to change</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="items-list">
            <h3>Items Purchased</h3>
            <div v-if="!selectedSale.items || selectedSale.items.length === 0" class="no-items">
              No items found for this sale.
            </div>
            <table v-else>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedSale.items" :key="item.id">
                  <td>{{ item.product_name || 'Unknown Product' }}</td>
                  <td>₱{{ Number(item.unit_price || 0).toFixed(2) }}</td>
                  <td>{{ item.quantity || 0 }}</td>
                  <td>₱{{ Number((item.unit_price || 0) * (item.quantity || 0)).toFixed(2) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="total-label"><strong>Total Amount:</strong></td>
                  <td class="total-amount">
                    <strong>₱{{ Number(selectedSale.total_amount || 0).toFixed(2) }}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="printReceipt(selectedSale.id)" class="print-btn">
            🖨️ Print Receipt
          </button>
          <button @click="closeModal" class="cancel-btn">
            Close
          </button>
        </div>
      </div>
    </div>
        <div class="sale-details">
          <div class="customer-info">
            <h3>Customer Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Name:</strong>
                <span>{{ selectedSale.customer_name || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <strong>Address:</strong>
                <span>{{ selectedSale.customer_address || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <strong>Date:</strong>
                <span>{{ formatDateTime(selectedSale.created_at) }}</span>
              </div>
              <div class="info-item">
                <strong>Status:</strong>
                <span :class="['status-badge', selectedSale.status]">
                  {{ selectedSale.status || 'pending' }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="items-list">
            <h3>Items Purchased</h3>
            <div v-if="!selectedSale.items || selectedSale.items.length === 0" class="no-items">
              No items found for this sale.
            </div>
            <table v-else>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedSale.items" :key="item.id">
                  <td>{{ item.product_name || 'Unknown Product' }}</td>
                  <td>₱{{ Number(item.unit_price || 0).toFixed(2) }}</td>
                  <td>{{ item.quantity || 0 }}</td>
                  <td>₱{{ Number((item.unit_price || 0) * (item.quantity || 0)).toFixed(2) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="total-label"><strong>Total Amount:</strong></td>
                  <td class="total-amount">
                    <strong>₱{{ Number(selectedSale.total_amount || 0).toFixed(2) }}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="printReceipt(selectedSale.id)" class="print-btn">
            🖨️ Print Receipt
          </button>
          <button @click="closeModal" class="cancel-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const API = 'http://localhost:3000';
const router = useRouter();

const sales = ref([]);
const filteredSales = ref([]);
const loading = ref(false);
const selectedSale = ref(null);
const search = ref('');
const statusFilter = ref('');
const dateFilter = ref('');
const currentPage = ref(1);
const itemsPerPage = 15;
const editingSale = ref(null);
const statusEditModal = ref(false);
const statusUpdating = ref(false);

// Computed properties
const totalSalesCount = computed(() => sales.value.length);

const totalSalesAmount = computed(() => {
  const total = sales.value.reduce((sum, sale) => {
    const amount = sale.total_amount;
    if (amount === null || amount === undefined) return sum;
    
    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  
  return total;
});

const totalPages = computed(() => 
  Math.ceil(filteredSales.value.length / itemsPerPage)
);

const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredSales.value.slice(start, end);
});

// Fetch sales from backend
const fetchSales = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${API}/sales-history`);
    // Ensure data is properly formatted
    sales.value = (response.data || []).map(sale => ({
      ...sale,
      // Convert total_amount to number if it's a string
      total_amount: typeof sale.total_amount === 'string' 
        ? parseFloat(sale.total_amount) 
        : Number(sale.total_amount) || 0,
      // Ensure other numeric fields are numbers
      items_count: typeof sale.items_count === 'string'
        ? parseInt(sale.items_count)
        : Number(sale.items_count) || 0
    }));
    filterSales();
  } catch (error) {
    console.error('Error fetching sales:', error);
    alert('Failed to load sales history. Please check your backend connection.');
  } finally {
    loading.value = false;
  }
};

// Filter sales based on search criteria
const filterSales = () => {
  let result = [...sales.value];
  
  // Reset to page 1 when filtering
  currentPage.value = 1;
  
  if (search.value.trim()) {
    const searchLower = search.value.toLowerCase().trim();
    result = result.filter(sale => 
      (sale.customer_name || '').toLowerCase().includes(searchLower) ||
      (sale.customer_address || '').toLowerCase().includes(searchLower)
    );
  }
  
  if (statusFilter.value) {
    result = result.filter(sale => (sale.status || 'pending') === statusFilter.value);
  }
  
  if (dateFilter.value) {
    result = result.filter(sale => {
      if (!sale.created_at) return false;
      const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
      return saleDate === dateFilter.value;
    });
  }
  
  filteredSales.value = result;
};

// View sale details
const viewDetails = async (saleId) => {
  try {
    const response = await axios.get(`${API}/sales/${saleId}`);
    if (response.data) {
      selectedSale.value = response.data.sale || {};
      selectedSale.value.items = (response.data.items || []).map(item => ({
        ...item,
        // Convert unit_price to number
        unit_price: typeof item.unit_price === 'string' 
          ? parseFloat(item.unit_price) 
          : Number(item.unit_price) || 0,
        // Convert quantity to number
        quantity: typeof item.quantity === 'string'
          ? parseInt(item.quantity)
          : Number(item.quantity) || 0
      }));
    } else {
      throw new Error('Invalid response data');
    }
  } catch (error) {
    console.error('Error fetching sale details:', error);
    alert('Failed to load sale details. The sale may not exist.');
  }
};
// Edit status from table
const editStatus = (sale) => {
  editingSale.value = { ...sale };
  statusEditModal.value = true;
};

// Update status from modal
const updateStatus = (newStatus) => {
  editingSale.value.status = newStatus;
};

// Save status update
const saveStatusUpdate = async () => {
  if (!editingSale.value) return;
  
  statusUpdating.value = true;
  try {
    const response = await axios.put(`${API}/sales/${editingSale.value.id}/status`, {
      status: editingSale.value.status
    });
    
    if (response.data.success) {
      // Update in local sales array
      const saleIndex = sales.value.findIndex(s => s.id === editingSale.value.id);
      if (saleIndex !== -1) {
        sales.value[saleIndex].status = editingSale.value.status;
      }
      
      // Update filtered sales
      filterSales();
      
      // Update selected sale if open
      if (selectedSale.value && selectedSale.value.id === editingSale.value.id) {
        selectedSale.value.status = editingSale.value.status;
      }
      
      alert('Status updated successfully!');
      closeStatusEdit();
    } else {
      throw new Error('Failed to update status');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Failed to update status. Please try again.');
  } finally {
    statusUpdating.value = false;
  }
};

// Update sale status from details modal
const updateSaleStatus = async (sale) => {
  if (!sale || !sale.id) return;
  
  statusUpdating.value = true;
  try {
    const response = await axios.put(`${API}/sales/${sale.id}/status`, {
      status: sale.status
    });
    
    if (response.data.success) {
      // Update in local sales array
      const saleIndex = sales.value.findIndex(s => s.id === sale.id);
      if (saleIndex !== -1) {
        sales.value[saleIndex].status = sale.status;
      }
      
      // Update filtered sales
      filterSales();
      
      alert('Status updated successfully!');
    } else {
      throw new Error('Failed to update status');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Failed to update status. Please try again.');
  } finally {
    statusUpdating.value = false;
  }
};

// Close status edit modal
const closeStatusEdit = () => {
  if (!statusUpdating.value) {
    editingSale.value = null;
    statusEditModal.value = false;
  }
};
// Format date
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Pagination
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

// Print receipt with table format
const printReceipt = async (saleId) => {
  try {
    // Fetch sale details if not already loaded
    if (!selectedSale.value || selectedSale.value.id !== saleId) {
      const response = await axios.get(`${API}/sales/${saleId}`);
      selectedSale.value = response.data.sale || {};
      selectedSale.value.items = response.data.items || [];
    }
    
    const sale = selectedSale.value;
    const items = sale.items || [];
    const totalAmount = sale.total_amount || 0;
    
    // Format date
    const saleDate = sale.created_at ? new Date(sale.created_at) : new Date();
    const formattedDate = saleDate.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateOnly = saleDate.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeOnly = saleDate.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Create receipt HTML with table format
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
       <title></title>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #000;
            background: #fff;
            padding: 5mm;
          }
          /* Status Editing Styles */
.status-edit-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-edit-select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.status-edit-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-saving {
  color: #3498db;
  font-size: 0.9rem;
  font-style: italic;
}

.status-hint {
  color: #7f8c8d;
  font-size: 0.8rem;
}

/* Status Edit Modal */
.status-edit-modal {
  max-width: 500px;
}

.modal-body {
  padding: 20px 25px;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.status-options {
  margin-bottom: 25px;
}

.status-options label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #2c3e50;
}

.status-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.status-btn {
  padding: 12px;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-btn:hover:not(:disabled) {
  border-color: #3498db;
  background: #f8f9fa;
}

.status-btn.active {
  border-color: #3498db;
  background: #ebf5fb;
}

.status-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.pending {
  background: #ffc107;
}

.status-indicator.processing {
  background: #17a2b8;
}

.status-indicator.completed {
  background: #28a745;
}

.status-indicator.cancelled {
  background: #dc3545;
}

.status-indicator.small {
  width: 8px;
  height: 8px;
  margin-right: 8px;
}

.status-descriptions {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
}

.description-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #495057;
}

.description-item:last-child {
  margin-bottom: 0;
}

.save-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.save-btn:hover:not(:disabled) {
  background: #218838;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
          .receipt-container {
            width: 80mm;
            margin: 0 auto;
          }
          
          /* Header Section */
          .header {
            text-align: center;
            padding-bottom: 5px;
            border-bottom: 2px solid #000;
            margin-bottom: 10px;
          }
          
          .store-name {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            color: #0066cc;
            margin-bottom: 3px;
          }
          
          .store-subtitle {
            font-size: 11px;
            color: #333;
            margin-bottom: 3px;
          }
          
          .store-address {
            font-size: 10px;
            color: #666;
            margin-bottom: 5px;
          }
          
          .receipt-title {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin: 8px 0;
            text-transform: uppercase;
          }
          
          /* Information Section */
          .info-section {
            margin-bottom: 10px;
          }
          
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          
          .info-table td {
            padding: 2px 0;
            vertical-align: top;
          }
          
          .info-label {
            font-weight: bold;
            width: 35%;
          }
          
          /* Customer Section */
          .customer-section {
            margin-bottom: 10px;
            padding: 5px;
            background: #f5f5f5;
            border-radius: 3px;
          }
          
          .section-title {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          
          /* Items Table */
          .items-section {
            margin: 10px 0;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
          }
          
          .items-table th {
            text-align: left;
            border-bottom: 2px solid #000;
            padding: 5px 0;
            font-size: 11px;
            text-transform: uppercase;
          }
          
          .items-table td {
            padding: 4px 0;
            border-bottom: 1px dashed #ccc;
            vertical-align: top;
          }
          
          .items-table tr:last-child td {
            border-bottom: 2px solid #000;
          }
          
          .col-item {
            width: 40%;
          }
          
          .col-qty {
            width: 15%;
            text-align: center;
          }
          
          .col-unit {
            width: 20%;
            text-align: right;
          }
          
          .col-total {
            width: 25%;
            text-align: right;
          }
          
          /* Totals Section */
          .totals-section {
            margin-top: 15px;
            padding-top: 8px;
            border-top: 2px solid #000;
          }
          
          .total-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .total-table td {
            padding: 3px 0;
          }
          
          .total-label {
            text-align: right;
            padding-right: 10px;
          }
          
          .total-value {
            text-align: right;
            font-weight: bold;
          }
          
          .grand-total {
            font-size: 14px;
            font-weight: bold;
            border-top: 2px dashed #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          
          /* Footer Section */
          .footer-section {
            margin-top: 15px;
            text-align: center;
            font-size: 10px;
            color: #666;
            padding-top: 10px;
            border-top: 1px dashed #ccc;
          }
          
          .thank-you {
            font-size: 13px;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            text-transform: uppercase;
          }
          
          .payment-info {
            margin: 8px 0;
            padding: 5px;
            background: #f0f0f0;
            border-radius: 3px;
            text-align: center;
          }
          
          .print-controls {
            text-align: center;
            margin: 15px 0;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 5px;
          }
          
          .print-btn {
            padding: 8px 16px;
            background: #0066cc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 5px;
            font-size: 12px;
          }
          
          .print-btn:hover {
            background: #0055aa;
          }
          
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
            .print-controls {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Store Header -->
          <div class="header">
            <div class="store-name">JRE FOODHUB CO.</div>
            <div class="store-address">Purok 2, Plaridel, Lipa,Batamgas,Phillipines</div>
            <div class="store-address">Tel: (02) 123-4567 | Mobile: 09*******</div>
          </div>
          
          <!-- Receipt Title -->
          <div class="receipt-title">OFFICIAL SALES RECEIPT</div>
          
          <!-- Receipt Information -->
          <div class="info-section">
            <table class="info-table">
             
              <tr>
                <td class="info-label">Date:</td>
                <td>${dateOnly}</td>
              </tr>
              <tr>
                <td class="info-label">Time:</td>
                <td>${timeOnly}</td>
              </tr>
              <tr>
                <td class="info-label">Status:</td>
                <td>${sale.status || 'COMPLETED'}</td>
              </tr>
            </table>
          </div>
          
          <!-- Customer Information -->
          <div class="customer-section">
            <div class="section-title">Customer Information</div>
            <table class="info-table">
              <tr>
                <td class="info-label">Name:</td>
                <td>${sale.customer_name || 'WALK-IN CUSTOMER'}</td>
              </tr>
              <tr>
                <td class="info-label">Address:</td>
                <td>${sale.customer_address || 'NOT SPECIFIED'}</td>
              </tr>
            </table>
          </div>
          
          <!-- Items Purchased -->
          <div class="items-section">
            <div class="section-title">Items Purchased</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th class="col-item">DESCRIPTION</th>
                  <th class="col-qty">QTY</th>
                  <th class="col-unit">UNIT PRICE</th>
                  <th class="col-total">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => {
                  const unitPrice = Number(item.unit_price || 0);
                  const quantity = Number(item.quantity || 0);
                  const subtotal = unitPrice * quantity;
                  const pricingUnit = (item.product_name || '').toLowerCase().includes('bottle') ? 'per case' : 'per piece';
                  
                  return `
                    <tr>
                      <td class="col-item">${item.product_name || 'PRODUCT'}</td>
                      <td class="col-qty">${quantity}</td>
                      <td class="col-unit">₱${unitPrice.toFixed(2)}<br><small>(${pricingUnit})</small></td>
                      <td class="col-total">₱${subtotal.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Totals -->
          <div class="totals-section">
            <table class="total-table">
              <tr>
                <td class="total-label">Subtotal:</td>
                <td class="total-value">₱${Number(totalAmount).toFixed(2)}</td>
              </tr>
              <tr>
                <td class="total-label">VAT (0%):</td>
                <td class="total-value">₱0.00</td>
              </tr>
              <tr>
                <td class="total-label">Discount:</td>
                <td class="total-value">₱0.00</td>
              </tr>
              <tr class="grand-total">
                <td class="total-label">TOTAL AMOUNT:</td>
                <td class="total-value">₱${Number(totalAmount).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <!-- Payment Information -->
          <div class="payment-info">
            <strong>PAYMENT DETAILS</strong><br>
            Method: CASH<br>
            Amount Paid: ₱${Number(totalAmount).toFixed(2)}<br>
          
          </div>
          
          <!-- Thank You Message -->
          <div class="thank-you">
            Thank you for your purchase!
          </div>
          
          <!-- Footer -->
          <div class="footer-section">
            <div>** This serves as your official receipt **</div>
            <div>VAT REG. TIN: 000-000-000-000</div>
            <div>ACCR. NO.: 1234567890</div>
            <div>~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
            <div>"This receipt is computer generated"</div>
            <div>"No signature required"</div>
            <div>Date Printed: ${new Date().toLocaleDateString('en-PH')}</div>
          </div>
          
          <!-- Print Controls (not printed) -->
          <div class="print-controls no-print">
            <button class="print-btn" onclick="window.print()">🖨️ Print Receipt</button>
            <button class="print-btn" onclick="window.close()">Close Window</button>
          </div>
        </div>
        
        <script>
          // Auto focus on print button
          window.addEventListener('load', function() {
            const printBtn = document.querySelector('.print-btn');
            if (printBtn) printBtn.focus();
          });
          
          // Close window after print
          window.addEventListener('afterprint', function() {
            setTimeout(function() {
              window.close();
            }, 500);
          });
        <\/script>
      </body>
      </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
  } catch (error) {
    console.error('Error generating receipt:', error);
    alert('Failed to generate receipt. Please try again.');
  }
};

// Close modal
const closeModal = () => {
  selectedSale.value = null;
};

// Initialize
onMounted(() => {
  fetchSales();
});
</script>

<style scoped>
.sales-history {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.8rem;
}

/* Filters */
.filters {
  display: flex;
  gap: 12px;
  margin: 20px 0;
  flex-wrap: wrap;
  align-items: center;
}

.filters input, .filters select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  min-width: 180px;
  font-size: 0.95rem;
}

.refresh-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #2980b9;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Stats Summary */
.stats-summary {
  display: flex;
  gap: 30px;
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
}

/* Loading */
.loading {
  text-align: center;
  padding: 50px;
  color: #7f8c8d;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* No Data Message */
.no-data-message {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.no-data-message p {
  margin: 10px 0;
  color: #7f8c8d;
}

.no-data-message a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.no-data-message a:hover {
  text-decoration: underline;
}

/* Sales Table */
.sales-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f8f9fa;
  color: #2c3e50;
  font-weight: 600;
  padding: 15px;
  text-align: left;
  border-bottom: 2px solid #eee;
}

td {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

tr:hover {
  background-color: #f9f9f9;
}

.amount {
  font-weight: bold;
  color: #2c3e50;
}

/* Status Badges */
.status-badge {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-block;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background: #f8d7da;
  color: #721c24;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
}

.view-btn, .print-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.view-btn {
  background: #3498db;
  color: white;
}

.view-btn:hover {
  background: #2980b9;
}

.print-btn {
  background: #95a5a6;
  color: white;
}

.print-btn:hover {
  background: #7f8c8d;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 25px;
  border-top: 1px solid #eee;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #3498db;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #2c3e50;
  font-weight: 500;
}

.page-total {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-left: 8px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 10px 10px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.4rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #7f8c8d;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #eee;
}

.sale-details {
  padding: 25px;
}

.customer-info {
  margin-bottom: 30px;
}

.customer-info h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item strong {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.items-list h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.no-items {
  text-align: center;
  padding: 30px;
  color: #7f8c8d;
  background: #f8f9fa;
  border-radius: 8px;
  font-style: italic;
}

.items-list table {
  margin-top: 10px;
}

.items-list th {
  background: #e9ecef;
}

.total-label {
  text-align: right;
  padding-right: 20px !important;
}

.total-amount {
  font-size: 1.1rem;
  color: #2c3e50;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 20px 25px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 0 0 10px 10px;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn:hover {
  background: #7f8c8d;
}

/* Responsive */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters input, .filters select {
    width: 100%;
  }
  
  .stats-summary {
    flex-direction: column;
    gap: 15px;
  }
  
  th, td {
    padding: 10px;
    font-size: 0.9rem;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 5px;
  }
  
  .view-btn, .print-btn {
    width: 100%;
  }
  
  .pagination {
    flex-direction: column;
    gap: 15px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 98%;
    margin: 10px;
  }
}
</style>