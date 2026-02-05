<template>
  <div class="app-container">
    <!-- Customer Sidebar (Always Visible) -->
    <nav class="customer-sidebar">
      <div class="sidebar-logo">
        <h2>🏪 JRE FoodHub</h2>
        <p>POS System</p>
      </div>
      
      <div class="sidebar-links">
        <!-- Always show Sales for customers -->
        <router-link to="/sales" class="nav-link" active-class="active">
          <span class="nav-icon">🛒</span>
          <span class="nav-text">Sales</span>
        </router-link>
        
        <!-- Admin Access Button (Always Visible) -->
        <button @click="openAdminAccess" class="nav-link admin-access-btn">
          <span class="nav-icon">🔐</span>
          <span class="nav-text">{{ authStore.isAdmin ? 'Admin Panel' : 'Admin Access' }}</span>
        </button>
      </div>
      
      <!-- Show Admin Links when logged in -->
      <div v-if="authStore.isAdmin" class="admin-section">
        <div class="section-label">Admin Panel</div>
        <router-link to="/dashboard" class="nav-link" active-class="active">
          <span class="nav-icon">📊</span>
          <span class="nav-text">Dashboard</span>
        </router-link>
        <router-link to="/products" class="nav-link" active-class="active">
          <span class="nav-icon">📦</span>
          <span class="nav-text">Products</span>
        </router-link>
        <router-link to="/inventory" class="nav-link" active-class="active">
          <span class="nav-icon">📋</span>
          <span class="nav-text">Inventory</span>
        </router-link>
        <router-link to="/sales-history" class="nav-link" active-class="active">
          <span class="nav-icon">📜</span>
          <span class="nav-text">Sales History</span>
        </router-link>
        
        <!-- Logout Button for Admin -->
        <button @click="authStore.logout" class="nav-link logout-btn">
          <span class="nav-icon">🚪</span>
          <span class="nav-text">Logout Admin</span>
        </button>
      </div>
      
      <!-- Customer Help Section -->
      <div class="customer-help">
        <div class="help-item">
          <span class="help-icon">📞</span>
          <div class="help-text">
            <strong>Need Help?</strong>
            <small>Call: (02) 123-4567</small>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Main Content Area -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './store/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

// Check for existing admin session on app load
onMounted(() => {
  authStore.checkSession();
});

const openAdminAccess = () => {
  if (authStore.isAdmin) {
    // If already admin, go to dashboard
    router.push('/dashboard');
  } else {
    // If not admin, go to login
    router.push('/login');
  }
};
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

/* Sidebar Styles */
.customer-sidebar {
  width: 280px;
  background: rgba(30, 41, 59, 0.9);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 25px 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 5px 0 25px rgba(0, 0, 0, 0.3);
}

.sidebar-logo {
  padding-bottom: 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 25px;
}

.sidebar-logo h2 {
  color: white;
  font-size: 1.4rem;
  margin-bottom: 8px;
  font-weight: 700;
  background: linear-gradient(to right, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-logo p {
  color: #94a3b8;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.sidebar-links {
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 14px 18px;
  color: #cbd5e1;
  text-decoration: none;
  border-radius: 12px;
  margin-bottom: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-size: 1rem;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-link.active {
  background: linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.15));
  color: #60a5fa;
  border-left: 4px solid #3b82f6;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
}

.nav-icon {
  font-size: 1.3rem;
  width: 24px;
  text-align: center;
}

.nav-text {
  flex: 1;
  font-weight: 500;
}

/* Admin Access Button */
.admin-access-btn {
  background: linear-gradient(to right, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.1));
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
  margin-top: 25px;
  margin-bottom: 30px;
}

.admin-access-btn:hover {
  background: linear-gradient(to right, rgba(245, 158, 11, 0.25), rgba(251, 191, 36, 0.2));
  border-color: rgba(251, 191, 36, 0.5);
  color: #fde68a;
}

/* Admin Section */
.admin-section {
  margin-top: 30px;
  padding-top: 25px;
  border-top: 2px solid rgba(255, 255, 255, 0.15);
}

.section-label {
  color: #94a3b8;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 20px;
  padding-left: 18px;
  font-weight: 600;
}

/* Logout Button */
.logout-btn {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  margin-top: 25px;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

/* Customer Help Section */
.customer-help {
  margin-top: auto;
  padding-top: 25px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.help-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.3s;
}

.help-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.help-icon {
  font-size: 1.5rem;
  color: #60a5fa;
}

.help-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.help-text strong {
  color: white;
  font-size: 0.95rem;
}

.help-text small {
  color: #94a3b8;
  font-size: 0.85rem;
}

/* Main Content Area */
.main-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  background: rgba(15, 23, 42, 0.5);
}

/* Responsive Design */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }
  
  .customer-sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .sidebar-links {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 10px;
  }
  
  .nav-link {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    min-width: 80px;
    text-align: center;
  }
  
  .nav-text {
    font-size: 0.85rem;
  }
  
  .admin-section {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .admin-section .nav-link {
    margin-bottom: 0;
  }
  
  .main-content {
    padding: 20px;
  }
}

/* Custom Scrollbar */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Animation for sidebar items */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.nav-link {
  animation: slideIn 0.3s ease-out forwards;
  opacity: 0;
}

.nav-link:nth-child(1) { animation-delay: 0.1s; }
.nav-link:nth-child(2) { animation-delay: 0.2s; }
.nav-link:nth-child(3) { animation-delay: 0.3s; }
.nav-link:nth-child(4) { animation-delay: 0.4s; }
.nav-link:nth-child(5) { animation-delay: 0.5s; }
</style>