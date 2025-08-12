<template>
  <div :class="paneScriptsCss()">
    {{ Script }}
    <template v-if="scriptLabels.length">
      <div class="script-editor-container pane">
        <div class="script-editor-tabs">
          <div class="script-editor-tabs-line"></div>
          <div 
              :class="scriptButtonCss(script)" 
              @click="selectScript(script)"
              v-for="script in scriptLabels">
            {{ script.label }}
            <div class="script-close-button">
              <pane-scripts-close-button
                :changed="scriptChanged"
                v-if="activeScript && script.label == activeScript.label"
                @onClose="onClose(script)">
              </pane-scripts-close-button>
            </div>
          </div>
        </div>

        <div class="script-editor">
          <flecs-script 
            :conn="conn"
            :script="activeScript"
            v-model:error="scriptError"
            v-model:changed="scriptChanged"
            v-if="activeScript">
          </flecs-script>
        </div>
      </div>

      <template v-if="scriptError">
        <div class="script-console pane">
          <pre><span class="script-error">error</span>: {{ scriptError }}</pre>
        </div>
      </template>
    </template>
  </div>
</template>

<script>
export default { name: "pane-scripts" }
</script>

<script setup>
import { defineProps, defineModel, computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true}
});

const activeScriptPath = defineModel("script");
const scripts = defineModel("scripts");
const activeScript = ref();
const scriptError = ref();
const scriptChanged = ref();

watch(() => [activeScript.value], () => {
  if (activeScript.value) {
    activeScriptPath.value = activeScript.value.path;
  } else {
    activeScriptPath.value = undefined;
  }
});

const scriptLabels = computed(() => {
  let results = [];
  for (let s of scripts.value) {
    let label = s.replaceAll("\\.", "@@@");
    label = label.replaceAll(".", "/");
    label = label.replaceAll("@@@", ".");
    results.push({path: s, label: label});
  }
  return results;
});

onMounted(() => {
  if (scriptLabels.value.length) {
    if (!activeScriptPath.value) {
      activeScript.value = scriptLabels.value[0];
    } else {
      for (let s of scriptLabels.value) {
        if (s.path == activeScriptPath.value) {
          activeScript.value = s;
          break;
        }
      }      
    }
  }
});

function scriptButtonCss(script) {
  let classes = ["noselect", "flecs-script-button"];
  if (activeScript.value) {
    if (script.label == activeScript.value.label) {
      classes.push("flecs-script-button-active");
    }
  }

  return classes;
}

function selectScript(script) {
  activeScript.value = script;
}

function onClose(script) {
  let index = scriptLabels.value.indexOf(script);
  if (index !== -1) {
    scripts.value.splice(index, 1);

    if (index < scripts.value.length) {
      activeScript.value = scriptLabels.value[index];
    } else if (scripts.value.length) {
      activeScript.value = 
        scriptLabels.value[scriptLabels.value.length - 1];
    } else {
      activeScript.value = undefined;
    }
  }
}

function openScript(path) {
  let index = scripts.value.indexOf(path);
  if (index == -1) {
    scripts.value.push(path);
    index = scripts.value.length - 1;
  }
  
  activeScript.value = scriptLabels.value[index];
}

function closeScripts() {
  activeScript.value = undefined;
  activeScriptPath.value = undefined;
  scripts.value.length = 0;
}

function paneScriptsCss() {
  let classes = ["pane-scripts"];
  if (scriptError.value) {
    classes.push("pane-scripts-error");
  }
  if (!scriptLabels.value.length) {
    classes.push("pane");
    classes.push("pane-scripts-empty");
  }
  return classes;
}

defineExpose({openScript, closeScripts});

</script>

<style scoped>

div.pane-scripts {
  display: grid;
  overflow: auto;
  grid-template-rows: auto;
  gap: var(--gap);
  background-color: var(--bg-content);
  height: 100%;
}

div.pane-scripts-error {
  grid-template-rows: auto 5.6rem;
}

div.pane-scripts-empty {
  background-color: var(--bg-pane);
  height: calc(100% - 2px);
}

div.script-editor-container {
  grid-row: 1;
  display: grid;
  grid-template-rows: 42.5px 1fr;
  border-radius: var(--border-radius-medium);
  overflow: auto;
}

div.script-editor {
  padding: 4px;
  grid-row: 2;
}

div.script-console {
  grid-row: 2;
}

div.script-console pre {
  margin: 0px;
  height: calc(100% - 32px); /* subtract padding */
  background-color: var(--bg-pane);
}

span.script-error {
  color: var(--bright-red);
}

span.script-ok {
  color: var(--green);
}

div.script-editor-tabs {
  position: relative;
  border-radius: var(--border-radius-medium);
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  overflow: auto;
  background-color: var(--bg-color);
  grid-row: 1;
}

div.script-editor-tabs-line {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: calc(100% - 1px);
  border-style: solid;
  border-width: 0px;
  border-top-width: 0px;
  border-bottom-width: 1px;
  border-color: var(--border);
}

div.flecs-script-button {
  display: inline-block;
  position: relative;
  grid-column: 1;
  padding: 10px;
  padding-left: 16px;
  padding-right: 28px;
  cursor: pointer;
  border-style: solid;
  border-width: 0px;
  border-left-width: 1px;
  border-right-width: 0px;
  border-top-width: 2px;
  border-bottom-width: 1px;
  border-color: var(--border);
  border-top-color: rgba(0, 0, 0, 0);
  transition: background-color var(--animation-duration) ease-in-out;
  color: var(--secondary-text);
}

div.flecs-script-button:nth-child(2) {
  border-left-width: 0px;
}

div.flecs-script-button-active:last-child {
  border-right-width: 1px;
}

div.flecs-script-button-active {
  background-color: var(--bg-pane);
  border-bottom-color: rgba(0, 0, 0, 0);
  border-top-color: var(--dark-green);
  color: var(--primary-text);
}

div.flecs-script-button:hover {
  background-color: var(--bg-pane);
}

div.script-close-button {
  position: absolute;
  top: 10px;
  right: 8px;
}

</style>
