<template>
  <div class="terminal-color">
    <render/>
  </div>
</template>

<script>
export default { name: "terminal-color-pre" };
</script>

<script setup>
import { h, defineProps } from 'vue';

const props = defineProps({
  text: {type: String, required: true}
});

const render = () => {
  const terminal = props.text;
  if (!terminal) {
    return h('pre');
  }

  let elems = [ ];
  const lines = terminal.split("\n");
  let color;
  for (const line of lines) {
    const tokens = line.split("[[0;");
    for (const token of tokens) {
      if (!isNaN(token[0] && !isNaN(token[1])) && token[2] === 'm') {
        color = token.slice(0, 2);
        const text = token.slice(3, token.length);
        elems.push(h('span', 
          {class: 'terminal-color-' + color},
          [text]
        ));
      } else {
        if (!color) {
          elems.push(h('span', [token]));
        } else {
          elems.push(h('span', 
          {class: 'terminal-color-' + color},
          [token]
        ));
        }
      }
    }
    elems.push(h('br'));
  }

  elems.pop();

  return h('pre', elems);
};
</script>
  
<style>

div.terminal-color pre {
  padding-left: 1rem;
  margin: 0px;
}

span.terminal-color-49 {
  color: var(--primary-text);
}

span.terminal-color-37 {
  color: var(--secondary-text);
}

span.terminal-color-32 {
  color: var(--primary-color);
}

span.terminal-color-34 {
  color: var(--secondary-color);
}

span.terminal-color-33 {
  color: var(--tertiary-color);
}
</style>
