<template>
  <div class="flecs-script">
    <div :id="`editor-${script}`" class="editor">
    </div>
    <pre class="editor-error"><span v-if="error"><span class="editor-error-text">error</span>: {{ errorMessage }}</span></pre>
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

// Pending scriptUpdate request, kept so a new keystroke can supersede it
let pendingRequest = undefined;

// Pending script load request, kept so a script switch can supersede it
let pendingLoad = undefined;

// Marker id of highlighted error line
let errorMarker = undefined;

// Marker id of squiggle under token that caused the error
let squiggleMarker = undefined;

const code = ref("");

function setErrorLine() {
  if (!editorObj) {
    return;
  }

  if (errorMarker !== undefined) {
    editorObj.session.removeMarker(errorMarker);
    errorMarker = undefined;
  }

  if (squiggleMarker !== undefined) {
    editorObj.session.removeMarker(squiggleMarker);
    squiggleMarker = undefined;
  }

  const match = error.value ? error.value.match(/^(\d+): /) : undefined;
  if (!match) {
    return;
  }

  const row = parseInt(match[1]) - 1;

  const Range = ace.require("ace/range").Range;
  errorMarker = editorObj.session.addMarker(
    new Range(row, 0, row, Infinity), "editor-error-line", "fullLine");

  const lines = error.value.split("\n");
  const codeLine = lines[1];
  const caretCol = lines.length >= 3 ? lines[2].indexOf("^") : -1;
  if (caretCol === -1 || codeLine === undefined) {
    return;
  }

  let col = caretCol;
  while (col < codeLine.length && /\s/.test(codeLine[col])) {
    col ++;
  }
  if (col === codeLine.length) {
    col = caretCol;
  }

  let start = col;
  while (start > 0 && /[A-Za-z0-9_.$]/.test(codeLine[start - 1])) {
    start --;
  }

  let end = col;
  while (end < codeLine.length && /[A-Za-z0-9_.$]/.test(codeLine[end])) {
    end ++;
  }
  if (end === start) {
    end = col + 1;
  }

  squiggleMarker = editorObj.session.addMarker(
    new Range(row, start, row, end), "editor-error-squiggle", "text");
}

function loadScript() {
  if (pendingRequest) {
    pendingRequest.abort();
    pendingRequest = undefined;
  }

  if (pendingLoad) {
    pendingLoad.abort();
    pendingLoad = undefined;
  }

  isLoading = true;
  editorObj.setValue("");
  pendingLoad = props.conn.get(props.script, {component: "flecs.script.Script"}, (reply) => {
    pendingLoad = undefined;
    code.value = reply.code;
    editorObj.setValue(code.value);
    editorObj.clearSelection();
    editorObj.gotoLine(1, 0);
    editorObj.focus();
    isLoading = false;
    error.value = reply.error;
    setErrorLine();

    emit("onUpdate", reply);
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
  if (pendingRequest) {
    pendingRequest.abort();
    pendingRequest = undefined;
  }

  pendingRequest = props.conn.scriptUpdate(props.script, code, {
    try: true,
    save_file: save,
    latency_budget_ms: save ? undefined : explorer.EDITOR_LATENCY_BUDGET_MS
  }, (msg) => {
    pendingRequest = undefined;

    if (msg.error) {
      error.value = msg.error;
    } else {
      error.value = undefined;
    }

    emit("onUpdate", msg);
  });
}

const errorMessage = computed(() => {
  if (!error.value) {
    return "";
  }
  return error.value.split("\n")[0];
});

onMounted(() => {
  editorObj = ace.edit(`editor-${props.script}`);
  editorObj.setOption("highlightActiveLine", false);
  editorObj.setOption("tabSize", 2);
  editorObj.setOption("cursorStyle", "slim");
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

watch(error, () => {
  setErrorLine();
});

</script>

<style scoped>

div.flecs-script {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  height: 100%;
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

pre.editor-error {
  grid-row: 2;
  box-sizing: border-box;
  background-color: var(--bg-content);
  margin: 0px;
  width: 100%;
  padding: 12px;
  padding-left: 18px;
  min-height: calc(1.5em + 24px);
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 0px;
  border-style: solid;
  border-width: 0px;
  border-top-width: 1px;
  border-color: var(--border);
}

:deep(.editor-error-line) {
  position: absolute;
  background-color: rgba(249, 38, 114, 0.15);
}

:deep(.editor-error-squiggle) {
  position: absolute;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3'%3E%3Cpath d='M 0 3 L 1.5 1 L 3 3 L 4.5 1 L 6 3' fill='none' stroke='%23f92672' stroke-width='1'/%3E%3C/svg%3E") repeat-x left bottom;
}

</style>
