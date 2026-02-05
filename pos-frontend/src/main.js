import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

const app = createApp(App);

app.use(router);     // ✅ add router
app.use(createPinia()); // ✅ add Pinia

app.mount('#app');
