<template>
  <div id="pane-info" class="pane">
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

    <p>Connection</p>
    <div class="info-table">
      <div class="info-table-cell" style="grid-column: 1; grid-row: 1">Status</div>
      <div class="info-table-cell" style="grid-column: 2; grid-row: 1; border-right-width: 0px;">
        <span class="info-table-value">{{ connectionStatus }}</span>
      </div>

      <div class="info-table-cell info-table-cell-alt" style="grid-column: 1; grid-row: 2">Mode</div>
      <div class="info-table-cell info-table-cell-alt" style="grid-column: 2; grid-row: 2; border-right-width: 0px;">
        <span class="info-table-value">{{ connectionMode }}</span>
      </div>

      <div class="info-table-cell" style="grid-column: 1; grid-row: 3">Heartbeats received</div>
      <div class="info-table-cell" style="grid-column: 2; grid-row: 3; border-right-width: 0px;">
        <span class="info-table-value">{{ heartbeatsReceived }}</span>
      </div>

      <div class="info-table-cell info-table-cell-alt" style="grid-column: 1; grid-row: 4">Requests Tx/Rx/Err</div>
      <div class="info-table-cell info-table-cell-alt" style="grid-column: 2; grid-row: 4; border-right-width: 0px;">
        <span class="info-table-value">{{ requestsSent }} / {{ requestsReceived }} / {{ requestErrors }}</span> 
      </div>

      <div class="info-table-cell" style="grid-column: 1; grid-row: 5">Data received</div>
      <div class="info-table-cell" style="grid-column: 2; grid-row: 5; border-right-width: 0px;">
        <span class="info-table-value">{{ bytesReceived }} B</span> 
      </div>
    </div>

    <p>Addons</p>
    <div class="info-addons">
      <div v-for="(addon, i) in addons" :class="css_addon(i)">{{ addon }}</div>
    </div>

    <p>Natvis</p>
    <div class="info-natvis">
      <pre>{{ natvisXml }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: "pane-info",
}
</script>

<script setup>
import { defineProps, ref, computed, onMounted } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true },
});

const componentQueryResult = ref({results: []});

onMounted(() => {
  props.conn.query("Component, (Identifier, Symbol), !flecs.meta.primitive", {}, (reply) => {
    componentQueryResult.value = reply;
  });
});

const natvisXml = computed(() => {
  let xml = "";

  for (const r of componentQueryResult.value.results) {
    const size = r.fields.values[0].size;
    if (size === 0) {
      continue;
    }

    const name = r.name;
    let path = name;
    if (r.parent) {
      path = r.parent + "." + name;
    }

    let symbol = r.fields.values[1].value;
    symbol = symbol.replaceAll(".", "::");

    xml += `<Item Name="${name}" Condition='!strcmp(ComponentName, "${path}")'>*(${symbol}*)Ptr</Item>\n`;
  }

  return xml;
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

const connectionStatus = computed(() => {
  return flecs.ConnectionStatus.toString(props.app_state.status);
});

const connectionMode = computed(() => {
  return flecs.ConnectionMode.toString(props.app_state.mode);
});

const heartbeatsReceived = computed(() => {
  return props.app_state.heartbeats_received;
});

const requestsSent = computed(() => {
  return props.app_state.requests.sent;
});

const requestsReceived = computed(() => {
  return props.app_state.requests.received;
});

const requestErrors = computed(() => {
  return props.app_state.requests.error;
});

const bytesReceived = computed(() => {
  return props.app_state.bytes.received;
});

const addons = computed(() => {
  if (props.app_state.build_info && props.app_state.build_info.addons) {
    return props.app_state.build_info.addons;
  } else {
    return [];
  }
});

</script>

<style scoped>
#pane-info {
  border-radius: var(--border-radius-medium);
  padding: 0.5rem;
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

div.info-natvis {
  display: grid;
  overflow: hidden;
}

</style>
