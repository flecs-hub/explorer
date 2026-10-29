<template>
  <div class="terminal-session" ref="scrollEl" @scroll="onScroll" @mouseup="onMouseUp">
    <div class="terminal-content" ref="contentEl">
      <terminal-entry
        v-for="entry in state.entries"
        :key="entry.id"
        :entry="entry"
        :state="state">
      </terminal-entry>
      <div class="terminal-ended" v-if="state.alive === false">
        <span class="term-error">session ended</span>
        <span class="term-dim"> &mdash; the session no longer exists in the application</span>
      </div>
      <terminal-prompt
        v-else
        ref="promptEl"
        v-model:text="state.draft"
        :scope="state.scope"
        :commands="helper.commands"
        :history="history"
        :complete="complete"
        :busy="!!state.running"
        @submit="onSubmit"
        @interrupt="onInterrupt"
        @clearScreen="onClearScreen">
      </terminal-prompt>
    </div>
  </div>
</template>

<script>
export default { name: "terminal-session" };
</script>

<script setup>
import { defineProps, defineModel, defineEmits, computed, ref, watch, onMounted, onUnmounted, nextTick, provide } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  state: {type: Object, required: true},
  helper: {type: Object, required: true},
  app_state: {type: Object, required: true}
});

const app_params = defineModel("app_params");
const emit = defineEmits(["sessionEnded"]);

const MAX_ENTRIES = 1000;
const MAX_REPLAY = 25;
const POLL_INTERVAL_MS = 1000;

const scrollEl = ref(null);
const contentEl = ref(null);
const promptEl = ref(null);
let stick = true;
let polling = false;
let pollTimer;
let resizeObserver;

const T = flecsTerminal;
const state = props.state;

const history = computed(() => {
  const list = state.mirror.concat(state.pending.filter((c) => c !== "clear"));
  const result = [];
  for (const cmd of list) {
    if (cmd.trim().length && result[result.length - 1] !== cmd) {
      result.push(cmd);
    }
  }
  return result;
});

function addEntry(entry) {
  entry.id = state.nextId ++;
  state.entries.push(entry);
  if (state.entries.length > MAX_ENTRIES) {
    state.entries.splice(0, state.entries.length - MAX_ENTRIES);
  }
  return state.entries[state.entries.length - 1];
}

function applyReply(entry, reply) {
  entry.type = reply.type;
  entry.result = reply.result;
  entry.more = reply.more;
  entry.errors = reply.errors || (reply.error ? [reply.error] : []);
  entry.status = (entry.errors.length && reply.type === undefined) ? "error" : "done";
}

function sessionEnded() {
  if (state.alive !== false) {
    state.alive = false;
    emit("sessionEnded", state);
  }
}

function run(cmd) {
  const text = cmd.replace(/\s+$/, "");
  if (!text.trim().length) {
    addEntry({ cmd: "", scope: state.scope, status: "done", origin: "local", errors: [] });
    return;
  }

  const entry = addEntry({
    cmd: text, scope: state.scope, status: "running", origin: "local",
    errors: [], time: Date.now()
  });
  state.pending.push(text);
  state.running = (state.running || 0) + 1;
  stick = true;

  state.chain = state.chain.then(() => new Promise((resolve) => {
    const finish = (reply) => {
      state.running --;
      onReply(entry, reply || {});
      resolve();
    };
    props.conn.commandRun(state.id, text, {}, finish, finish);
  }));
}

function onReply(entry, reply) {
  applyReply(entry, reply);
  if (reply.error === "invalid command session") {
    const i = state.pending.indexOf(entry.cmd);
    if (i !== -1) {
      state.pending.splice(i, 1);
    }
    sessionEnded();
    return;
  }

  const name = T.commandName(entry.cmd);
  if (name === "cd" && typeof reply.result === "string") {
    state.scope = reply.result;
    state.virtualScope = reply.result;
  } else if (name === "clear" && entry.status === "done") {
    const i = state.entries.indexOf(entry);
    state.entries = i !== -1 ? state.entries.slice(i + 1) : [];
    state.mirror = [];
    const p = state.pending.indexOf("clear");
    if (p !== -1) {
      state.pending.splice(p, 1);
    }
  } else if (name === "help" && !T.args(entry.cmd).length && Array.isArray(reply.result)) {
    props.helper.setCommands(reply.result);
  }
}

