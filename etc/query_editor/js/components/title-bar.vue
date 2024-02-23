<template>
  <div class="title-bar">
    <div class="title-bar-logo">
      <a
        class="flecs-logo" 
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

@media screen and (max-width: 800px) {
  div.title-bar {
    grid-template-columns: 2.5rem 1fr 25rem 1fr 2.5rem;
    grid-column: 2 / 4;
}
}

div.title-bar-logo a {
  grid-column: 1;
}

div.title-bar-logo {
  display: grid;
  grid-template-columns: 1fr;
  grid-column: 1;
  padding: 3px;
}

</style>
