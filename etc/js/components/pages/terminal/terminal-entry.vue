<template>
  <div :class="entryCss">
    <div class="term-system" v-if="entry.origin === 'system'">
      <span class="term-dim">&#x2500;&#x2500; {{ entry.text }} &#x2500;&#x2500;</span>
    </div>
    <div class="term-hint" v-else-if="entry.origin === 'hint'">
      <span class="term-dim">type </span><span class="term-hint-cmd" title="Click to run help" @click.stop="terminal.run('help')">help</span><span class="term-dim"> for a list of possible commands</span>
    </div>
    <template v-else>
      <div class="term-line">
        <span class="terminal-ps1 noselect"><span class="terminal-ps1-scope">{{ scopeLabel }}</span><span class="terminal-ps1-sym">$&nbsp;</span></span>
        <span class="term-cmd" :title="cmdTitle" @click.stop="onCmdClick"><span
          v-for="(t, i) in cmdTokens" :key="i"
          :class="t.cls ? 'term-in-' + t.cls : ''">{{ t.text }}</span></span>
        <span class="term-dim" v-if="entry.interrupted">^C</span>
        <span class="term-badges noselect" v-if="showBadges">
          <span class="term-badge term-badge-remote" v-if="entry.origin === 'remote'"
            title="This command was run by another viewer of the session">
            <icon src="broadcast" :size="12" :opacity="0.8"></icon>
            <span>other viewer</span>
          </span>
          <span class="term-badge" v-if="entry.replayed"
            title="Output was evaluated again by this explorer, and may differ from what the other viewer saw">re-evaluated</span>
          <span class="term-badge" v-if="entry.origin === 'remote' && entry.status === 'remote'"
            title="Commands that change the world are not evaluated again">output not shown</span>
          <span class="term-spinner" v-if="entry.status === 'running'"></span>
        </span>
      </div>

      <div class="term-output" v-if="hasOutput">
        <div class="term-error-line" v-for="(err, i) in entry.errors" :key="'e' + i">
          <span class="term-error">error: </span><span class="term-error-msg">{{ errorHead(err) }}</span>
          <pre class="term-error-detail" v-if="errorTail(err)">{{ errorTail(err) }}</pre>
        </div>

        <template v-if="entry.type !== undefined">
          <terminal-entities v-if="widget === 'entities'"
            :entities="entry.result" :scope="entry.scope" :command="command">
          </terminal-entities>

          <terminal-tree v-else-if="widget === 'tree'"
            :nodes="entry.result" :scope="entry.scope">
          </terminal-tree>

          <terminal-query v-else-if="widget === 'query'"
            :rows="entry.result" :scope="entry.scope">
          </terminal-query>

          <terminal-help v-else-if="widget === 'help'"
            :commands="entry.result" :detail="args.length > 0">
          </terminal-help>

          <terminal-inspect v-else-if="widget === 'inspect'"
            :info="entry.result" :scope="entry.scope">
          </terminal-inspect>

          <terminal-doc v-else-if="widget === 'doc'"
            :doc="entry.result" :scope="entry.scope">
          </terminal-doc>

          <terminal-grep v-else-if="widget === 'grep' || widget === 'script-grep'"
            :matches="entry.result" :scope="entry.scope" :needle="args[0]"
            :scriptMatches="widget === 'script-grep'"
            :caseInsensitive="command === 'grep_i'">
          </terminal-grep>

          <terminal-scripts v-else-if="widget === 'scripts'"
            :scripts="entry.result" :scope="entry.scope">
          </terminal-scripts>

          <terminal-code v-else-if="widget === 'lines'"
            :lines="linesResult" :numbers="true">
          </terminal-code>

          <terminal-code v-else-if="widget === 'code'"
            :text="entry.result">
          </terminal-code>

          <div v-else-if="widget === 'location'" class="term-location">
            <div>
              <terminal-entity :path="entry.result.script" :scope="entry.scope"></terminal-entity><span
                class="term-dim">:</span><span class="term-number">{{ entry.result.line }}</span><span
                class="term-dim">:</span><span class="term-number">{{ entry.result.column }}</span>
              <template v-if="hasTemplate">
                <span class="term-dim"> in template </span>
                <terminal-entity :path="entry.result.template" :scope="entry.scope"></terminal-entity>
              </template>
            </div>
            <terminal-code :lines="[{ line: entry.result.line, text: entry.result.statement || '' }]" :numbers="true"></terminal-code>
          </div>

          <div v-else-if="widget === 'script-errors'">
            <div v-if="!entry.result.length" class="term-ok">&#x2714; no script errors</div>
            <div v-for="(e, i) in entry.result" :key="i" class="term-script-error">
              <terminal-entity :path="e.script" :scope="entry.scope"></terminal-entity><span class="term-dim">: </span>
              <span class="term-error">{{ e.error }}</span>
            </div>
          </div>

          <div v-else-if="widget === 'diff'" class="term-diff">
            <div v-if="!diffLines.length" class="term-dim">no changes</div>
            <div v-for="(l, i) in diffLines" :key="i" :class="'term-diff-' + l.cls">{{ l.text || ' ' }}</div>
          </div>

          <template v-else-if="widget === 'entity'">
            <div v-if="command !== 'cd'">
              <span class="term-dim" v-if="isRoot(entry.result)">(none)</span>
              <terminal-entity v-else :path="entry.result" :scope="entry.scope" :full="true"></terminal-entity>
            </div>
          </template>

          <div v-else-if="widget === 'id'">
            <span class="term-ok" v-if="command === 'add'">+ </span>
            <terminal-id :id="entry.result" :scope="entry.scope"></terminal-id>
          </div>

          <div v-else-if="widget === 'bool'">
            <span :class="entry.result ? 'term-ok' : 'term-dim'">{{ boolLabel }}</span>
          </div>

          <div v-else-if="widget === 'event'" class="term-muted">
            <template v-if="entry.result.resolved">
              <span class="term-ok">&#x2714;</span>
              {{ entry.result.resolved }} {{ entry.result.resolved === 1 ? 'listener' : 'listeners' }}
            </template>
            <span class="term-dim" v-else>no listeners</span>
            <span class="term-warning" v-if="entry.result.stopped"> &middot; propagation stopped</span>
          </div>

          <div v-else-if="widget === 'strings'">
            <span class="term-dim" v-if="!entry.result.length">(none)</span>
            <span class="term-chip term-string" v-for="(s, i) in entry.result" :key="i">{{ s }}</span>
          </div>

          <pre v-else-if="widget === 'string'" class="term-pre">{{ entry.result }}</pre>

          <terminal-component v-else-if="valueResult.id"
            :id="valueResult.id" :value="valueResult.value" :scope="entry.scope">
          </terminal-component>

          <div v-else class="term-value-block">
            <terminal-value :value="valueResult.value" :pretty="true"></terminal-value>
          </div>

          <div v-if="entry.more" class="term-dim">&hellip; more results not shown</div>
        </template>
      </div>
    </template>
  </div>
