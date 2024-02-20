<template>
  <div class="editor">
    <code-editor 
      v-model:value="query" 
      v-model:prop_query="prop_query"
      v-model:x="x"
      v-model:y="y">
    </code-editor>
    
    <prop-browser 
      :host="host"
      :expr="prop_query.expr"
      :first="prop_query.first"
      :x="x"
      :y="y">
    </prop-browser>
  </div>
</template>

<script>
export default { name: "query-editor" };
</script>

<script setup>
import { ref, defineProps, defineModel } from 'vue';

const props = defineProps({
  host: {type: String, required: true}
});

const query = defineModel("query");
const prop_query = ref({expr: "", first: ""});
const x = ref(0);
const y = ref(0);

</script>

<style scoped>
div.editor {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: calc(100vh - 9rem);
}

</style>
