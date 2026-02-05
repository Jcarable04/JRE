<template>
  <div>
    <h1>POS</h1>

    <!-- Cart Table -->
    <table v-if="cart.length > 0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>Subtotal</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in cart" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ formatPrice(item.price) }}</td>
          <td>
            <button @click="decreaseQty(item.id)">-</button>
            {{ item.qty }}
            <button @click="increaseQty(item.id)">+</button>
          </td>
          <td>{{ formatPrice(item.subtotal) }}</td>
          <td>
            <button @click="removeFromCart(item.id)">Remove</button>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3"><strong>Total</strong></td>
          <td colspan="2"><strong>{{ formatPrice(cartTotal) }}</strong></td>
        </tr>
      </tfoot>
    </table>

    <p v-else>Your cart is empty.</p>

    <button v-if="cart.length > 0" @click="checkout">Checkout</button>
  </div>
</template>

<script>
import { computed } from 'vue'
import { usePosStore } from '../store'

export default {
  setup() {
    const store = usePosStore()

    const cart = computed(() => store.cart)
    const cartTotal = computed(() => store.cartTotal)

    const increaseQty = (id) => store.increaseQty(id)
    const decreaseQty = (id) => store.decreaseQty(id)
    const removeFromCart = (id) => store.removeFromCart(id)

    const formatPrice = (value) => `₱ ${value.toFixed(2)}`

    const checkout = async () => {
      if (confirm('Confirm checkout?')) {
        try {
          const saleItems = cart.value.map(item => ({
            product_id: item.id,
            quantity: item.qty,
            price: item.price,
            subtotal: item.subtotal
          }))

          const total_amount = cartTotal.value

          // Send sale to backend
          await fetch('http://localhost:3000/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ total_amount, sale_items: saleItems })
          })

          alert('Sale completed!')

          // Clear cart and refresh products
          store.clearCart()
          store.fetchProducts()
        } catch (err) {
          console.error('Checkout Error:', err)
          alert('Failed to complete sale. Check console.')
        }
      }
    }

    return {
      cart,
      cartTotal,
      increaseQty,
      decreaseQty,
      removeFromCart,
      formatPrice,
      checkout
    }
  }
}
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}
th, td {
  border: 1px solid #ccc;
  padding: 0.5rem;
  text-align: center;
}
button {
  margin: 0 0.25rem;
}
tfoot td {
  font-weight: bold;
}
</style>
