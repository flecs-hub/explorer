<template>
  <div id="query-api">
    <tabs :labels="['c', 'c++', 'js', 'rest']" class="query-api-body">
      <template v-slot:c>
        <template v-if="has_query">
          <query-c :result="result"></query-c>
        </template>
      </template>
      <template v-slot:c++>
        <template v-if="has_query">
          <query-cpp :result="result"></query-cpp>
        </template>
      </template>
      <template v-slot:js>
        <template v-if="has_query">
          <p>code</p>
          <query-js :query="query"></query-js>
          <p>schema</p>
          <query-schema :result="result"></query-schema>
        </template>
      </template>
      <template v-slot:rest>
        <template v-if="has_query">
          <query-rest :url="url"></query-rest>
        </template>
      </template>
    </tabs>
  </div>
</template>

<script>
export default { name: "query-api" }
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  query: {type: Object, required: true},
  result: {type: Object, required: true}
});

const url = computed(() => {
  if (props.query.use_name) {
    return flecs.query_name(props.query.name, {rows: true, dryrun: true}).url;
  } else {
    return flecs.query(props.query.expr, {rows: true, dryrun: true}).url;
  }
});

const has_query = computed(() => {
  if (props.query.use_name) {
    return props.query.name && props.query.name.length;
  } else {
    return props.query.expr && props.query.expr.length;
  }
});

</script>

<style>
#query-api p {
  margin: 0px;
  padding-left: 0.5px;
  text-transform: uppercase;
  color: var(--secondary-text);
  font-weight: bold;
  font-size: 1rem;
}

#query-api pre {
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  padding: 1rem;
  overflow-x: auto;
}

</style>

<style>
.query-api-body {
  padding-top: 2rem !important;
  padding-left: 0.5rem !important;
  padding-right: 0.5rem !important;
}
</style>
