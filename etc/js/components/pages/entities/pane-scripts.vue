<template>
  <div :class="paneScriptsCss()">
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
              <icon-button 
                src="close"
                v-if="activeScript && script.label == activeScript.label"
                @click.stop="onClose(script)">
              </icon-button>
            </div>
          </div>
        </div>

        <div class="script-editor pane">
          <flecs-script 
            :conn="conn"
            :script="activeScript"
            v-model:error="scriptError"
            v-if="activeScript">
          </flecs-script>
        </div>
      </div>

      <div class="script-console pane">
        <template v-if="scriptError">
          <pre><span class="script-error">error</span>: {{ scriptError }}</pre>
        </template>
        <template v-else>
          <pre><span class="script-ok">ok</span>: parsed without errors</pre>
        </template>
      </div>
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

const activeScriptPath = defineModel("active_script");
const activeScript = ref();
const scripts = defineModel("scripts");
const scriptError = ref();

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
    results.push({path: s, label: s.replaceAll("\\.", ".")});
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

function paneScriptsCss() {
  let classes = ["pane-scripts"];
  if (!scriptLabels.value.length) {
    classes.push("pane-scripts-empty");
  }
  return classes;
}

defineExpose({openScript});

</script>

<style scoped>

div.pane-scripts {
  display: grid;
  overflow: auto;
  grid-template-rows: auto 5.5rem;
  gap: var(--gap);
  border-radius: var(--border-radius-medium);
  background-color: var(--bg-content);
}

div.pane-scripts-empty {
  background-color: var(--bg-pane);
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
  background-color: var(--bg-content);
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
  border-top-width: 2px;
  border-bottom-width: 1px;
  border-color: var(--border);
  border-top-color: rgba(0, 0, 0, 0);
  background-color: var(--bg-content);
  transition: background-color var(--animation-duration) ease-in-out;
  color: var(--secondary-text);
}

div.flecs-script-button-active {
  background-color: var(--bg-pane);
  border-bottom-color: rgba(0, 0, 0, 0);
  border-top-color: var(--dark-green);
  border-right-width: 1px;
  border-left-width: 1px;
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
