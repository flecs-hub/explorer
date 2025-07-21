<template>
  <div id="editor">
  </div>
</template>

<script>
export default { name: "flecs-script" }
</script>

<script setup>
import { defineProps, defineModel, onMounted, ref, watch } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  script: {type: Object, required: true},
});

const changed = defineModel("changed");
const error = defineModel("error");

// Editor object
let editorObj = undefined;

// Script is loading, don't write when editor content changes
let isLoading = false;

const code = ref("");

function loadScript() {
  isLoading = true;
  editorObj.setValue("");
  props.conn.get(props.script.path, {component: "flecs.script.Script"}, (reply) => {
    code.value = reply.code;
    editorObj.setValue(code.value);
    editorObj.clearSelection();
    editorObj.gotoLine(1, 0);
    editorObj.focus();
    isLoading = false;
    error.value = reply.error;

    // So we get an updated changed value
    scriptUpdate(reply.code);
  });
}

function onScriptChange(editorObj) {
  if (isLoading) {
    return;
  }

  scriptUpdate(editorObj.getValue());
}

function scriptUpdate(code, save = false) {
  props.conn.scriptUpdate(props.script.path, code, {
    try: true,
    check_file: true,
    save_file: save
  }, (msg) => {
    if (msg.error) {
      error.value = msg.error;
    } else {
      error.value = undefined;
    }
    changed.value = msg.changed;
  });
}

onMounted(() => {
  editorObj = ace.edit("editor");
  editorObj.setOption("highlightActiveLine", false);
  editorObj.setOption("tabSize", 2);
  editorObj.setBehavioursEnabled(true);
  editorObj.setTheme("ace/theme/flecs-script");
  editorObj.session.setMode("ace/mode/flecs-script");

  editorObj.session.on('change', function(e) {
    onScriptChange(editorObj);
  });
  
  editorObj.commands.addCommand({
    name: "save",
    bindKey: { win: "Ctrl-S", mac: "Command-S" },
    exec: function(editorObj) {
      scriptUpdate(editorObj.getValue(), true);
    },
    readOnly: false // false if this command should not be available in read-only mode
  });

  loadScript();
});

watch(() => [props.script.value], () => {
  loadScript();
});

</script>

<style scoped>

#editor {
  grid-row: 1;
  height: 100%;
  font-size: 14px;
  color: var(--primary-text);
}

</style>
