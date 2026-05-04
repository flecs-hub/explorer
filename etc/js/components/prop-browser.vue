<template>
  <div id="prop-browser" :style="posStyle">
    <template v-for="(el, i) in prop_query.results">
      <query-list-item :prop="el" :expr="expr" :index="i" :show_usage="false"
        :highlight="i == selected"
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
const selected = ref(0);

let selectProp = (prop) => {
  emit('select', { value: prop, kind: "select" });
}

function select(kind) {
  if (!showWidget.value) {
    return false;
  }

  const results = prop_query.value.results;
  if (results && results.length) {
    const idx = Math.min(selected.value, results.length - 1);
    emit('select', { value: results[idx], kind: kind });
    return true;
  }
  return false;
}

function moveUp() {
  if (!showWidget.value) return false;
  const results = prop_query.value.results;
  if (!results || !results.length) return false;
  selected.value = (selected.value - 1 + results.length) % results.length;
  return true;
}

function moveDown() {
  if (!showWidget.value) return false;
  const results = prop_query.value.results;
  if (!results || !results.length) return false;
  selected.value = (selected.value + 1) % results.length;
  return true;
}

function propToExpr(prop) {
  if (prop.parent) {
    return prop.parent + "." + prop.name;
  } else {
    return prop.name;
  }
}

function equalsUpTo(result) {
  const len = props.expr.length;
  const s2 = result.substring(0, len);
  return props.expr === s2;
}

function sortResults(results) {
  const userExpr = props.expr;
  const userHasDot = userExpr.includes('.');

  return results.sort((a, b) => {
    const aExpr = propToExpr(a);
    const bExpr = propToExpr(b);

    const aExact = userHasDot ? (aExpr === userExpr) : (a.name === userExpr);
    const bExact = userHasDot ? (bExpr === userExpr) : (b.name === userExpr);
    if (aExact != bExact) {
      return bExact - aExact;
    }

    const aEq = userHasDot ? equalsUpTo(aExpr) : a.name.startsWith(userExpr);
    const bEq = userHasDot ? equalsUpTo(bExpr) : b.name.startsWith(userExpr);

    if (aEq != bEq) {
      return bEq - aEq;
    } else {
      return a.name.length - b.name.length;
    }
  });
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
        if (!result.fields.is_set || result.fields.is_set[1]) {
          oneof.value = result.vars.parent;
        } else if (!result.fields.is_set || result.fields.is_set[0]) {
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
    selected.value = 0;
  } else {
    let queryObj = nameQueryFromExpr(props.expr, oneof.value);
    let query = queryObj.query;
    query += ", ?(flecs.doc.Description, flecs.doc.Brief)";
    query += ", ?$this(_)";
    query += ", ?$this(_, _)";
    query += ", ?Module";

    props.conn.query(query, {try: true, rows: true, limit: 100}, (reply) => {
      if (reply.results) {
        if (reply.results.length == 1) {
          let result = reply.results[0];
          if (propToExpr(result) == props.expr) {
            prop_query.value.results = [];
            selected.value = 0;
            return;
          }
        }
        prop_query.value.results = sortResults(reply.results);
        selected.value = 0;
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
  show,
  select,
  moveUp,
  moveDown
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
  border-radius: var(--border-radius-medium);
  z-index: 100;
}
</style>