</template>

<script>
export default { name: "terminal-entry" };
</script>

<script setup>
import { defineProps, computed, inject } from 'vue';

const props = defineProps({
  entry: {type: Object, required: true},
  state: {type: Object, required: true}
});

const T = flecsTerminal;
const terminal = inject("terminal");

const command = computed(() => T.commandName(props.entry.cmd));
const args = computed(() => T.args(props.entry.cmd));
const widget = computed(() => T.widgetFor(command.value, props.entry.type));

const entryCss = computed(() => {
  let result = "term-entry";
  if (props.entry.origin === "history") {
    result += " term-entry-history";
  }
  if (props.entry.origin === "remote") {
    result += " term-entry-remote";
  }
  if (props.entry.status === "error") {
    result += " term-entry-error";
  }
  return result;
});

const scopeLabel = computed(() => {
  if (props.entry.scope === undefined) {
    return "";
  }
  return T.isRoot(props.entry.scope) ? "~" : props.entry.scope;
});

const cmdTokens = computed(() => T.highlightCommand(props.entry.cmd || "", terminal.commands.value));

const cmdTitle = computed(() => props.entry.cmd ? "Click to edit in prompt" : "");

const hasOutput = computed(() => {
  const e = props.entry;
  if (e.errors && e.errors.length) {
    return true;
  }
  if (e.type === undefined) {
    return false;
  }
  if (widget.value === "entity" && command.value === "cd") {
    return false;
  }
  if (widget.value === "entities" && command.value === "ls" && !e.result.length) {
    return false;
  }
  return true;
});

