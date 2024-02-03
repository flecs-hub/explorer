<template>
  <div class="editor ace-github-dark">
    <code-editor 
      v-model:value="query" 
      v-model:prop_query="prop_query">
    </code-editor>
    
    <prop-explorer 
      :host="host"
      :expr="prop_query.expr"
      :first="prop_query.first">
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
const prop_query = ref({expr: "", first: ""});

</script>

<style scoped>
div.editor {
  display: grid;
  grid-template-columns: 2fr 1.5fr;
  grid-template-rows: calc(100vh - 7rem);
  grid-column: 2;
  grid-row: 3;
  padding: 1rem;
  padding-left: 0px;
  border-radius: var(--border-radius-medium);
}
</style>
