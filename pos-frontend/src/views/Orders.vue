<!-- src/views/Orders.vue -->
<template>
  <div>
    <h1>Orders Management</h1>
    
    <!-- Filter by status -->
    <div class="filters">
      <label>Filter by Status:</label>
      <select v-model="statusFilter">
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <!-- Orders Table -->
    <table class="orders-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Date</th>
          <th>Customer</th>
          <th>Address</th>
          <th>Total</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in filteredOrders" :key="order.id">
          <td>#{{ order.id }}</td>
          <td>{{ formatDate(order.created_at) }}</td>
          <td>{{ order.customer_name }}</td>
          <td>{{ order.customer_address }}</td>
          <td>₱{{ order.total_amount.toFixed(2) }}</td>
          <td>
            <span :class="`status-badge status-${order.status}`">
              {{ order.status }}
            </span>
          </td>
          <td class="actions">
            <button @click="viewOrderDetails(order)" class="btn-view">
              View Details
            </button>
            <button @click="generateReceipt(order)" class="btn-receipt">
              Receipt
            </button>
            <select 
              v-if="order.status !== 'completed' && order.status !== 'cancelled'"
              @change="updateStatus(order.id, $event.target.value)"
              :value="order.status"
              class="status-select"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </td>
        </tr>
        <tr v-if="filteredOrders.length === 0">
          <td colspan="7" class="no-orders">No orders found</td>
        </tr>
      </tbody>
    </table>

    <!-- Order Details Modal -->
    <div v-if="selectedOrder" class="modal-overlay" @click.self="selectedOrder = null">
      <div class="modal">
        <h2>Order #{{ selectedOrder.id }} Details</h2>
        <div class="modal-content">
          <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> {{ selectedOrder.customer_name }}</p>
            <p><strong>Address:</strong> {{ selectedOrder.customer_address }}</p>
            <p><strong>Order Date:</strong> {{ formatDate(selectedOrder.created_at) }}</p>
            <p><strong>Status:</strong> {{ selectedOrder.status }}</p>
          </div>
          
          <h3>Order Items</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Service Type</th>
                <th>Container Type</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in selectedOrder.items" :key="item.product_id">
                <td>{{ item.product_name }}</td>
                <td>{{ item.service_type }}</td>
                <td>{{ item.container_type }}</td>
                <td>₱{{ item.price.toFixed(2) }}</td>
                <td>{{ item.quantity }}</td>
                <td>₱{{ item.subtotal.toFixed(2) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="text-right"><strong>Total:</strong></td>
                <td><strong>₱{{ selectedOrder.total_amount.toFixed(2) }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button @click="selectedOrder = null" class="btn-close">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const API = 'http://localhost:3000';

export default {
  setup() {
    const orders = ref([]);
    const selectedOrder = ref(null);
    const statusFilter = ref('');
    
    // Fetch orders from backend
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API}/sales`);
        // For now, using simple sales data
        // Later you can enhance backend to include items
        orders.value = response.data;
      } catch (error) {
        console.error('Error fetching orders:', error);
        alert('Failed to load orders');
      }
    };
    
    // Fetch order details with items
    const fetchOrderDetails = async (orderId) => {
      try {
        // You need to add this endpoint to your backend
        const response = await axios.get(`${API}/sales/${orderId}/details`);
        selectedOrder.value = response.data;
      } catch (error) {
        console.error('Error fetching order details:', error);
        // Fallback to basic order info
        selectedOrder.value = orders.value.find(o => o.id === orderId);
      }
    };
    
    const updateStatus = async (orderId, newStatus) => {
      try {
        await axios.put(`${API}/sales/${orderId}/status`, { status: newStatus });
        // Update local state
        const orderIndex = orders.value.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
          orders.value[orderIndex].status = newStatus;
        }
        alert('Status updated successfully');
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status');
      }
    };
    
    const viewOrderDetails = async (order) => {
      await fetchOrderDetails(order.id);
    };
    
    const generateReceipt = (order) => {
      // Open receipt in new window
      const receiptWindow = window.open('', '_blank');
      receiptWindow.document.write(`
        <html>
          <head>
            <title>Receipt - Order #${order.id}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { text-align: center; margin-bottom: 30px; }
              .receipt-info { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total-row { font-weight: bold; }
              .footer { margin-top: 30px; text-align: center; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
              <p>Order #${order.id}</p>
              <p>Date: ${formatDate(order.created_at)}</p>
            </div>
            
            <div class="receipt-info">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${order.customer_name}</p>
              <p><strong>Address:</strong> ${order.customer_address}</p>
            </div>
            
            <h3>Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${order.items ? order.items.map(item => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td>₱${item.price.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>₱${item.subtotal.toFixed(2)}</td>
                  </tr>
                `).join('') : '<tr><td colspan="4">No items data</td></tr>'}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3">TOTAL</td>
                  <td>₱${order.total_amount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            
            <div class="footer">
              <p>Thank you for your order!</p>
              <button onclick="window.print()">Print Receipt</button>
              <button onclick="window.close()">Close</button>
            </div>
          </body>
        </html>
      `);
      receiptWindow.document.close();
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    const filteredOrders = computed(() => {
      if (!statusFilter.value) return orders.value;
      return orders.value.filter(order => order.status === statusFilter.value);
    });
    
    onMounted(fetchOrders);
    
    return {
      orders,
      selectedOrder,
      statusFilter,
      filteredOrders,
      viewOrderDetails,
      generateReceipt,
      updateStatus,
      formatDate
    };
  }
};
</script>

<style scoped>
.filters {
  margin: 20px 0;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 5px;
}

.filters label {
  margin-right: 10px;
  font-weight: bold;
}

.filters select {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.orders-table th,
.orders-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.orders-table th {
  background-color: #4CAF50;
  color: white;
}

.orders-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.orders-table tr:hover {
  background-color: #f5f5f5;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-pending {
  background-color: #ffd700;
  color: #000;
}

.status-processing {
  background-color: #2196F3;
  color: white;
}

.status-completed {
  background-color: #4CAF50;
  color: white;
}

.status-cancelled {
  background-color: #f44336;
  color: white;
}

.actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.actions button,
.status-select {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-view {
  background-color: #2196F3;
  color: white;
}

.btn-receipt {
  background-color: #4CAF50;
  color: white;
}

.btn-view:hover {
  background-color: #1976D2;
}

.btn-receipt:hover {
  background-color: #45a049;
}

.status-select {
  border: 1px solid #ddd;
  background-color: white;
}

.no-orders {
  text-align: center;
  padding: 40px !important;
  color: #666;
  font-style: italic;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  width: 90%;
}

.modal h2 {
  margin-top: 0;
  color: #333;
}

.modal-content {
  margin: 20px 0;
}

.customer-info {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.items-table th,
.items-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.items-table th {
  background-color: #f2f2f2;
}

.text-right {
  text-align: right !important;
}

.btn-close {
  background-color: #f44336;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
}

.btn-close:hover {
  background-color: #d32f2f;
}
</style>