function loadResults(entries, offset, fallback) {
  props.conn.commandSessionHistory(state.id, { results: true, offset: offset }, (reply) => {
    const history = Array.isArray(reply.history) ? reply.history : [];
    const results = Array.isArray(reply.results) ? reply.results : [];
    const matched = T.matchResults(entries.map((item) => item.entry.cmd), history, results);
    const missing = [];
    entries.forEach((item, i) => {
      const stored = matched[i];
      if (stored && state.entries.indexOf(item.entry) !== -1) {
        item.entry.scope = stored.scope;
        applyReply(item.entry, stored);
      } else {
        missing.push(item);
      }
    });
    if (fallback && missing.length) {
      fallback(missing);
    }
  }, () => {
    if (fallback) {
      fallback(entries);
    }
  });
}

function replay(entries, scope) {
  let first = true;
  for (const { entry, run } of entries) {
    if (run) {
      entry.status = "running";
    }
    const reply = props.helper.run(entry.cmd, first ? scope : undefined, !run);
    first = false;
    reply.then((r) => {
      entry.scope = r.scope;
      if (run) {
        applyReply(entry, r.reply);
        entry.replayed = true;
      }
    }, () => {
      entry.status = "remote";
    });
  }
}

function applyRemote(value) {
  const remote = Array.isArray(value.history) ? value.history : [];
  const scope = value.scope || "#0";
  state.historySize = value.history_size || state.historySize;
  state.alive = true;

  if (!state.synced) {
    state.mirror = remote.slice();
    if (!state.entries.length && remote.length) {
      const entries = remote.map((cmd) => ({
        entry: addEntry({ cmd: cmd, status: "history", origin: "history", errors: [] })
      }));
      loadResults(entries, 0);
    }
    state.scope = scope;
    state.virtualScope = scope;
    state.synced = true;
    stick = true;
    return;
  }

  const diff = T.historyDiff(state.mirror, remote, state.historySize);
  if (diff.cleared) {
    const ours = state.pending.indexOf("clear") !== -1;
    state.entries = state.entries.filter((e) => e.status === "running" && e.origin === "local");
    if (!ours) {
      addEntry({ origin: "system", text: "session history was cleared by another viewer" });
    }
  }

  const added = [];
  for (const cmd of diff.added) {
    const i = state.pending.indexOf(cmd);
    if (i !== -1 && state.pending.slice(0, i).every((c) => c === "clear")) {
      state.pending.splice(i, 1);
      continue;
    }
    added.push(cmd);
  }
  state.mirror = remote.slice();

  const replayable = [];
  added.forEach((cmd, i) => {
    const entry = addEntry({
      cmd: cmd, scope: state.virtualScope, status: "running", origin: "remote",
      errors: [], time: Date.now()
    });
    const name = T.commandName(cmd);
    const run = (name === "cd" || T.READONLY_COMMANDS.has(name)) && i >= added.length - MAX_REPLAY;
    replayable.push({ entry: entry, run: run });
  });

  if (replayable.length) {
    const virtualScope = state.virtualScope;
    loadResults(replayable, remote.length - diff.added.length, (missing) => {
      for (const item of missing) {
        item.entry.status = "remote";
      }
      replay(missing, virtualScope);
    });
  }

  state.virtualScope = scope;
  state.scope = scope;
}

function poll() {
  if (polling || state.alive === false) {
    return;
  }
  if (props.app_state.status != flecs.ConnectionStatus.Connected) {
    return;
  }
  polling = true;
  props.conn.get(T.sessionIndexPath(state.id),
    { component: "flecs.script.command.CommandSession" },
    (value) => {
      polling = false;
      applyRemote(value || {});
    }, (err) => {
      polling = false;
      let msg = err;
      try {
        msg = JSON.parse(err).error;
      } catch (e) {}
      if (typeof msg === "string" && msg.indexOf("request to") === -1) {
        sessionEnded();
      }
    });
}

function childNames(parent, name, limit) {
  return new Promise((resolve) => {
    let expr = T.isRoot(parent) ? "(ChildOf, #0)" : `(ChildOf, ${parent})`;
    if (name) {
      expr += `, $this ~= "${name.replaceAll('"', '')}"`;
    }
    props.conn.query(expr, { fields: false, limit: limit || 500 }, (reply) => {
      resolve((reply.results || []).map((r) => r.name));
    }, () => resolve([]));
  });
}

function commandCandidates(prefix) {
  const result = [];
  for (const info of props.helper.commands.values()) {
    if (info.name.startsWith(prefix)) {
      result.push({ value: info.name, label: info.name, kind: "command",
        desc: info.brief, suffix: " " });
    }
  }
  result.sort((a, b) => a.value < b.value ? -1 : 1);
  return result;
}

