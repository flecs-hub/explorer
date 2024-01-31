<template>
  <div id="prop-explorer" class="ace-github-dark">
    <template v-for="el in prop_query.entities">
      <prop-suggestion :prop="el" :show_usage="!is_target"></prop-suggestion>
    </template>
  </div>
</template>

<script>
export default { name: "prop-explorer" }
</script>

<script setup>
import { ref, defineProps, watch, computed } from 'vue';

const props = defineProps({
  host: {type: String, required: true },
  expr: {type: String, required: true },
  first: {type: String, required: false }
});

let prop_query = ref({entities: []});
let oneof = ref("");

let is_target = computed(() => {
  return props.first !== undefined && props.first.length !== 0;
});

watch(() => props.first, () => {
  if (props.first.length) {
    const query = `?OneOf(${props.first}), ?OneOf(${props.first}, $parent)`;
    flecs.query(query, {limit: 1}, (reply) => {
      if (reply.entities) {
        let result = reply.entities[0];
        if (result.is_set && result.is_set[1]) {
          oneof.value = result.vars.parent;
        } else if (result.is_set[0]) {
          oneof.value = props.first;
        }
      } else {
        oneof.value = "";
      }
    });
  } else {
    oneof.value = "";
  }
});

watch(() => [props.expr, oneof.value], () => {
  flecs.connect(props.host);

  if (!props.expr.length && (!oneof.value.length || !props.first.length)) {
    prop_query.value.entities.length = 0;
  } else {
    let parent;
    let expr = props.expr;
    let last_sep = expr.lastIndexOf(".");
    if (last_sep != -1) {
      parent = expr.slice(0, last_sep);
      expr = expr.slice(last_sep + 1, expr.length);
    } else {
      parent = oneof.value;
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

    query += ", ?(flecs.doc.Description, flecs.doc.Brief)";
    query += ", ?$this(_)";
    query += ", ?$this(_, _)";
    query += ", ?Module";

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
