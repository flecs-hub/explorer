<template>
  <div id="menu-bar" class="left-bar ace-github-dark">
    <div class="menu-bar-items">
      <template v-for="item in items">
        <slot :name="item"></slot>
      </template>
    </div>
  </div>
</template>

<script>
export default { name: "menu-bar" };
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  items: {type: Array, required: true}
});

</script>

<style scoped>
#menu-bar {
  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius-medium);
}

div.menu-bar-items {
  padding: 0.25rem;
  padding-top: 0px;
  padding-left: 0.2rem;
}
</style>
