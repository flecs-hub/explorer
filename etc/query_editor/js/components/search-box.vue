<template>
  <input class="search-box" type="text" v-model="value">
</template>

<script>
export default { name: "search-box" }
</script>

<script setup>
import { defineModel } from 'vue';
const value = defineModel();
</script>

<style scoped>
input.search-box {
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  width: calc(100% - 1rem);
}
</style>
