<template>
  <div id="editor"></div>
</template>

<script>
export default { name: "code-editor" };
</script>

<script setup>
import { watch, onMounted, defineModel } from 'vue';

// Value of editor widget (two way binding)
const value = defineModel("value");
const lastWord = defineModel("lastword");

// Editor object
let editor = undefined;

// Editor cursor
let cursor = undefined;

// Last word (used for auto complete)
function issep(ch) {
  if ((ch == ' ') || (ch == '\t') || (ch == '\n') || 
      (ch == ',') || (ch == '(') || (ch == ')') || (ch == '?') || (ch == '!'))
  {
    return true;
  } else {
    return false;
  }
}

watch(value, (newValue) => {
  const lines = newValue.split("\n");
  let row = cursor ? cursor.row : 0;
  let col = cursor ? cursor.column : 0;
  const line = lines[row];

  for (let i = col; i >= 0; i --) {
    if (issep(line[i])) {
      if (i != col) {
        lastWord.value = line.slice(i + 1, col + 1);
        return;
      } else {
        lastWord.value = "";
        return;
      }
    }
  }

  lastWord.value = line;
});

// Create editor
onMounted(() => {
  editor = ace.edit("editor");
  editor.setValue(value.value);
  cursor = editor.selection.getCursor();
  editor.setTheme("ace/theme/github_dark");
  // editor.setFontSize(14);
  editor.session.on('change', function(delta) {
    value.value = editor.getValue();
    cursor = editor.selection.getCursor();
  });
});

</script>

<style scoped>
  #editor {
    position: relative;
    grid-column: 1;
    font-size: 14px;
    border-top-left-radius: 0.5em;
    border-bottom-left-radius: 0.5em;
  }
</style>