const showBadges = computed(() => props.entry.origin === "remote" ||
  props.entry.status === "running");

const linesResult = computed(() => {
  const r = props.entry.result;
  return Array.isArray(r) ? r : (r ? [r] : []);
});

const diffLines = computed(() => T.diffLines(props.entry.result));

const COMPONENT_ARG = { get: 1, set: 1, schema_value: 0 };

const valueResult = computed(() => {
  if (props.entry.type !== "flecs.meta.value") {
    return { id: undefined, value: props.entry.result };
  }
  const unwrapped = T.unwrapValue(props.entry.result);
  const arg = args.value[COMPONENT_ARG[command.value]];
  return { id: arg !== undefined ? T.parseId(arg) : unwrapped.type, value: unwrapped.value };
});

const hasTemplate = computed(() => {
  const t = props.entry.result ? props.entry.result.template : undefined;
  return t && !T.isRoot(t);
});

const boolLabel = computed(() => {
  if (command.value === "script_sync") {
    return props.entry.result ? "script updated" : "no changes";
  }
  return props.entry.result ? "true" : "false";
});

function isRoot(path) {
  return T.isRoot(path);
}

function errorHead(err) {
  const i = err.indexOf("\n");
  return i === -1 ? err : err.slice(0, i);
}

function errorTail(err) {
  const i = err.indexOf("\n");
  return i === -1 ? "" : err.slice(i + 1);
}

function onCmdClick() {
  if (props.entry.cmd && !window.getSelection().toString().length) {
    terminal.setInput(props.entry.cmd);
  }
}
</script>

<style>
#terminal-pane div.term-entry {
  padding: 0;
}

#terminal-pane div.term-line {
  position: relative;
  display: flex;
  align-items: flex-start;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
}

#terminal-pane span.term-cmd {
  cursor: pointer;
  min-width: 0;
}

#terminal-pane div.term-hint {
  margin-bottom: 1.45em;
}

#terminal-pane span.term-hint-cmd {
  color: var(--term-prompt);
  cursor: pointer;
}

#terminal-pane span.term-hint-cmd:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

#terminal-pane div.term-entry-history div.term-line {
  opacity: 0.55;
}


#terminal-pane span.term-badges {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  max-height: 1.45em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-left: 12px;
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  background-color: var(--term-bg);
}

#terminal-pane span.term-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 6px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--term-dim);
}

#terminal-pane span.term-badge-remote {
  color: var(--purple);
  background-color: rgba(188, 137, 189, 0.12);
}

#terminal-pane span.term-spinner {
  width: 9px;
  height: 9px;
  border: 2px solid var(--term-dim);
  border-top-color: var(--yellow);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

#terminal-pane div.term-output {
  padding: 0;
  margin-bottom: 1.45em;
  overflow-x: auto;
}

#terminal-pane div.term-output > *:last-child,
#terminal-pane div.term-output > * > *:last-child {
  margin-bottom: 0;
}

#terminal-pane div.term-error-line {
  white-space: pre-wrap;
}

#terminal-pane span.term-error-msg {
  color: var(--primary-text);
}

#terminal-pane pre.term-error-detail,
#terminal-pane pre.term-pre {
  font: var(--term-font);
  background: transparent;
  padding: 0;
  margin: 0;
  border-radius: 0;
  white-space: pre-wrap;
  overflow-x: visible;
}

#terminal-pane pre.term-error-detail {
  color: var(--term-muted);
  padding-left: 2ch;
}

#terminal-pane div.term-diff div {
  white-space: pre;
}

#terminal-pane div.term-diff-hunk { color: var(--cyan); }
#terminal-pane div.term-diff-file { color: var(--term-muted); font-weight: bold; }
#terminal-pane div.term-diff-add { color: var(--bright-green); background-color: rgba(66, 185, 131, 0.08); }
#terminal-pane div.term-diff-del { color: var(--bright-red); background-color: rgba(239, 135, 132, 0.08); }
#terminal-pane div.term-diff-context { color: var(--term-muted); }

#terminal-pane span.term-chip {
  display: inline-block;
  margin-right: 10px;
}

#terminal-pane .term-warning {
  color: var(--term-warning);
}
</style>
