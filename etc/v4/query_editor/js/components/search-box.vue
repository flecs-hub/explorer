<template>
  <div class="search-box">
    <input class="search-box" type="text" v-model="value">
    <template v-if="value && value.length">
      <icon class="search-box-icon" src="close" @click="onClear"></icon>
    </template>
    <template v-else>
      <icon class="search-box-icon" src="search"></icon>
    </template>
  </div>
</template>

<script>
export default { name: "search-box" }
</script>

<script setup>
import { defineModel } from 'vue';

const value = defineModel();

function onClear() {
  value.value = undefined;
}

</script>

<style scoped>

div.search-box {
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  padding: 0.5rem;
}

div.search-box input {
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  width: calc(100% - 0.5rem - 16px);
}

</style>

<style>
img.search-box-icon {
  cursor: pointer;
  opacity: 0.7;
}

img.search-box-icon:hover {
  cursor: pointer;
  opacity: 1.0;
}
</style>
