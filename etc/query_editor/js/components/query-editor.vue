<template>
  <div class="editor">
    <code-editor 
      v-model:value="query" 
      v-model:prop_query="prop_query"
      v-model:x="x"
      v-model:y="y"
      ref="editor">
    </code-editor>
    
    <prop-browser 
      :conn="conn"
      :expr="prop_query.expr"
      :first="prop_query.first"
      :x="x"
      :y="y"
      ref="browser"
      v-on:select="onSelect">
    </prop-browser>
  </div>
</template>

<script>
export default { name: "query-editor" };
</script>

<script setup>
import { ref, watch, defineProps, defineModel, nextTick } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true}
});

const editor = ref(null);
const browser = ref(null);

const onSelect = (prop) => {
  editor.value.autoComplete(prop);

  nextTick(() => {
    browser.value.hide();
  });
}

const query = defineModel("query");
const prop_query = ref({expr: "", first: ""});
const x = ref(0);
const y = ref(0);

watch(() => query.value, () => {
  browser.value.show();
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    browser.value.hide();
  }
});

</script>

<style scoped>
div.editor {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: calc(100vh - 9rem);
}

@media screen and (max-width: 800px) {
div.editor {
  grid-template-rows: calc(40vh - 7rem);
}
}

</style>
