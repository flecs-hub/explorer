<template>
  <div id="query-api">
    <tabs :items="['c', 'c++', 'js', 'rest']" class="query-api-body">
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
  conn: {type: Object, required: true},
  query: {type: Object, required: true},
  result: {type: Object, required: true}
});

const url = computed(() => {
  let result;
  if (props.query.use_name) {
    result = props.conn.queryName(props.query.name, {dryrun: true}).url;
  } else {
    result = props.conn.query(props.query.expr, {dryrun: true}).url;
  }

  if (props.conn.url) {
    return props.conn.url + "/" + result;
  } else {
    return result;
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
#query-api {
  height: 100%;
}

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

.query-api-body {
  padding-top: 1rem !important;
  padding-left: 0.5rem !important;
  padding-right: 0.5rem !important;
  overflow-y: auto;
}
</style>
