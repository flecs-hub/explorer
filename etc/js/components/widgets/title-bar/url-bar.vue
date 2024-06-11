<template>
  <input id="url-bar" type="text" class="pane"
    v-on:focus="setFocus(true)"
    v-on:blur="setFocus(false)"
    ref="urlBox"
    :value="value"
    @keydown.enter="onChange">
  </input>
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
  let str = props.app_state.app_name;
  if (str) {
    str = str.replaceAll("_", " ");
    str = str.charAt(0).toUpperCase() + str.slice(1);
    return str;
  } else {
    return "Explorer";
  }
});

const value = computed(() => {
  if (hasFocus.value) {
    return app_params.value.host;
  } else {
    let status = props.app_state.status;
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
      return props.app_state.host;
    }
  }
});

const setFocus = (value) => {
  hasFocus.value = value;
}

function onChange() {
  app_params.value.host = urlBox.value.value;
  urlBox.value.blur();
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
  cursor: pointer;
}

#url-bar:focus {
  color: var(--highlight-text);
  border-color: var(--dark-blue);
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  cursor: text;
}

</style>
