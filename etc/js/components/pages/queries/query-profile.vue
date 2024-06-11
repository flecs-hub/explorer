<template>
  <div id="query-profile">
    <template v-if="query_profile">
      <div class="query-profile-table">
        <div class="query-profile-cell" style="grid-column: 1; grid-row: 1">Evaluation count</div>
        <div class="query-profile-cell" style="grid-column: 2; grid-row: 1; border-right-width: 0px;">
          <span class="query-profile-value">{{ evaluation_count }}</span>
        </div>
      </div>

      <div class="query-profile-table">
        <div class="query-profile-cell" style="grid-column: 1; grid-row: 1">Entities</div>
        <div class="query-profile-cell" style="grid-column: 2; grid-row: 1; border-right-width: 0px;">
          <span class="query-profile-value">{{ entity_count }}</span>
        </div>

        <div class="query-profile-cell query-profile-cell-alt" style="grid-column: 1; grid-row: 2">Results</div>
        <div class="query-profile-cell query-profile-cell-alt" style="grid-column: 2; grid-row: 2; border-right-width: 0px;">
          <span class="query-profile-value">{{ result_count }}</span>
        </div>
        
        <div class="query-profile-cell" style="grid-column: 1; grid-row: 3">Fragmentation</div>
        <div class="query-profile-cell" style="grid-column: 2; grid-row: 3; border-right-width: 0px;">
          <span class="query-profile-value">{{ fragmentation }}</span>%
        </div>
      </div>

      <div class="query-profile-table">
        <div class="query-profile-cell query-profile-cell" style="grid-column: 1; grid-row: 4;">Evaluation time</div>
        <div class="query-profile-cell query-profile-cell" style="grid-column: 2; grid-row: 4; border-right-width: 0px;">
          <span class="query-profile-value">{{ eval_time_min }}</span> us (min) -
          <span class="query-profile-value">{{ eval_time_avg }}</span> us (avg) -
          <span class="query-profile-value">{{ eval_time_max }}</span> us (max)
        </div>

        <div class="query-profile-cell query-profile-cell-alt" style="grid-column: 1; grid-row: 5; border-bottom-width: 0px;">Time / entity</div>
        <div class="query-profile-cell query-profile-cell-alt" style="grid-column: 2; grid-row: 5; border-right-width: 0px; border-bottom-width: 0px;">
          <span class="query-profile-value">{{ entity_time_ns }}</span> ns
        </div>

        <div class="query-profile-cell query-profile-cell" style="grid-column: 1; grid-row: 6; border-bottom-width: 0px;">Time / result</div>
        <div class="query-profile-cell query-profile-cell" style="grid-column: 2; grid-row: 6; border-right-width: 0px; border-bottom-width: 0px;">
          <span class="query-profile-value">{{ result_time_ns }}</span> ns
        </div>
      </div>

      <div class="query-profile-table">
        <div class="query-profile-cell" style="grid-column: 1; grid-row: 1">Total memory</div>
        <div class="query-profile-cell" style="grid-column: 2; grid-row: 1; border-right-width: 0px;">
          <span class="query-profile-value">{{ formatDataSize(total_bytes) }}</span>
          {{ dataSizeUnit(total_bytes) }}
        </div>

        <div class="query-profile-cell query-profile-cell-alt" style="grid-column: 1; grid-row: 2">Entity ids</div>
        <div class="query-profile-cell query-profile-cell-alt" style="grid-column: 2; grid-row: 2; border-right-width: 0px;">
          <span class="query-profile-value">{{ formatDataSize(entity_id_bytes) }}</span>
          {{ dataSizeUnit(entity_id_bytes) }}
        </div>
        
        <div class="query-profile-cell" style="grid-column: 1; grid-row: 3">Variable ids</div>
        <div class="query-profile-cell" style="grid-column: 2; grid-row: 3; border-right-width: 0px;">
          <span class="query-profile-value">{{ formatDataSize(variable_id_bytes) }}</span>
          {{ dataSizeUnit(variable_id_bytes) }}
        </div>
        
        <div class="query-profile-cell query-profile-cell-alt" style="grid-column: 1; grid-row: 4;">Components</div>
        <div class="query-profile-cell query-profile-cell-alt" style="grid-column: 2; grid-row: 4; border-right-width: 0px;">
          <span class="query-profile-value">{{ formatDataSize(component_bytes) }}</span>
          {{ dataSizeUnit(component_bytes) }}
        </div>

        <div class="query-profile-cell" style="grid-column: 1; grid-row: 5;">Shared components</div>
        <div class="query-profile-cell" style="grid-column: 2; grid-row: 5; border-right-width: 0px;">
          <span class="query-profile-value">{{ formatDataSize(shared_component_bytes) }}</span>
          {{ dataSizeUnit(shared_component_bytes) }}
        </div>
      </div>
    </template>
    <template v-else>
      <pre>Profile data not available</pre>
    </template>
  </div>
