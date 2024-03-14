<template>
  <input id="url-bar" type="text" class="ace-github-dark"
    v-on:focus="setFocus(true)"
    v-on:blur="setFocus(false)"
    :value="value">
  </input>
</template>

<script>
export default { name: "url-bar" }
</script>

<script setup>
import { computed, ref, defineProps } from 'vue';

const props = defineProps({
  app_state: {type: Object, required: true},
});

const hasFocus = ref();

const appName = computed(() => {
  const app_state = props.app_state;
  if (app_state.worldInfo) {
    let str = app_state.worldInfo.label;
    str = str.replaceAll("_", " ");
    str = str.charAt(0).toUpperCase() + str.slice(1);
    return str;
  } else {
    return undefined;
  }
});

const value = computed(() => {
  const app_state = props.app_state;
  if (hasFocus.value) {
    return app_state.host;
  } else {
    let status = app_state.status;
    if (status == flecs.ConnectionStatus.Initializing) {
      return "[ initializing ]";
    } else if (status == flecs.ConnectionStatus.RetryConnecting) {
      return "[ reconnecting ]";
    } else if (status == flecs.ConnectionStatus.Disconnected) {
      return "[ disconnected ]";
    }

    const name = appName.value;
    if (name) {
      return name;
    } else {
      return app_state.host;
    }
  }
});

const setFocus = (value) => {
  hasFocus.value = value;
}

</script>

<style scoped>
#url-bar {
  -webkit-appearance: none; 
  -moz-appearance: none;
  outline: none;
  position: relative;
  grid-column: 3;
  border-style: solid;
  border-width: 1px;
  border-radius: var(--border-radius-large);
  padding-left: 1em;
  font-size: inherit;
  text-align: center;
  border-color: var(--border);
  color: var(--secondary-text);
}

#url-bar:focus {
  color: var(--highlight-text);
  border-color: var(--dark-blue);
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

</style>
