<template>
  <div id="query-browser">
    <search-box v-model="filter_expr"></search-box>
    <div class="query-browser-list">
      <query-list-item 
        :prop="query" 
        :expr="nameQuery.expr"
        :index="i" 
        :selected="selected"
        v-for="(query, i) in queries.results"
        v-on:select="onSelect(i)">
      </query-list-item>
    </div>
  </div>
</template>

<script>
export default { name: "query-browser" }
</script>

<script setup>
import { onMounted, ref, computed, watch, defineProps, defineModel } from 'vue';

const props = defineProps({
  host: {type: String, required: true},
});

const query_name = defineModel("query_name");
const queries = ref({results: []});
const selected = ref(-1);
const filter_expr = ref();

const doQuery = () => {
  let q = "Query, ?flecs.system.System, ?flecs.core.Observer";
  if (filter_expr.value) {
    let nq = nameQuery.value;
    q += `, ${nq.query}`
  }

  flecs.query(q, 
    {rows: true, limit: 250}, 
    (reply) => {
      queries.value.results = reply.results;
    },
    (reply) => {
      // error
    });
}

const nameQuery = computed(() => {
  return nameQueryFromExpr(filter_expr.value);
});

onMounted(() => {
  doQuery();
});

watch(filter_expr, () => {
  doQuery();
});

const onSelect = (index) => {
  if (selected.value == index) {
    selected.value = -1;
    query_name.value = undefined;
  } else {
    const q = queries.value.results[index];
    let path = "";
    if (q.parent) {
      path += q.parent + ".";
    }
    path += q.name;
    query_name.value = path;
    selected.value = index;
  }
}

</script>

<style scoped>
#query-browser {
  height: 100%;
  margin-left: 0.5rem;
}

div.query-browser-list {
  border-radius: var(--border-radius-medium);
  overflow: auto;
  max-height: calc(100% - 2.8rem);
}
</style>
