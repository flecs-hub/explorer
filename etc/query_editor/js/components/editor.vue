<template>
  <div class="editor">
    <code-editor 
      v-model:value="query" 
      v-model:lastword="lastword">
    </code-editor>
    
    <prop-explorer 
      :host="host"
      :prop="lastword">
    </prop-explorer>
  </div>
</template>

<script>
export default { name: "editor" };
</script>

<script setup>
import { ref, defineProps, defineModel } from 'vue';

const props = defineProps({
  host: {type: String, required: true}
});

const query = defineModel("query");
const lastword = ref("");
</script>

<style scoped>
div.editor {
  display: grid;
  grid-template-columns: 2fr 1.5fr;
  grid-template-rows: calc(100vh - 3.5em);
  grid-column: 2;
  grid-row: 3;
}
</style>
