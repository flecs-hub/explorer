<template>
  <div id="pane-info">
    <p>Build</p>
    <div class="info-table">
      <div class="info-table-cell" style="grid-column: 1; grid-row: 1">Name</div>
      <div class="info-table-cell" style="grid-column: 2; grid-row: 1; border-right-width: 0px;">
        <span class="info-table-value">{{ app_name }}</span>
      </div>

      <div class="info-table-cell info-table-cell-alt" style="grid-column: 1; grid-row: 2">Flecs version</div>
      <div class="info-table-cell info-table-cell-alt" style="grid-column: 2; grid-row: 2; border-right-width: 0px;">
        <span class="info-table-value">{{ version }}</span>
      </div>

      <div class="info-table-cell" style="grid-column: 1; grid-row: 3">Debug</div>
      <div class="info-table-cell" style="grid-column: 2; grid-row: 3; border-right-width: 0px;">
        <span class="info-table-value">{{ debug }}</span>
      </div>

      <div class="info-table-cell info-table-cell-alt" style="grid-column: 1; grid-row: 4">Sanitize</div>
      <div class="info-table-cell info-table-cell-alt" style="grid-column: 2; grid-row: 4; border-right-width: 0px;">
        <span class="info-table-value">{{ sanitize }}</span>
      </div>

      <div class="info-table-cell" style="grid-column: 1; grid-row: 5">Perf tracing</div>
      <div class="info-table-cell" style="grid-column: 2; grid-row: 5; border-right-width: 0px;">
        <span class="info-table-value">{{ perf_trace }}</span>
      </div>

      <div class="info-table-cell info-table-cell-alt" style="grid-column: 1; grid-row: 6">Compiler</div>
      <div class="info-table-cell info-table-cell-alt" style="grid-column: 2; grid-row: 6; border-right-width: 0px;">
        <span class="info-table-value">{{ compiler }}</span>
      </div>
    </div>

    <p>Addons</p>
    <div class="info-addons">
      <div v-for="(addon, i) in addons" :class="css_addon(i)">{{ addon }}</div>
    </div>

    <p>Flags</p>
    <div class="info-addons">
      <div v-for="(flag, i) in flags" :class="css_addon(i)">{{ flag }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "internals-build",
}
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true },
});

const css_addon = (i) => {
  if (!(i % 2)) {
    return "info-addon";
  } else {
    return "info-addon-alt";
  }
}

const app_name = computed(() => {
  return props.app_state.app_name;
});

const version = computed(() => {
  if (props.app_state.build_info) {
    if (props.app_state.build_info.version) {
      return props.app_state.build_info.version;
    } else {
      return "3.x.x";
    }
  } else {
    return "?.?.?";
  }
});

const debug = computed(() => {
  if (props.app_state.build_info) {
    return props.app_state.build_info.debug ? "Enabled" : "Disabled";
  } else {
    return "Unknown";
  }
});

const sanitize = computed(() => {
  if (props.app_state.build_info) {
    return props.app_state.build_info.sanitize ? "Enabled" : "Disabled";
  } else {
    return "Unknown";
  }
});

const perf_trace = computed(() => {
  if (props.app_state.build_info) {
    return props.app_state.build_info.perf_trace ? "Enabled" : "Disabled";
  } else {
    return "Unknown";
  }
});

const compiler = computed(() => {
  if (props.app_state.build_info) {
    return props.app_state.build_info.compiler;
  } else {
    return "Unknown";
  }
});

const addons = computed(() => {
  if (props.app_state.build_info && props.app_state.build_info.addons) {
    return props.app_state.build_info.addons;
  } else {
    return [];
  }
});

const flags = computed(() => {
  if (props.app_state.build_info && props.app_state.build_info.flags) {
    return props.app_state.build_info.flags;
  } else {
    return [];
  }
});

</script>

<style scoped>
#pane-info {
  padding-top: 0.0px;
}

#pane-info p {
  margin: 0px;
  margin-top: 1.0rem;
  padding-left: 0.5rem;
  text-transform: uppercase;
  color: var(--secondary-text);
  font-weight: bold;
  font-size: 1rem;
}

div.info-table {
  display: grid;
  grid-template-columns: 175px 1fr;
  grid-template-rows: 6;
  margin-top: 0.5rem;
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  color: var(--secondary-text);
  overflow: hidden;
}

div.info-table-cell {
  padding-left: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

div.info-table-cell-alt {
  background-color: var(--bg-content-alt);
}

span.info-table-value {
  color: var(--primary-text);
}

div.info-addons {
  display: grid;
  margin-top: 0.5rem;
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  color: var(--primary-text);
  overflow: hidden;
  padding-left: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

</style>
