<template>
  <div id="prop-browser" class="ace-github-dark" :style="posStyle">
    <template v-for="(el, i) in prop_query.results">
      <query-list-item :prop="el" :expr="expr" :index="i" :show_usage="!isTarget"
        v-on:click="selectProp(el)">
      </query-list-item>
    </template>
  </div>
</template>

<script>
export default { name: "prop-browser" }
</script>

<script setup>
import { ref, defineProps, defineExpose, defineEmits, watch, computed } from 'vue';

const emit = defineEmits(['select']);

const props = defineProps({
  conn: {type: Object, required: true },
  expr: {type: String, required: true },
  first: {type: String, required: false },
  x: {type: Number, required: true },
  y: {type: Number, required: true },
});

let prop_query = ref({results: []});
let oneof = ref("");
const showWidget = ref(true);

let selectProp = (prop) => {
  emit('select', prop);
}

let isTarget = computed(() => {
  return props.first !== undefined && props.first.length !== 0;
});

watch(() => props.first, () => {
  if (props.first.length) {
    const query = `?OneOf(${props.first}), ?OneOf(${props.first}, $parent)`;
    props.conn.query(query, {try: true, rows: true, limit: 1}, (reply) => {
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
  if (!props.expr.length && (!oneof.value.length || !props.first.length)) {
    prop_query.value.results.length = 0;
  } else {
    let queryObj = nameQueryFromExpr(props.expr, oneof.value);
    let query = queryObj.query;
    query += ", ?(flecs.doc.Description, flecs.doc.Brief)";
    query += ", ?$this(_)";
    query += ", ?$this(_, _)";
    query += ", ?Module";

    props.conn.query(query, {try: true, rows: true, limit: 100}, (reply) => {
      if (reply.results) {
        prop_query.value.results = reply.results;
      }
    });
  }
});

const posStyle = computed(() => {
  let x = props.x + 16;
  let y = props.y + 16;
  let height = 0;
  if (props.expr.length) {
    height = 600;
  }
  let result = 
    'left: ' + x + 'px; top: ' + y + 'px; max-height: ' + height + 'px;'
  if (!showWidget.value) {
    result += " display: none";
  }
  return result;
});

const hide = () => {
  showWidget.value = false;
}

const show = () => {
  showWidget.value = true;
}

defineExpose({
  hide,
  show
});

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
