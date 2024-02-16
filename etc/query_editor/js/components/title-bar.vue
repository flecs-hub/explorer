<template>
  <div class="title-bar">
    <div class="title-bar-logo">
      <a 
        href="https://github.com/SanderMertens/flecs" 
        target="_blank">
      </a>
    </div>
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

div.title-bar-logo a {
  background-image: url('../../img/flecs_logo.png');
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
  grid-column: 1;
}

div.title-bar-logo {
  display: grid;
  grid-template-columns: 1fr;
  grid-column: 1;
  padding: 3px;
}

</style>
