<template>
  <div id="page-stats" class="page-content">
    <edit-tabs :items="items" v-model:active_item="app_params.internals.tab">
      <template v-slot:tables>
        <template v-if="tablesLoading">
          <div class="loading">Loading...</div>
        </template>
        <template v-else>
          <internals-tables-table :tables="tables"></internals-tables-table>
        </template>
      </template>
      <template v-slot:components>
        <template v-if="componentsLoading">
          <div class="loading">Loading...</div>
        </template>
        <template v-else>
          <internals-components-table :components="components"></internals-components-table>
        </template>
      </template>
      <template v-slot:build>
        <internals-build :conn="conn" :app_state="app_state"></internals-build>
      </template>
      <template v-slot:connection>
        <internals-connection :conn="conn" :app_state="app_state"></internals-connection>
      </template>
      <template v-slot:natvis>
        <internals-natvis :conn="conn" :app_state="app_state"></internals-natvis>
      </template>
    </edit-tabs>
  </div>
</template>

<script>
export default { name: "page-internals" };
</script>

<script setup>
import { defineProps, computed, defineModel, onMounted, ref } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true}
});

const app_params = defineModel("app_params");

const tablesLoading = ref(true);
const tables = ref([]);

const componentsLoading = ref(true);
const components = ref([]);

const items = computed(() => {
  let result = [];

  result.push({
    label: "Tables",
    value: "tables",
    canClose: false
  });

  result.push({
    label: "Components",
    value: "components",
    canClose: false
  });

  result.push({
    label: "Build",
    value: "build",
    canClose: false
  });

  result.push({
    label: "Natvis",
    value: "natvis",
    canClose: false
  });

  result.push({
    label: "Connection",
    value: "connection",
    canClose: false
  });

  return result;
});

onMounted(() => {
  props.conn.request("tables", {}, (reply) => {
    tables.value = reply;
    tablesLoading.value = false;
  });

  props.conn.request("components", {}, (reply) => {
    components.value = reply;
    componentsLoading.value = false;
  });
});

</script>

<style scoped>

div.loading {
  color: var(--secondary-text);
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
  padding: 1rem;
}

</style>
