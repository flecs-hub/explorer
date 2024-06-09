<template>
  <div class="top-bar title-bar">
    <div class="title-bar-logo">
      <a
        class="flecs-logo" 
        href="https://github.com/SanderMertens/flecs" 
        target="_blank">
      </a>
    </div>
    <url-bar
      :app_state="app_state">
    </url-bar>
  </div>
</template>

<script>
export default { name: "title-bar" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  app_state: {type: Object, required: true},
});

</script>

<style scoped>

div.title-bar {
  display: grid;
  grid-template-columns: 2.5rem 1fr 30rem 1fr 2.5rem;
  font-size: 0.9rem;
}

div.title-bar-logo a {
  grid-column: 1;
}

div.title-bar-logo {
  display: grid;
  grid-template-columns: 1fr;
  grid-column: 1;
  padding: 0px;
}

div.title-info {
  display: flex;
  align-items: center;
}

div.title-info-left {
  grid-column: 2;
}

div.title-info-right {
  grid-column: 4;
  position: absolute;
  top: calc(0.7rem - 1px);
  right: 0.7rem;
}

div.title-version {
  padding-top: 0.1rem;
  margin-left: 0.5rem;
  width: 50px;
  color: var(--secondary-text);
  text-align: center;
}

@media screen and (max-width: 800px) {
  div.title-bar {
    grid-template-columns: 2.5rem 1fr 25rem 1fr 2.5rem;
  }

  div.title-version {
    display: none;
  }
}

</style>
