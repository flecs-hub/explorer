<template>
<div id="inspect-pane" class="ace-github-dark">
  <tabs :labels="['json', 'plan']">
    <template v-slot:json>
      <query-request 
        :host="host"
        :query="query">
      </query-request>
    </template>
    <template v-slot:plan>
      <query-request 
        :host="host"
        :query="query"
        :params="{plan: true}">
      </query-request>
    </template>
  </tabs>
</div>
</template>

<script>
export default {
  name: "inspect-pane",
}
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  host: {type: String, required: true },
  query: {type: String, required: true }
});
</script>

<style scoped>
#inspect-pane {
  position: relative;
  grid-column: 3;
  grid-row: 3 / 4;
  border-radius: var(--border-radius-medium);
  height: calc(100vh - 60px);
  margin: 0px;
}

</style>
