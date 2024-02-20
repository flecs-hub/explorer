<template>
  <div id="prop-browser" class="ace-github-dark" :style="pos_style">
    <template v-for="(el, i) in prop_query.results">
      <query-list-item :prop="el" :expr="expr" :index="i" :show_usage="!is_target">
      </query-list-item>
    </template>
  </div>
</template>

<script>
export default { name: "prop-browser" }
</script>

<script setup>
import { ref, defineProps, watch, computed } from 'vue';

const props = defineProps({
  host: {type: String, required: true },
  expr: {type: String, required: true },
  first: {type: String, required: false },
  x: {type: Number, required: true },
  y: {type: Number, required: true },
});

let prop_query = ref({results: []});
let oneof = ref("");

let is_target = computed(() => {
  return props.first !== undefined && props.first.length !== 0;
});

watch(() => props.first, () => {
  if (props.first.length) {
    const query = `?OneOf(${props.first}), ?OneOf(${props.first}, $parent)`;
    flecs.query(query, {try: true, rows: true, limit: 1}, (reply) => {
      if (reply.results) {
        let result = reply.results[0];
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
    prop_query.value.results.length = 0;
  } else {
    let queryObj = nameQueryFromExpr(props.expr, oneof.value);
    let query = queryObj.query;
    query += ", ?(flecs.doc.Description, flecs.doc.Brief)";
    query += ", ?$this(_)";
    query += ", ?$this(_, _)";
    query += ", ?Module";

    flecs.query(query, {try: true, rows: true, limit: 100}, (reply) => {
      if (reply.results) {
        prop_query.value.results = reply.results;
      }
    });
  }
});

const pos_style = computed(() => {
  let x = props.x + 16;
  let y = props.y + 16;
  let height = 0;
  if (props.expr.length) {
    height = 600;
  }
  return 'left: ' + x + 'px; top: ' + y + 'px; max-height: ' + height + 'px;'
})

</script>

<style scoped>
#prop-browser {
  position: absolute;
  width: 300px;
  font-size: 14px;
  overflow-y: auto;
  background: none;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 100;
}
</style>
