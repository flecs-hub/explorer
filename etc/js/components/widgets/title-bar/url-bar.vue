<template>
  <div class="url-bar-container">
    <input id="url-bar" type="text" class="pane"
      v-on:focus="setFocus(true)"
      v-on:blur="setFocus(false)"
      ref="urlBox"
      :value="value"
      @keydown.enter="onChange">
    </input>
    <div class="url-bar-connect">
      <icon-button
        :src="connectIcon"
        @click="onConnect">
      </icon-button>
    </div>
  </div>
</template>

<script>
export default { name: "url-bar" }
</script>

<script setup>
import { computed, ref, defineProps, defineModel } from 'vue';

const props = defineProps({
  app_state: {type: Object, required: true}
});

const app_params = defineModel("app_params");
const hasFocus = ref();
const urlBox = ref(null);

const appName = computed(() => {
  return props.app_state.pretty_app_name();
});

const value = computed(() => {
  if (hasFocus.value) {
    return app_params.value.host;
  } else {
    let status = props.app_state.status;
    if (status == flecs.ConnectionStatus.Initializing) {
      return "[ connecting ]";
    } else if (status == flecs.ConnectionStatus.RetryConnecting) {
      return "[ reconnecting ]";
    } else if (status == flecs.ConnectionStatus.Disconnected) {
      return "[ disconnected ]";
    }

    const name = appName.value;
    if (name) {
      return name;
    } else {
      return props.app_state.host;
    }
  }
});

const connectIcon = computed(() => {
  if (props.app_state.mode == flecs.ConnectionMode.Wasm) {
    return "remote-explorer";
  } else {
    return "debug-disconnect";
  }
});

const setFocus = (value) => {
  hasFocus.value = value;
}

function onChange() {
  app_params.value.script = undefined;
  app_params.value.scripts = [];
  app_params.value.host = urlBox.value.value;
  urlBox.value.blur();
}

function onConnect() {
  if (props.app_state.mode == flecs.ConnectionMode.Wasm) {
    app_params.value.script = undefined;
    app_params.value.scripts = [];
    app_params.value.host = "localhost";
  } else {
    app_params.value.run_playground();
  }
}

</script>

<style scoped>
div.url-bar-container {
  position: relative;
  grid-column: 3;
}

div.url-bar-connect {
  position: absolute;
  top: 7px;
  right: -4px;
}

#url-bar {
  -webkit-appearance: none; 
  -moz-appearance: none;
  outline: none;

  width: calc(100% - 2px);
  height: calc(100% - 4px);

  border-style: solid;
  border-width: 1px;
  border-radius: var(--border-radius-large);
  padding-left: 1em;
  font-size: inherit;
  text-align: center;
  border-color: var(--border);
  color: var(--secondary-text);
  cursor: pointer;
}

#url-bar:focus {
  color: var(--highlight-text);
  border-color: var(--dark-blue);
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  cursor: text;
}

</style>
