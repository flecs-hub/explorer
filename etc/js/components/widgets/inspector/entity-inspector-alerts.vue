<template>
  <div class="entity-inspector-alerts">
    <div class="entity-inspector-alert" v-for="alert in entityQueryResult.alerts">
      <div class="entity-inspector-alert-icon">
        <icon 
          :src="alertIcon(alert)"
          :opacity="0.7">
        </icon>
      </div>
      <div class="entity-inspector-alert-message">{{ alert.message }}</div>
    </div>
    <template v-if="!entityQueryResult.alerts || !entityQueryResult.alerts.length">
      <span style="color: var(--secondary-text);">No alerts, all good.</span>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-alerts" }
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  path: {type: String, required: true},
  entityQueryResult: {type: Object, required: true},
});

function alertIcon(alert) {
  if (alert.severity == "Error") {
    return "error";
  } else if (alert.severity == "Warning") {
    return "warning";
  } else if (alert.severity == "Info") {
    return "info";
  }
}

</script>

<style scoped>

div.entity-inspector-alert {
  padding: 8px;
  padding-top: 0px;
  border-radius: var(--border-radius-medium);
  border-style: solid;
  border-width: 1px;
  border-color: var(--border);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: 8px;
}

div.entity-inspector-alert {
  display: grid;
  grid-template-columns: 24px auto;
}

div.entity-inspector-alert-icon {
  grid-column: 1;
}

div.entity-inspector-alert-message {
  grid-column: 2;
}

</style>
