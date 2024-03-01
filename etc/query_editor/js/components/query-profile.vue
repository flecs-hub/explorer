<template>
  <div id="query-profile">
    <template v-if="query_profile">
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
          <span class="query-profile-value">{{ fragmentation }}%</span>
        </div>
        
        <div class="query-profile-cell query-profile-cell-alt" style="grid-column: 1; grid-row: 4;">Evaluation time</div>
        <div class="query-profile-cell query-profile-cell-alt" style="grid-column: 2; grid-row: 4; border-right-width: 0px;">
          <span class="query-profile-value">{{ eval_time_min }}us</span> (min) -
          <span class="query-profile-value">{{ eval_time_avg }}us</span> (avg) -
          <span class="query-profile-value">{{ eval_time_max }}us</span> (max)
        </div>

        <div class="query-profile-cell" style="grid-column: 1; grid-row: 5; border-bottom-width: 0px;">Time / entity</div>
        <div class="query-profile-cell" style="grid-column: 2; grid-row: 5; border-right-width: 0px; border-bottom-width: 0px;">
          <span class="query-profile-value">{{ entity_time_ns }}ns</span>
        </div>

        <div class="query-profile-cell query-profile-cell-alt" style="grid-column: 1; grid-row: 6; border-bottom-width: 0px;">Time / result</div>
        <div class="query-profile-cell query-profile-cell-alt" style="grid-column: 2; grid-row: 6; border-right-width: 0px; border-bottom-width: 0px;">
          <span class="query-profile-value">{{ result_time_ns }}ns</span>
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
      eval_time_max_us: 0
    };
  }
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

</script>
  
<style scoped>
#query-profile {
  height: 100%;
  overflow-y: auto;
}

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
