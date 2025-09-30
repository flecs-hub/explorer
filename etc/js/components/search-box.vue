<template>
  <div :class="css">
    <input :class="css" type="text" v-model="value" 
      @keyup.enter="onEnter" 
      @focus="isFocused = true" 
      @blur="isFocused = false" 
      ref="searchBox">
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
import { defineModel, ref, computed } from 'vue';

const value = defineModel();
const searchBox = ref(null);
const isFocused = ref(false);

const css = computed(() => {
  let classes = ["search-box", "input-wrapper"];
  if (isFocused.value) {
    classes.push("search-box-focused");
  }
  return classes;
});

function onClear() {
  value.value = undefined;
}

function onEnter() {
  searchBox.value.blur();
}

</script>

<style scoped>

div.search-box {
  background-color: var(--bg-input);
  border-radius: var(--border-radius-medium);
  transition: background-color var(--animation-duration-fast);
  padding: 0.5rem;
}

div.search-box input {
  background: transparent;
  border-radius: var(--border-radius-medium);
  width: calc(100% - 0.5rem - 10px);
}

div.search-box-focused {
  background-color: var(--bg-input-select);
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
