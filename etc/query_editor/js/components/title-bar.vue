<template>
  <div class="title-bar">
    <url-bar 
      v-model="host">
    </url-bar>
  </div>
</template>

<script>
export default { name: "title-bar" };
</script>

<script setup>
import { defineModel } from 'vue';

const host = defineModel("host");
</script>

<style scoped>
div.title-bar {
  display: grid;
  grid-template-columns: 1fr 35rem 1fr;
  grid-column: 2 / 4;
  grid-row: 2;
}
</style>
