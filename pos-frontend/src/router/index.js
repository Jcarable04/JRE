import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Products from '../views/Products.vue';
import Sales from '../views/Sales.vue';
import Inventory from '../views/Inventory.vue';
import SalesHistory from '../views/SalesHistory.vue';
import Login from '../views/Login.vue'; // Add Login component


const routes = [
  {
    path: '/',
    redirect: '/sales' // Sales page as landing page for customers
  },
  {
    path: '/sales',
    name: 'Sales',
    component: Sales,
    meta: { 
      title: 'Sales - JRE FoodHub',
      public: true // Always accessible
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      title: 'Admin Login - JRE FoodHub',
      public: true,
      hideSidebar: true // Hide sidebar on login page
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { 
      title: 'Dashboard - JRE FoodHub',
      requiresAdmin: true
    }
  },
  {
    path: '/products',
    name: 'Products',
    component: Products,
    meta: { 
      title: 'Products - JRE FoodHub',
      requiresAdmin: true
    }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: Inventory,
    meta: { 
      title: 'Inventory - JRE FoodHub',
      requiresAdmin: true
    }
  },
  {
    path: '/sales-history',
    name: 'SalesHistory',
    component: SalesHistory,
    meta: { 
      title: 'Sales History - JRE FoodHub',
      requiresAdmin: true
    }
  },
  {
    path: '/:pathMatch(.*)*', // 404 route
    redirect: '/sales'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Create a mock auth store if you don't have it yet
// In a real app, you'd import from your store
let mockAuthStore = {
  isAdmin: false,
  checkSession() {
    const hasSession = localStorage.getItem('admin_session');
    this.isAdmin = !!hasSession;
  }
};

// Initialize session check
mockAuthStore.checkSession();

// Navigation guard
router.beforeEach((to, from, next) => {
  // Update page title
  document.title = to.meta.title || 'JRE FoodHub POS System';
  
  // Check if route requires admin
  if (to.meta.requiresAdmin && !mockAuthStore.isAdmin) {
    // Redirect to login if not admin
    next('/login');
  } else if (to.path === '/login' && mockAuthStore.isAdmin) {
    // If already logged in and trying to access login page, redirect to dashboard
    next('/dashboard');
  } else {
    next();
  }
});

// Function to update auth state (called from Login component)
export const updateAuthState = (isAdmin) => {
  mockAuthStore.isAdmin = isAdmin;
  if (isAdmin) {
    localStorage.setItem('admin_session', 'true');
  } else {
    localStorage.removeItem('admin_session');
  }
};

// Function to check if user is admin
export const isUserAdmin = () => {
  return mockAuthStore.isAdmin;
};

// Function to logout
export const logoutUser = () => {
  mockAuthStore.isAdmin = false;
  localStorage.removeItem('admin_session');
};

export default router;