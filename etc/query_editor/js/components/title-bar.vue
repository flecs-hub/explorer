<template>
  <div class="title-bar">
    <a href="https://github.com/SanderMertens/flecs" class="title-bar-logo"></a>
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
  grid-template-columns: 2.5rem 1fr 35rem 1fr 2.5rem;
  grid-column: 2 / 4;
  grid-row: 2;
}

a.title-bar-logo {
  grid-column: 1;
  background-image: url('../../img/flecs_logo.png');
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
}

</style>
