<template>
  <div :class="buttonCss" @click.stop="onClick">
    Add Component
  </div>
  <input 
    :class="searchCss" 
    type="text" 
    ref="searchBox"
    @click.stop
    @keydown.enter="onSubmit"
    @keydown.esc="onCancel">
</template>

<script>
export default { name: "entity-inspector-add-component" }
</script>

<script setup>
import { ref, computed, nextTick, defineEmits } from 'vue';

const emit = defineEmits(["submit"]);
const mode = ref("default");
const searchBox = ref(null);

const buttonCss = computed(() => {
  let classes = ["entity-inspector-button", "noselect"];
  if (mode.value !== "default") {
    classes.push("add-button-hidden");
  }
  return classes;
});

const searchCss = computed(() => {
  let classes = ["search-input", "entity-inspector-button", "noselect"];
  if (mode.value === "default") {
    classes.push("search-input-hidden");
  }
  return classes;
});

function onClick() {
  mode.value = "search";
  nextTick(() => {
    searchBox.value.focus();
    searchBox.value.select();
  });
}

function onSubmit() {
  mode.value = "default";
  emit("submit", searchBox.value.value);
}

function onCancel() {
  mode.value = "default";
}

</script>

<style scoped>

input.search-input {
  display: block;
  box-sizing: border-box;
  border-color: var(--green);
  width: 100%;
  text-align: left;
}

div.add-button-hidden, input.search-input-hidden {
  display: none;
}

</style>
