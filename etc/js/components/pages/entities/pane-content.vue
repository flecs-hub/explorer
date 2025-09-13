<template>
  <edit-tabs :items='items' padding="0px;" v-model:active_item="activeTab" :changed="changed" @onClose="onItemClose">
    <template v-slot:Scene v-if="showCanvas">
      <div id="canvasPlaceholder" class="page-content-canvas"></div>
    </template>
    <template v-slot:Overview>
      <entities-overview
        :conn="conn"
        :app_state="app_state">
      </entities-overview>
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
const activeTab = defineModel("active_tab");
const scripts = defineModel("scripts");
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
    return {label: label, value: script, canClose: true};
  });
});

const items = computed(() => {
  let result = [];

  if (showCanvas.value) {
    result.push({
      label: "Scene",
      value: "Scene",
      canClose: false
    });
  }

  result.push({
    label: "Overview",
    value: "Overview",
    canClose: false
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

</style>
