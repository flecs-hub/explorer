<template>
  <input id="url-bar" type="text" v-model="host"></input>
</template>

<script>
export default { name: "url-bar" }
</script>

<script setup>
import { watch, onMounted, defineModel } from 'vue';

const host = defineModel();

onMounted(() => {
  document.getElementById('url-bar').value = host.value;
})

</script>
  
<style scoped>
#url-bar {
  -webkit-appearance: none; 
  -moz-appearance: none;
  outline: none;
  position: relative;
  grid-column: 2;
  border-style: solid;
  border-width: 2px;
  border-radius: 0.5em;
  padding-left: 1em;
  font-size: inherit;
  text-align: center;
  background-color: var(--bg-color-alt);
  border-color: var(--bg-color-alt);
  color: var(--highlight-text);
}

#url-bar:focus {
  border-color: var(--border);
}

</style>
