<template>
  <div id="query-api">
    <tabs :labels="['c', 'c++', 'js', 'rest']" class="query-api-body">
      <template v-slot:c>
        <query-c :result="result"></query-c>
      </template>
      <template v-slot:c++>
        <query-cpp :result="result"></query-cpp>
      </template>
      <template v-slot:js>
        <p>code</p>
        <query-js :query="query"></query-js>
        <p>schema</p>
        <query-schema :result="result"></query-schema>
      </template>
      <template v-slot:rest>
        <query-rest :url="url"></query-rest>
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
  query: {type: String, required: true},
  result: {type: Object, required: true}
});

const url = computed(() => {
  return flecs.query(props.query, {rows: true}).url;
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
  background-color: var(--bg-textbox);
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