</template>

<script>
export default { name: "query-profile" };
</script>
  
<script setup>
import { computed, defineProps } from 'vue';

const dataPostfix = ["B", "KB", "MB", "GB", "TB"];

const formatDataSize = (bytes) => {
  let i = 0;
  while (bytes > 1000) {
    bytes /= 1000;
    i ++;
  }

  if (i) {
    return bytes.toFixed(2);
  } else {
    return bytes;
  }
}

const dataSizeUnit = (bytes) => {
  let i = 0;
  while (bytes > 1000) {
    bytes /= 1000;
    i ++;
  }

  return dataPostfix[i];
};

const props = defineProps({
  result: {type: Object, required: true}
});

const query_profile = computed(() => {
  if (props.result.query_profile) {
    return props.result.query_profile;
  } else {
    return {
      result_count: 0, 
      entity_count: 0, 
      eval_time_avg_us: 0, 
      eval_time_min_us: 0, 
      eval_time_max_us: 0,
      component_bytes: 0,
      shared_component_bytes: 0
    };
  }
});

const field_info = computed(() => {
  if (props.result.field_info) {
    return props.result.field_info;
  } else {
    return { };
  }
});

const evaluation_count = computed(() => {
  return query_profile.value.eval_count;
});

const result_count = computed(() => {
  return query_profile.value.result_count;
});

const entity_count = computed(() => {
  return query_profile.value.entity_count;
});

const fragmentation = computed(() => {
  if (!entity_count.value) {
    return 0;
  }
  return (result_count.value / entity_count.value * 100).toFixed(2);
});

const eval_time_avg = computed(() => {
  return (query_profile.value.eval_time_avg_us).toFixed(2);
});

const eval_time_min = computed(() => {
  return (query_profile.value.eval_time_min_us).toFixed(2);
});

const eval_time_max = computed(() => {
  return (query_profile.value.eval_time_max_us).toFixed(2);
});

const entity_time_ns = computed(() => {
  if (!entity_count.value) {
    return 0;
  }
  return ((query_profile.value.eval_time_avg_us / entity_count.value) * 1000).toFixed(2);
});

const result_time_ns = computed(() => {
  if (!result_count.value) {
    return 0;
  }
  return ((query_profile.value.eval_time_avg_us / result_count.value) * 1000).toFixed(2);
});

const entity_id_bytes = computed(() => {
  return entity_count.value * 8;
});

const variable_id_bytes = computed(() => {
  let var_count = 0;
  if (props.result.vars) {
    var_count = props.result.vars.length;
  }
  return result_count.value * var_count * 8;
});

const component_bytes = computed(() => {
  return query_profile.value.component_bytes;
});

const shared_component_bytes = computed(() => {
  return query_profile.value.shared_component_bytes;
});

const total_bytes = computed(() => {
  return entity_id_bytes.value + variable_id_bytes.value + 
    component_bytes.value + shared_component_bytes.value;
});

</script>

<style scoped>
div.query-profile-table {
  display: grid;
  grid-template-columns: 175px 1fr;
  grid-template-rows: 6;
  margin-top: 1rem;
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  color: var(--secondary-text);
  overflow: hidden;
}

div.query-profile-cell {
  padding-left: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

div.query-profile-cell-alt {
  background-color: var(--bg-content-alt);
}

span.query-profile-value {
  color: var(--primary-text);
}

</style>
