<template>
  <div id="query-browser">
    <div class="query-browser-search-box">
      <div class="query-browser-search-input">
        <search-box v-model="filter_expr"></search-box>
      </div>
      <div class="query-browser-search-filter">
        <toggle v-model="show_filter">
          <icon src="filter"></icon>
        </toggle>
      </div>
    </div>
    <template v-if="show_filter">
      <toggle class="query-browser-filter-toggle" v-model="show_flecs" :opacity="1.0">
        <div class="flecs-logo show-flecs"></div>
      </toggle>
      <toggle class="query-browser-filter-toggle" v-model="show_systems" :opacity="1.0">
        <icon src="code"></icon> systems
      </toggle>
      <toggle class="query-browser-filter-toggle" v-model="show_queries" :opacity="1.0">
        <icon src="search"></icon> queries
      </toggle>
    </template>
    <div :class="css">
      <template v-for="(query, i) in queries.results">
        <query-list-item 
          :prop="query"
          :img="itemIcon(query)"
          :expr="nameQuery.expr"
          :index="i" 
          :selected="selected"
          v-on:select="onSelect(i)"
          v-if="passFilter(query)">
        </query-list-item>
      </template>
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
const show_filter = ref(false);
const show_flecs = ref(false);
const show_systems = ref(true);
const show_queries = ref(true);

const doQuery = () => {
  let q = "Query, ?flecs.system.System";
  if (filter_expr.value) {
    let nq = nameQuery.value;
    q += `, ${nq.query}`
  }

  flecs.connect(props.host);

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

const css = computed(() => {
  let result = ['query-browser-list'];
  if (show_filter.value) {
    result.push('query-browser-list-show-filter');
  }
  return result;
});

const itemIcon = (item) => {
  if (item.is_set[1]) {
    return "code";
  } else {
    return "search";
  }
}

const passFilter = (item) => {
  let isSystem = item.is_set[1];
  let isFlecs = false;

  if (item.parent) {
    if (item.parent.split(".")[0] == "flecs") {
      isFlecs = true;
    }
  }

  if (isFlecs && !show_flecs.value) {
    return false;
  }

  if (isSystem && !show_systems.value) {
    return false;
  }

  if (!isSystem && !show_queries.value) {
    return false;
  }

  return true;
}

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
  overflow-y: auto;
  max-height: calc(100% - 2.8rem);
}

div.query-browser-list-show-filter {
  max-height: calc(100% - 5.6rem);
}

div.query-browser-search-box {
  display: grid;
  grid-template-columns: 1fr 32px;
  gap: 0.5rem;
}

div.query-browser-search-input {
  grid-column: 1; 
}

div.query-browser-search-filter {
  grid-column: 2;
}

div.show-flecs {
  opacity: 1.0;
}
</style>

<style>
button.query-browser-filter-toggle {
  margin-right: 0.5rem;
  min-width: 42px;
  opacity: 0.8;
}
</style>
