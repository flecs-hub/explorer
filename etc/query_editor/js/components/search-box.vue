<template>
  <div class="search-box">
    <input class="search-box" type="text" v-model="value">
    <icon src="search"></icon>
  </div>
</template>

<script>
export default { name: "search-box" }
</script>

<script setup>
import { defineModel } from 'vue';
const value = defineModel();
</script>

<style scoped>
div.search-box {
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  margin-bottom: 0.5rem;
  padding: 0.5rem;
}
div.search-box input {
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  width: calc(100% - 0.5rem - 16px);
}

</style>

<style>
img.search-icon {
}
</style>
