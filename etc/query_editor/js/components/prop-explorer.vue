<template>
  <div id="prop-explorer" class="ace-github-dark">
    <template v-for="el in prop_query.entities">
      <prop-suggestion :prop="el"></prop-suggestion>
    </template>
  </div>
</template>

<script>
export default { name: "prop-explorer" }
</script>

<script setup>
import { ref, defineProps, watch } from 'vue';

const props = defineProps({
  host: {type: String, required: true },
  prop: {type: String, required: true }
});

let prop_query = ref({entities: []});

watch(() => props.prop, () => {
  flecs.connect(props.host);

  if (!props.prop.length) {
    prop_query.value.entities = [];
  } else {
    let parent;
    let expr = props.prop;
    let last_sep = expr.lastIndexOf(".");
    if (last_sep != -1) {
      parent = expr.slice(0, last_sep);
      expr = expr.slice(last_sep + 1, expr.length);
    }

    let query;
    if (parent) {
      query = `(ChildOf, ${parent})`
      if (expr.length) {
        query += `, $this ~= "${expr}"`;
      }
    } else {
      query = `$this ~= "${expr}"`;
    }

    query += ", ?(flecs.doc.Description, flecs.doc.Brief)"

    flecs.query(query, {limit: 256}, (reply) => {
      if (reply.entities) {
        prop_query.value.entities = reply.entities;
      }
    });
  }
});
</script>

<style scoped>
#prop-explorer {
  grid-column: 2;
  grid-row: 1;
  border-top-right-radius: 0.5em;
  border-bottom-right-radius: 0.5em;
  font-size: 14px;
  overflow-y: auto;
}
</style>
