<template>
<div id="inspect-pane" class="ace-github-dark">
  <tabs :labels="['json', 'api', 'plan']" class="inspect-tab-content">
    <template v-slot:table>
      <!--query-request 
        :host="host"
        :query="query"
        :params="{try: true, field_info: true, rows: true}"
        v-slot="slotProps">
        <query-table :result="slotProps.result"></query-table>
      </query-request-->
    </template>
    <template v-slot:json>
      <query-request 
        :host="host"
        :query="query"
        :params="{try: true, rows: true}"
        v-slot="slotProps">
        <query-result :result="slotProps.result"></query-result>
      </query-request>
    </template>
    <template v-slot:plan>
      <query-request 
        :host="host"
        :query="query"
        :params="{try: true, plan: true}"
        v-slot="slotProps">
        <query-plan :result="slotProps.result"></query-plan>
      </query-request>
    </template>
    <template v-slot:api>
      <query-request 
        :host="host"
        :query="query"
        :params="{try: true, field_info: true, query_info: true, results: false}"
        v-slot="slotProps">
        <query-api :result="slotProps.result" :query="query"></query-api>
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

<style>
.inspect-tab-content {
  margin: 0px !important;;
  padding: 0.5rem !important;
}
</style>