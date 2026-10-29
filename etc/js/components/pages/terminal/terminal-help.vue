<template>
  <div class="term-help">
    <template v-if="detail && commands.length === 1">
      <div>
        <span class="term-help-name" @click.stop="use(commands[0])">{{ commands[0].name }}</span>
        <template v-for="p in commands[0].params" :key="p.name">
          <span class="term-dim">{{ " " + paramLabel(p) }}</span>
        </template>
      </div>
      <div class="term-help-brief">{{ commands[0].brief }}</div>
      <table class="term-table term-help-params" v-if="commands[0].params.length">
        <tr v-for="p in commands[0].params" :key="p.name">
          <td class="term-help-param">{{ p.name }}</td>
          <td class="term-dim">{{ shortType(p.type) }}</td>
          <td><span class="term-dim" v-if="p.optional">optional</span></td>
          <td class="term-muted">{{ p.brief }}</td>
        </tr>
      </table>
      <div class="term-help-returns" v-if="shortType(commands[0].return_type)">
        <span class="term-dim">returns </span><span class="term-muted">{{ shortType(commands[0].return_type) }}</span>
      </div>
    </template>
    <template v-else>
      <div v-for="g in groups" :key="g.name" class="term-help-group">
        <div class="term-help-group-name">{{ g.name }}</div>
        <table class="term-table">
          <tr v-for="c in g.commands" :key="c.name">
            <td><span class="term-help-name" @click.stop="use(c)" :title="'Click to use ' + c.name">{{ c.name }}</span></td>
            <td class="term-dim">{{ params(c) }}</td>
            <td class="term-muted">{{ c.brief }}</td>
          </tr>
        </table>
      </div>
      <div class="term-dim term-help-footer">
        Arguments are separated by whitespace. Use "quotes", ```raw text``` or (...) {...} [...] for arguments with spaces.
        Type <span class="term-ok">help &lt;command&gt;</span> for details.
      </div>
    </template>
  </div>
</template>

<script>
export default { name: "terminal-help" };
</script>

<script setup>
import { defineProps, computed, inject } from 'vue';

const props = defineProps({
  commands: { type: Array, required: true },
  detail: { type: Boolean, required: false, default: false }
});

const T = flecsTerminal;
const terminal = inject("terminal");

const GROUP_ORDER = ["World", "Script", "Input"];

const groups = computed(() => {
  const map = new Map();
  for (const c of props.commands) {
    const name = T.commandGroup(c.name);
    if (!map.has(name)) {
      map.set(name, []);
    }
    map.get(name).push(c);
  }
  const result = [];
  for (const [name, commands] of map) {
    commands.sort((a, b) => a.name < b.name ? -1 : 1);
    result.push({ name: name, commands: commands });
  }
  result.sort((a, b) => GROUP_ORDER.indexOf(a.name) - GROUP_ORDER.indexOf(b.name));
  return result;
});

function params(c) {
  return T.usage(c).slice(c.name.length).trim();
}

function paramLabel(p) {
  return p.optional ? `[${p.name}]` : `<${p.name}>`;
}

function shortType(type) {
  return T.shortType(type);
}

function use(c) {
  terminal.setInput(c.name + (c.params && c.params.length ? " " : ""));
}
</script>

<style>
#page-terminal span.term-help-name {
  color: var(--term-prompt);
  cursor: pointer;
}

#page-terminal span.term-help-name:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

#page-terminal div.term-help-group {
  margin-bottom: 1.45em;
}

#page-terminal div.term-help-group-name {
  color: var(--term-scope);
  margin-bottom: 0;
}

#page-terminal div.term-help-group table.term-table {
  margin-left: 2ch;
}

#page-terminal div.term-help-brief {
  color: var(--term-muted);
  margin: 0;
}

#page-terminal td.term-help-param {
  color: var(--primary-text);
  padding-left: 2ch;
}

#page-terminal div.term-help-footer {
  white-space: normal;
}
</style>
