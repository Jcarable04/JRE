<template>
  <div class="login-container">
    <div class="login-box glass-card">
      <div class="logo">
        <h1>🔐 Admin Access</h1>
        <p>Enter password to access admin panel</p>
      </div>
      
      <div class="form-group">
        <label for="password">Admin Password</label>
        <input 
          type="password" 
          id="password"
          v-model="password"
          @keyup.enter="login"
          placeholder="Enter admin password"
          :class="{ 'error': error }"
        />
        <div v-if="error" class="error-message">{{ error }}</div>
      </div>
      
      <button @click="login" :disabled="loading" class="login-btn">
        {{ loading ? 'Verifying...' : 'Access Admin Panel' }}
      </button>
      
      <div class="help-text">
        <p>👤 Customer? <router-link to="/sales">Go to Sales Page</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

const router = useRouter();
const authStore = useAuthStore();
const password = ref('');
const error = ref('');
const loading = ref(false);

// Default admin password (you should change this in production!)
const ADMIN_PASSWORD = 'admin123';

const login = async () => {
  if (!password.value.trim()) {
    error.value = 'Password is required';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (password.value === ADMIN_PASSWORD) {
    authStore.loginAsAdmin();
    router.push('/dashboard');
  } else {
    error.value = 'Invalid password';
  }
  
  loading.value = false;
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h1 {
  color: white;
  margin-bottom: 10px;
  font-size: 1.8rem;
}

.logo p {
  color: #94a3b8;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 25px;
  text-align: left;
}

.form-group label {
  display: block;
  color: #cbd5e1;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.form-group input.error {
  border-color: #ef4444;
}

.error-message {
  color: #f87171;
  font-size: 0.875rem;
  margin-top: 5px;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.help-text {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.help-text p {
  color: #94a3b8;
  font-size: 0.9rem;
}

.help-text a {
  color: #60a5fa;
  text-decoration: none;
  font-weight: 500;
}

.help-text a:hover {
  text-decoration: underline;
}
</style>