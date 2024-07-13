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
      <toggle class="query-browser-filter-toggle" v-model="show_observers" :opacity="1.0">
        <icon src="bell"></icon> observers
      </toggle>
      <toggle class="query-browser-filter-toggle" v-model="show_queries" :opacity="1.0">
        <icon src="search"></icon> queries
      </toggle>
    </template>
    <div :class="css">
      <template v-for="(query, i) in filteredResults">
        <query-list-item 
          :prop="query"
          :img="itemIcon(query)"
          :expr="nameQuery.expr"
          :index="i" 
          :selected="selected"
          v-on:select="onSelect(i)">
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
  conn: {type: Object, required: true},
});

const query_name = defineModel("query_name");
const query_kind = defineModel("query_kind");
const queries = ref({results: []});
const observers = ref({results: []});
const selected = ref(-1);
const filter_expr = ref();
const show_filter = ref(false);
const show_flecs = ref(false);
const show_systems = ref(true);
const show_observers = ref(true);
const show_queries = ref(true);

const doQueryQuery = () => {
  let q = "Query, ?flecs.system.System";
  if (filter_expr.value) {
    let nq = nameQuery.value;
    q += `, ${nq.query}`
  }

  props.conn.query(q, 
    {rows: true, limit: 1000}, 
    (reply) => {
      queries.value.results = reply.results;
    },
    (reply) => {
      // error
    });
}

const doObserverQuery = () => {
  let q = "Observer, !Query, ?(ChildOf, $parent), !Observer($parent), !Query($parent)";
  if (filter_expr.value) {
    let nq = nameQuery.value;
    q += `, ${nq.query}`
  }

  props.conn.query(q, 
    {rows: true, limit: 1000}, 
    (reply) => {
      for (let r of reply.results) {
        r.observer = true
      }
      observers.value.results = reply.results;
    },
    (reply) => {
      // error
    });
}

const doQuery = () => {
  doQueryQuery();
  doObserverQuery();
}

const results = computed(() => {
  if (queries.value.results) {

    return queries.value.results.concat(observers.value.results);
  } else {
    return [];
  }
});

const filteredResults = computed(() => {
  let items = [];
  for (const item of results.value) {
    if (passFilter(item)) {
      items.push(item);
    }
  }

  return items;
});

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
  if (item.observer) {
    return "bell";
  } else if (!item.fields.is_set || item.fields.is_set[1]) {
    return "code";
  } else {
    return "search";
  }
}

const queryKind = (item) => {
  if (item.observer) {
    return "observer";
  } else {
    let isSystem = !item.fields.is_set || item.fields.is_set[1];
    if (isSystem) {
      return "system";
    }
    return "query";
  }
}

const passFilter = (item) => {
  const kind = queryKind(item);
  let isFlecs = false;

  if (item.parent) {
    if (item.parent.split(".")[0] == "flecs") {
      isFlecs = true;
    }
  }

  if (isFlecs && !show_flecs.value) {
    return false;
  }

  if (kind == "observer") {
    if (!show_observers.value) {
      return false;
    }
  } else {
    if ((kind == "system") && !show_systems.value) {
      return false;
    }

    if ((kind == "query") && !show_queries.value) {
      return false;
    }
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
    const item = filteredResults.value[index];
    let path = "";
    if (item.parent) {
      path += item.parent + ".";
    }
    path += item.name;
    query_name.value = path;
    selected.value = index;
    query_kind.value = queryKind(item);
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