function escapeName(name) {
  return name.replaceAll(".", "\\.");
}

async function entityCandidates(prefix) {
  if (prefix.startsWith("$") || prefix.startsWith("#")) {
    return [];
  }
  const { parent, name } = T.splitPartial(prefix);
  const scope = state.scope;
  const bases = [];
  if (parent) {
    if (!T.isRoot(scope)) {
      bases.push(scope + "." + parent);
    }
    bases.push(parent);
  } else {
    if (!T.isRoot(scope)) {
      bases.push(scope);
    }
    bases.push("#0");
  }

  const lists = await Promise.all(bases.map((b) => childNames(b, name)));
  const all = [];
  const seen = new Set();
  lists.forEach((names, i) => {
    for (const n of names) {
      const value = (parent ? parent + "." : "") + escapeName(n);
      if (!seen.has(value)) {
        seen.add(value);
        all.push({ value: value, label: n, kind: "entity",
          full: (T.isRoot(bases[i]) ? "" : bases[i] + ".") + escapeName(n) });
      }
    }
  });

  let result = all.filter((c) => c.label.startsWith(name));
  if (!result.length) {
    const lower = name.toLowerCase();
    result = all.filter((c) => c.label.toLowerCase().startsWith(lower));
  }
  if (!result.length) {
    result = all;
  }
  result.sort((a, b) => a.label.localeCompare(b.label));

  if (result.length === 1) {
    const children = await childNames(result[0].full, undefined, 1);
    result[0].suffix = children.length ? "." : " ";
  }
  return result;
}

async function complete(text, cursor) {
  const ctx = T.completionContext(text, cursor);
  if (!ctx) {
    return undefined;
  }
  props.helper.loadCommands();

  let candidates = [];
  if (ctx.index === 0) {
    candidates = commandCandidates(ctx.prefix);
  } else if (ctx.command === "help" && ctx.index === 1) {
    candidates = commandCandidates(ctx.prefix);
  } else {
    const info = props.helper.commands.get(ctx.command);
    const param = info && info.params ? info.params[ctx.index - 1] : undefined;
    if (T.isEntityParam(param)) {
      candidates = await entityCandidates(ctx.prefix);
    }
  }
  return { start: ctx.start, end: ctx.end, candidates: candidates };
}

function onSubmit(text) {
  run(text);
}

function onInterrupt(text) {
  addEntry({ cmd: text, scope: state.scope, status: "done", origin: "local",
    errors: [], interrupted: true });
}

function onClearScreen() {
  state.entries = [];
}

function focusPrompt() {
  if (promptEl.value) {
    promptEl.value.focus();
  }
}

function openEntity(path) {
  if (!path || T.isRoot(path)) {
    return;
  }
  app_params.value.entities.path = path;
  app_params.value.page = "entities";
}

function insert(text) {
  if (promptEl.value) {
    promptEl.value.insert(text);
  }
}

function setInput(text) {
  state.draft = text;
  nextTick(focusPrompt);
}

provide("terminal", {
  run: run,
  insert: insert,
  setInput: setInput,
  commands: computed(() => props.helper.commands),
  openEntity: openEntity,
  focus: focusPrompt,
  scope: computed(() => state.scope)
});

function onScroll() {
  const el = scrollEl.value;
  stick = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
}

function scrollToBottom() {
  const el = scrollEl.value;
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
}

function onMouseUp(event) {
  const selection = window.getSelection();
  if (selection && selection.toString().length) {
    return;
  }
  const tag = event.target.tagName;
  if (tag === "A" || tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") {
    return;
  }
  focusPrompt();
}

watch(() => state.runRequest, (req) => {
  if (req) {
    run(req.cmd);
  }
});

watch(() => state.focusRequest, () => nextTick(focusPrompt));

onMounted(() => {
  poll();
  pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  props.helper.loadCommands();
  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(() => {
      if (stick) {
        scrollToBottom();
      }
    });
    resizeObserver.observe(contentEl.value);
  }
  nextTick(() => {
    scrollToBottom();
    focusPrompt();
  });
});

onUnmounted(() => {
  clearInterval(pollTimer);
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style>
#page-terminal div.terminal-session {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  font: var(--term-font);
  color: var(--primary-text);
  cursor: text;
}

#page-terminal div.terminal-content {
  padding: 10px 14px 14px 14px;
}

#page-terminal div.terminal-ended {
  padding-top: 6px;
}
</style>
