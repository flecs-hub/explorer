<template>
  <button class="action-button"><slot></slot></button>
</template>

<script>
export default { name: "icon-button" };
</script>

<script setup>
import { defineProps, computed } from 'vue';
</script>

<style scoped>

button.action-button {
  background-color: var(--primary-color);
  color: var(--dark-text);
  font-weight: 700;
}

</style>
