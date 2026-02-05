import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  
  const loginAsAdmin = () => {
    user.value = {
      role: 'admin',
      name: 'Administrator',
      permissions: ['dashboard', 'products', 'sales-history', 'inventory']
    };
    localStorage.setItem('admin_session', 'true');
  };
  
  const logout = () => {
    user.value = null;
    localStorage.removeItem('admin_session');
  };
  
  const checkSession = () => {
    const hasSession = localStorage.getItem('admin_session');
    if (hasSession) {
      loginAsAdmin();
    }
  };
  
  return {
    user,
    isAuthenticated,
    isAdmin,
    loginAsAdmin,
    logout,
    checkSession
  };
});