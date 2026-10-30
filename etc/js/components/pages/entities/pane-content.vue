<template>
  <edit-tabs :items='items' padding="0px;" v-model:active_item="activeTab" :changed="changed" storageKey="content" @onClose="onItemClose">
    <template v-slot:Scene v-if="showScene">
      <div id="canvasPlaceholder" class="page-content-canvas" v-if="showCanvas"></div>
      <div class="page-content-canvas-error" v-else>
        <p>The 3D scene could not be displayed.</p>
        <p>The scene renders with WebGPU, which is not available in this browser.</p>
      </div>
    </template>
    <template v-slot:Overview>
      <entities-overview
        :conn="conn"
        :app_state="app_state">
      </entities-overview>
    </template>
    <template v-slot:Terminal>
      <terminal-pane
        :conn="conn"
        :app_state="app_state"
        v-model:app_params="app_params">
      </terminal-pane>
    </template>
    <template v-slot:[script.label] v-for="script in scriptItems">
      <div class="script-container">
        <flecs-script
          :conn="conn"
          :script="script.value"
          @onUpdate="onScriptUpdate"
          @onChange="onCodeChange">
        </flecs-script>
      </div>
    </template>
  </edit-tabs>
</template>

<script>
export default { name: "pane-content" };
</script>

<script setup>
import { defineProps, defineExpose, defineModel, defineEmits, computed, ref } from 'vue';

const props = defineProps({
  conn: { type: Object, required: true },
  app_state: { type: Object, required: true }
});

const emit = defineEmits(["onCodeChange"]);
const activeTab = defineModel("tab");
const scripts = defineModel("scripts");
const app_params = defineModel("app_params");
const changed = ref(false);

defineExpose({
  openScript
});

const scriptItems = computed(() => {
  return scripts.value.map((script) => {
    let label = script.replaceAll("\\.", "@@@");
    label = label.replaceAll(".", "/");
    label = label.replaceAll("@@@", ".");
    label = label.split("/").pop();
    return {label: label, value: script, canClose: true, icon: "file-code"};
  });
});

const items = computed(() => {
  let result = [];

  if (showScene.value) {
    result.push({
      label: "Scene",
      value: "Scene",
      canClose: false,
      icon: "device-camera-video"
    });
  }

  result.push({
    label: "Overview",
    value: "Overview",
    canClose: false,
    icon: "dashboard"
  });

  result.push({
    label: "Terminal",
    value: "Terminal",
    canClose: false,
    icon: "terminal"
  });

  for (let script of scriptItems.value) {
    result.push(script);
  }

  return result;
});

function openScript(path) {
  let foundScript = undefined;
  for (let script of scriptItems.value) {
    if (script.value == path) {
      foundScript = script;
      break;
    }
  }

  if (!foundScript) {
    scripts.value.push(path);
    foundScript = scriptItems.value[scriptItems.value.length - 1];
  }

  activeTab.value = foundScript.label;
}

function onItemClose(item) {
  for (let script of scriptItems.value) {
    if (script.label == item.label) {
      scripts.value.splice(scriptItems.value.indexOf(script), 1);
      break;
    }
  }
}

const showCanvas = computed(() => {
  return props.app_state.has3DCanvas;
});

const showScene = computed(() => {
  return showCanvas.value || props.app_state.webgpu_unavailable;
});

function onScriptUpdate(msg) {
  changed.value = msg.changed;
}

function onCodeChange(evt) {
  emit("onCodeChange", evt);
}

</script>

<style scoped>

div.script-container {
  height: 100%;
}

div.page-content-canvas {
  height: 100%;
}

div.page-content-canvas-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
  text-align: center;
  color: var(--secondary-text);
}

</style>
