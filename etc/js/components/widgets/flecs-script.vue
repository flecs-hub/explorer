<template>
  <div :class="editorCss">
    <div :id="`editor-${script}`" class="editor">
    </div>
    <div v-if="error" class="editor-error">
      <pre><span class="editor-error-text">error</span>: {{ error }}</pre>
    </div>
  </div>
</template>

<script>
export default { name: "flecs-script" }
</script>

<script setup>
import { defineProps, defineModel, defineEmits, onMounted, computed, ref, watch } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  script: {type: String, required: true}
});

const emit = defineEmits(["onChange", "onUpdate"]);
const error = defineModel("error");

// Editor object
let editorObj = undefined;

// Script is loading, don't write when editor content changes
let isLoading = false;

const code = ref("");

function loadScript() {
  isLoading = true;
  editorObj.setValue("");
  props.conn.get(props.script, {component: "flecs.script.Script"}, (reply) => {
    code.value = reply.code;
    editorObj.setValue(code.value);
    editorObj.clearSelection();
    editorObj.gotoLine(1, 0);
    editorObj.focus();
    isLoading = false;
    error.value = reply.error;

    // So we get an updated changed value
    // TODO: this was causing scripts to be reparsed when opening an editor.
    // Find better way to get changed state.
    // scriptUpdate(reply.code);
  });
}

function onScriptChange(editorObj) {
  if (isLoading) {
    return;
  }

  scriptUpdate(editorObj.getValue());

  emit("onChange", editorObj.getValue());
}

function scriptUpdate(code, save = false) {
  props.conn.scriptUpdate(props.script, code, {
    try: true,
    check_file: true,
    save_file: save
  }, (msg) => {
    if (msg.error) {
      error.value = msg.error;
    } else {
      error.value = undefined;
    }

    emit("onUpdate", msg);
  });
}

const editorCss = computed(() => {
  if (error.value) {
    return ["flecs-script", "flecs-script-error"];
  } else {
    return ["flecs-script"];
  }
});

onMounted(() => {
  editorObj = ace.edit(`editor-${props.script}`);
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

watch(() => [props.script], () => {
  loadScript();
});

</script>

<style scoped>

div.flecs-script {
  display: grid;
  grid-template-rows: 1fr;
  height: inherit;
}

div.flecs-script-error {
  grid-template-rows: auto 5.6rem 4px;
}

div.editor-error {
  grid-row: 2;
  background-color: var(--bg-pane);
}

span.editor-error-text {
  color: var(--bright-red);
}

div.editor {
  grid-row: 1;
  height: 100%;
  min-height: 250px;
  font-size: 14px;
  color: var(--primary-text);
}

</style>
