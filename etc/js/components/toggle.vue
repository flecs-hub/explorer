<template>
  <button :class="css" @click="toggleButton">
    <slot></slot>
  </button>
</template>

<script>
export default { name: "toggle" };
</script>

<script setup>
import { defineProps, defineModel, computed } from 'vue';

const props = defineProps({
  css: { type: String, required: false }
});

const value = defineModel();

const toggleButton = () => {
  value.value = !value.value;
}

const css = computed(() => {
  let result = ['toggle'];

  if (props.css) {
    result.push(props.css);
  }

  if (value.value) {
    result.push('toggle-active');
  }

  return result;
});

</script>

<style scoped>
button.toggle {
  border: none;
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  height: 38px;
  cursor: pointer;
  transition: background-color var(--animation-duration);
  color: var(--primary-text);
  text-transform: uppercase;
  vertical-align: middle;
}

button.toggle:hover {
  background-color: var(--bg-content-hover);
}

button.toggle-active, button.toggle-active:hover {
  background-color: var(--bg-content-select);
}
</style>
