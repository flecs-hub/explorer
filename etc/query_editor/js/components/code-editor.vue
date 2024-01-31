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
const prop_query = defineModel("prop_query");

// Editor object
let editor = undefined;

// Editor cursor
let cursor = undefined;

// Simple trick to test if character is letter
function isLetter(c) {
  return c.toLowerCase() != c.toUpperCase();
}

function isNumber(c) {
  return c >= '0' && c <= '9';
}

// Check if character is valid for entity identifier
function isValidForIdentifier(c) {
  return isLetter(c) || isNumber(c) || (c == '.');
}

// Last word (used for auto complete)
function isSep(ch) {
  if ((ch == ' ') || (ch == '\t') || (ch == '\n') || 
      (ch == ',') || (ch == '(') || (ch == ')') || (ch == '?') || (ch == '!'))
  {
    return true;
  } else {
    return false;
  }
}

// Check if current expression is part of a pair, and if so, find first element.
// This is useful information to have, as it both tells us whether the currently
// evaluated word is a pair target, and we can use the first element to check if
// it has the OneOf property, in which case we can constrain the suggestions.
//
// This simple parser doesn't handle all edge cases, but should work with the
// vast majority of query expressions.
function findFirst(line, start) {
  let i = start;

  while (line[i] == ' ') { --i; }

  for (; i >= 0; i --) {
    if (line[i] == '(') {
      // This could mean one of two things:
      //   (Comp
      //   ^
      //
      //   Comp(src
      //       ^
      prop_query.value.first = ""; // not found
      return;
    } else if (line[i] == ',') {
      // This could mean one of three things:
      // , Comp
      // ^
      //
      // (Comp, 
      //      ^
      //
      // Comp(src, 
      //         ^
      // Continue search for '('
      for (let j = i - 1; j >= 0; j --) {
        if (line[j] == '(') {
          // This means we have a pair with a first element. We still need to
          // disambiguate between these two cases:
          //
          // (Comp,
          // ^
          //
          // Comp(src,
          //     ^
          if (j == 0) {
            // Must be case 1
            prop_query.value.first = line.slice(1, i);
            return;
          } else {
            if (isValidForIdentifier(line[j - 1])) {
              // Must be case 2. Find start of word
              let k = j - 1;
              for (; k >= 0; k --) {
                if (!isValidForIdentifier(line[k])) {
                  break;
                }
              }

              prop_query.value.first = line.slice(k + 1, j);
              return;
            } else {
              // Assume case 1
              prop_query.value.first = line.slice(j + 1, i);
              return;
            }
          }
        } else if (isSep(line[j])) {
          prop_query.value.first = ""; // not found
          return;
        }
      }

      prop_query.value.first = ""; // not found
      return;
    } else if (isSep(line[i]) && line[i] != ' ') {
      prop_query.value.first = ""; // not found
      return;
    }
  }
}

watch(value, (newValue) => {
  const lines = newValue.split("\n");
  let row = cursor ? cursor.row : 0;
  let col = cursor ? cursor.column : 0;
  const line = lines[row];

  for (let i = col; i >= 0; i --) {
    if (isSep(line[i])) {
      if (i != col) {
        prop_query.value.expr = line.slice(i + 1, col + 1);
        findFirst(line, i);
        return;
      } else {
        prop_query.value.expr = "";
        findFirst(line, i);
        return;
      }
    }
  }

  prop_query.value.expr = line;
  prop_query.value.first = ""; // first word, so can't be a pair
});

// Create editor
onMounted(() => {
  editor = ace.edit("editor");
  editor.setValue(value.value);
  cursor = editor.selection.getCursor();
  editor.setTheme("ace/theme/github_dark");
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
