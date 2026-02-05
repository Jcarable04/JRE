<template>
  <div>
    <h2>Products</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stocked?</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in products" :key="p.id">
          <td>{{ p.name }}</td>
          <td>{{ p.category }}</td>
          <td>{{ p.price }}</td>
          <td>{{ p.is_stocked ? 'Yes' : 'No' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { usePosStore } from '../store/index';
import { onMounted } from 'vue';

export default {
  setup() {
    const store = usePosStore();

    onMounted(() => {
      store.fetchProducts();
    });

    return {
      products: store.products
    };
  }
};
</script>
