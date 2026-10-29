<template>
  <div id="terminal-pane" ref="rootEl">
    <div class="terminal-frame">
      <div class="terminal-main">
        <terminal-session
          v-if="activeState"
          :key="activeState.key"
          :conn="conn"
          :state="activeState"
          :helper="helper"
          :app_state="app_state"
          v-model:app_params="app_params"
          @sessionEnded="onSessionEnded">
        </terminal-session>

        <div class="terminal-empty" v-else-if="available === false">
          <div class="terminal-empty-title">Terminal is not available</div>
          <div class="terminal-empty-text">
            The connected application does not have the script shell addon.
            Build Flecs with <code>FLECS_SCRIPT_SHELL</code> and enable the REST API to use the terminal.
          </div>
        </div>

        <div class="terminal-empty" v-else-if="available === undefined">
          <div class="terminal-empty-text">Connecting&hellip;</div>
        </div>

        <div class="terminal-empty" v-else>
          <div class="terminal-empty-text">No session selected</div>
          <div class="terminal-empty-new" @click="newSession">
            <icon src="add" :opacity="0.8"></icon>
            <span>New session</span>
          </div>
        </div>
      </div>

      <div class="terminal-panel" v-if="available">
        <div class="terminal-panel-header">
          <span>Sessions</span>
          <span class="terminal-panel-button" title="New session" @click="newSession">
            <icon src="add" :size="16" :opacity="0.7"></icon>
          </span>
        </div>

        <div class="terminal-panel-list">
          <div v-for="s in sessions" :key="s.id"
            :class="itemCss(s)"
            :title="itemTooltip(s)"
            @click="activate(s.id)"
            @dblclick="startRename(s)">
            <span :class="dotCss(s)"></span>
            <div class="terminal-session-text">
              <input v-if="renaming === s.id"
                ref="renameInput"
                class="terminal-session-input"
                type="text"
                :value="s.label || ''"
                :placeholder="defaultLabel(s)"
                @click.stop
                @dblclick.stop
                @keydown.enter="confirmRename(s, $event)"
                @keydown.esc="renaming = undefined"
                @blur="renaming = undefined">
              </input>
              <template v-else>
                <span class="terminal-session-label">{{ s.label || defaultLabel(s) }}</span>
                <span class="terminal-session-scope">{{ scopeOf(s) }}</span>
              </template>
            </div>
            <span class="terminal-session-delete" title="End session"
              @click.stop="deleteSession(s.id)">
              <icon src="trash" :size="14" :opacity="0.6"></icon>
            </span>
          </div>
          <div class="terminal-panel-none" v-if="!sessions.length">No sessions</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue';

const sessionStates = reactive(new Map());
const helpers = new Map();

function restUrl(conn, path) {
  let url = conn.params.host;
  if (url.slice(0, 4) !== "http") {
    url = "http://" + url;
  }
  let portIndex = url.indexOf(":");
  portIndex = url.indexOf(":", portIndex + 1);
  if (portIndex == -1) {
    url += ":27750";
  }
  return url + "/" + path;
}

function createHelper(conn) {
  const helper = reactive({
    conn: conn,
    id: undefined,
    scope: undefined,
    commands: new Map(),
    commandsLoaded: false,
    chain: Promise.resolve(),
    creating: undefined
  });

  function create() {
    if (helper.id) {
      return Promise.resolve(helper.id);
    }
    if (!helper.creating) {
      helper.creating = new Promise((resolve, reject) => {
        helper.conn.commandSessionCreate((reply) => {
          helper.id = String(reply.session);
          helper.scope = "#0";
          helper.creating = undefined;
          helper.conn.set(flecsTerminal.sessionIndexPath(helper.id),
            "(flecs.doc.Description,flecs.core.Name)",
            { value: flecsTerminal.HELPER_LABEL });
          resolve(helper.id);
        }, (err) => {
          helper.creating = undefined;
          reject(err);
        });
      });
    }
    return helper.creating;
  }

  function raw(cmd) {
    return new Promise((resolve) => {
      helper.conn.commandRun(helper.id, cmd, {}, resolve, (err) => {
        if (err && err.error === "invalid command session") {
          helper.id = undefined;
        }
        resolve(err || { errors: ["request failed"] });
      });
    });
  }

  helper.run = function(cmd, scope, dry) {
    const next = helper.chain.then(() => create()).then(() => {
      if (scope === undefined || scope === helper.scope) {
        return;
      }
      return raw("cd").then(() => {
        if (!flecsTerminal.isRoot(scope)) {
          return raw("cd " + scope);
        }
      }).then(() => {
        helper.scope = scope;
      });
    }).then(() => {
      const at = helper.scope;
      if (dry) {
        return { reply: undefined, scope: at };
      }
      return raw(cmd).then((reply) => {
        if (flecsTerminal.commandName(cmd) === "cd" && reply.result !== undefined) {
          helper.scope = reply.result;
        }
        return { reply: reply, scope: at };
      });
    });
    helper.chain = next.catch(() => {});
    return next;
  };

  helper.setCommands = function(list) {
    const map = new Map();
    for (const info of list || []) {
      map.set(info.name, info);
    }
    helper.commands = map;
    helper.commandsLoaded = true;
  };

  helper.loadCommands = function() {
    if (helper.commandsLoaded || helper.loadingCommands) {
      return;
    }
    helper.loadingCommands = true;
    helper.run("help").then((r) => {
      helper.loadingCommands = false;
      if (Array.isArray(r.reply.result)) {
        helper.setCommands(r.reply.result);
      }
    }, () => {
      helper.loadingCommands = false;
    });
  };

  helper.dispose = function() {
    if (!helper.id) {
      return;
    }
    const id = helper.id;
    helper.id = undefined;
    if (helper.conn.mode == flecs.ConnectionMode.Remote && typeof fetch === "function") {
      try {
        fetch(restUrl(helper.conn, "command/session/" + id),
          { method: "DELETE", keepalive: true }).catch(() => {});
      } catch (e) {}
    } else {
      helper.conn.commandSessionDelete(id);
    }
  };

  return helper;
}

function helperFor(conn) {
  const host = conn.params.host;
  let helper = helpers.get(host);
  if (!helper) {
    helper = createHelper(conn);
    helpers.set(host, helper);
  }
  helper.conn = conn;
  return helper;
}

if (typeof window === "object") {
  window.addEventListener("pagehide", () => {
    for (const helper of helpers.values()) {
      helper.dispose();
    }
  });
}

function stateFor(host, id) {
  const key = host + "|" + id;
  let state = sessionStates.get(key);
  if (!state) {
    state = reactive({
      key: key,
      host: host,
      id: String(id),
      label: undefined,
      alive: undefined,
      synced: false,
      scope: "#0",
      virtualScope: "#0",
      historySize: 256,
      entries: [],
      mirror: [],
      local: [],
      localCount: 0,
      draft: "",
      nextId: 1,
      chain: Promise.resolve()
    });
    sessionStates.set(key, state);
  }
  return state;
}

export default { name: "terminal-pane" };
</script>

<script setup>
import { defineProps, defineModel, computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true}
});

const app_params = defineModel("app_params");

const rootEl = ref(null);
const available = ref(undefined);
const sessions = ref([]);
const renaming = ref(undefined);
const renameInput = ref(null);
let listTimer;
let visibilityObserver;
const visible = ref(false);

const host = computed(() => props.conn.params.host);
const helper = helperFor(props.conn);

if (!app_params.value.terminal) {
  app_params.value.terminal = { session: undefined };
}

const activeId = computed(() => {
  const id = app_params.value.terminal.session;
  return id === undefined || id === "" ? undefined : String(id);
});

const activeState = computed(() => activeId.value === undefined ?
  undefined : stateFor(host.value, activeId.value));

function indexOf(id) {
  return Number(id) % 4294967296;
}

function defaultLabel(s) {
  return "session " + indexOf(s.id);
}

function stateOf(s) {
  return sessionStates.get(host.value + "|" + s.id);
}

function scopeOf(s) {
  const state = stateOf(s);
  if (!state || !state.synced) {
    return "#" + indexOf(s.id);
  }
  return flecsTerminal.isRoot(state.scope) ? "~" : state.scope;
}

function itemTooltip(s) {
  return `${s.label || defaultLabel(s)} (#${indexOf(s.id)})\nDouble click to rename`;
}

function itemCss(s) {
  return s.id === activeId.value ? "terminal-session-item terminal-session-active" :
    "terminal-session-item";
}

function dotCss(s) {
  const state = stateOf(s);
  if (state && state.alive === false) {
    return "terminal-session-dot terminal-session-dot-ended";
  }
  if (state && state.running) {
    return "terminal-session-dot terminal-session-dot-running";
  }
  return "terminal-session-dot";
}

function activate(id) {
  app_params.value.terminal.session = id === undefined ? undefined : String(id);
}

function newSession() {
  props.conn.commandSessionCreate((reply) => {
    if (reply.session === undefined) {
      return;
    }
    const id = String(reply.session);
    if (!sessions.value.find((s) => s.id === id)) {
      sessions.value.push({ id: id, index: indexOf(id), label: undefined });
    }
    activate(id);
    refreshSessions();
  }, () => {});
}

function startRename(s) {
  renaming.value = s.id;
  nextTick(() => {
    const el = Array.isArray(renameInput.value) ? renameInput.value[0] : renameInput.value;
    if (el) {
      el.focus();
      el.select();
    }
  });
}

function confirmRename(s, event) {
  const value = event.target.value.trim();
  renaming.value = undefined;
  s.label = value || undefined;
  props.conn.set(flecsTerminal.sessionIndexPath(s.id),
    "(flecs.doc.Description,flecs.core.Name)",
    { value: value || ("#" + indexOf(s.id)) });
  setTimeout(refreshSessions, 200);
}

function deleteSession(id) {
  props.conn.commandSessionDelete(id, () => {
    const index = sessions.value.findIndex((s) => s.id === id);
    sessions.value = sessions.value.filter((s) => s.id !== id);
    sessionStates.delete(host.value + "|" + id);
    if (activeId.value === id) {
      const next = sessions.value[Math.min(index, sessions.value.length - 1)];
      activate(next ? next.id : undefined);
    }
    refreshSessions();
  }, () => refreshSessions());
}

function onSessionEnded() {
  refreshSessions();
}

function refreshSessions(done) {
  props.conn.query("flecs.script.command.CommandSession",
    { doc: true, fields: false, entity_ids: true, limit: 1000 },
    (reply) => {
      const result = [];
      for (const r of reply.results || []) {
        if (r.id === undefined) {
          continue;
        }
        const label = r.doc ? r.doc.label : undefined;
        const id = String((r.version || 0) * 4294967296 + r.id);
        if (label === flecsTerminal.HELPER_LABEL || id === helper.id) {
          continue;
        }
        const custom = label && label !== r.name ? label : undefined;
        result.push({ id: id, index: r.id, label: custom });
        const state = sessionStates.get(host.value + "|" + id);
        if (state) {
          state.label = custom;
        }
      }
      result.sort((a, b) => a.index - b.index);
      sessions.value = result;
      if (done) done(result);
    }, () => {
      if (done) done(undefined);
    });
}

function init() {
  props.conn.commandSessionHistory(0, {}, () => {
    available.value = true;
  }, (err) => {
    available.value = !!err && err.error === "invalid command session";
    if (!available.value) {
      return;
    }
    refreshSessions((list) => {
      helper.loadCommands();
      if (!list) {
        return;
      }
      if (activeId.value !== undefined && list.find((s) => s.id === activeId.value)) {
        return;
      }
      if (list.length) {
        activate(list[list.length - 1].id);
      } else {
        activate(undefined);
        newSession();
      }
    });
  });
}

let initialized = false;
function tryInit() {
  if (!initialized && visible.value && props.app_state.status == flecs.ConnectionStatus.Connected) {
    initialized = true;
    init();
  }
}

watch(() => [props.app_state.status, visible.value], tryInit);

onMounted(() => {
  visibilityObserver = new IntersectionObserver((entries) => {
    visible.value = entries.some((e) => e.isIntersecting);
  });
  visibilityObserver.observe(rootEl.value);
  listTimer = setInterval(() => {
    if (visible.value && available.value && props.app_state.status == flecs.ConnectionStatus.Connected) {
      refreshSessions();
    }
  }, 5000);
});

onUnmounted(() => {
  visibilityObserver.disconnect();
  clearInterval(listTimer);
});
</script>

<style>
#terminal-pane {
  display: grid;
  grid-template-rows: 100%;
  height: 100%;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
  --term-bg: var(--bg-color-alt);
  --term-prompt: var(--green);
  --term-scope: var(--bright-blue);
  --term-error: var(--bright-red);
  --term-warning: var(--orange);
  --term-dim: var(--tertiary-text);
  --term-muted: var(--secondary-text);
  --term-number: #b5cea8;
  --term-string: #ce9178;
  --term-keyword: var(--purple);
  --term-component: var(--component-color);
  --term-tag: var(--target-color);
  --term-entity: var(--primary-text);
  --term-match: rgba(255, 225, 0, 0.25);
  --term-font: 13px/1.45 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Source Code Pro', 'source-code-pro', monospace;
}

#terminal-pane div.terminal-frame {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

#terminal-pane div.terminal-main {
  position: relative;
  flex-grow: 1;
  min-width: 0;
  background-color: var(--term-bg);
}

#terminal-pane div.terminal-panel {
  display: flex;
  flex-direction: column;
  width: 15rem;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  background-color: var(--bg-content-alt);
  font-size: 0.85rem;
}

#terminal-pane div.terminal-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 2rem;
  padding: 0 6px 0 12px;
  border-bottom: 1px solid var(--border);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--tertiary-text);
}

#terminal-pane span.terminal-panel-button {
  display: flex;
  padding: 3px;
  border-radius: var(--border-radius-small);
  cursor: pointer;
}

#terminal-pane span.terminal-panel-button:hover {
  background-color: var(--hover-bg);
}

#terminal-pane div.terminal-panel-list {
  flex-grow: 1;
  overflow-y: auto;
}

#terminal-pane div.terminal-session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 12px;
  border-left: 2px solid transparent;
  color: var(--secondary-text);
  cursor: pointer;
  user-select: none;
}

#terminal-pane div.terminal-session-item:hover {
  background-color: var(--hover-bg);
}

#terminal-pane div.terminal-session-active {
  border-left-color: var(--green);
  background-color: var(--term-bg);
  color: var(--primary-text);
}

#terminal-pane div.terminal-session-active:hover {
  background-color: var(--term-bg);
}

#terminal-pane span.terminal-session-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: var(--green);
}

#terminal-pane span.terminal-session-dot-running {
  background-color: var(--yellow);
  animation: terminal-pulse 0.8s ease-in-out infinite;
}

#terminal-pane span.terminal-session-dot-ended {
  background-color: var(--steel-500);
}

@keyframes terminal-pulse {
  0%, 100% { opacity: 1.0; }
  50% { opacity: 0.3; }
}

#terminal-pane div.terminal-session-text {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
}

#terminal-pane span.terminal-session-label,
#terminal-pane span.terminal-session-scope {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

#terminal-pane span.terminal-session-scope {
  font: var(--term-font);
  font-size: 0.7rem;
  color: var(--tertiary-text);
}

#terminal-pane input.terminal-session-input {
  width: 100%;
  box-sizing: border-box;
  background-color: var(--bg-input);
  color: var(--primary-text);
  border: 1px solid var(--selected-border);
  border-radius: var(--border-radius-small);
  padding: 2px 6px;
  font-size: 0.85rem;
  outline: none;
}

#terminal-pane span.terminal-session-delete {
  display: flex;
  padding: 3px;
  border-radius: var(--border-radius-small);
  opacity: 0;
}

#terminal-pane div.terminal-session-item:hover span.terminal-session-delete {
  opacity: 1;
}

#terminal-pane span.terminal-session-delete:hover {
  background-color: rgba(181, 73, 75, 0.3);
}

#terminal-pane div.terminal-panel-none {
  padding: 10px 12px;
  color: var(--tertiary-text);
}

#terminal-pane div.terminal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  color: var(--secondary-text);
}

#terminal-pane div.terminal-empty-title {
  font-size: 1.1rem;
  color: var(--primary-text);
}

#terminal-pane div.terminal-empty-text {
  max-width: 32rem;
  text-align: center;
  line-height: 1.5;
}

#terminal-pane div.terminal-empty-new {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-medium);
  background-color: var(--bg-pane);
  color: var(--green);
  cursor: pointer;
}

#terminal-pane div.terminal-empty-new:hover {
  border-color: var(--selected-border);
}

#terminal-pane .term-dim { color: var(--term-dim); }
#terminal-pane .term-muted { color: var(--term-muted); }
#terminal-pane .term-error { color: var(--term-error); }
#terminal-pane .term-ok { color: var(--green); }
#terminal-pane .term-number { color: var(--term-number); }
#terminal-pane .term-string { color: var(--term-string); }
#terminal-pane .term-keyword { color: var(--term-keyword); }
#terminal-pane .term-key { color: var(--term-muted); }
#terminal-pane .term-component { color: var(--term-component); }
#terminal-pane .term-tag { color: var(--term-tag); }
#terminal-pane .term-punct { color: var(--term-dim); }
#terminal-pane .term-null { color: var(--term-dim); font-style: italic; }
#terminal-pane .term-match { background-color: var(--term-match); color: var(--yellow); border-radius: 2px; }

#terminal-pane .term-hl-comment { color: var(--term-dim); font-style: italic; }
#terminal-pane .term-hl-string { color: var(--term-string); }
#terminal-pane .term-hl-number { color: var(--term-number); }
#terminal-pane .term-hl-variable { color: var(--yellow); }
#terminal-pane .term-hl-keyword { color: var(--term-keyword); }
#terminal-pane .term-hl-type { color: var(--term-component); }
#terminal-pane .term-hl-ident { color: var(--primary-text); }
#terminal-pane .term-hl-punct { color: var(--term-muted); }

#terminal-pane table.term-table {
  border-collapse: collapse;
  margin: 0;
}

#terminal-pane table.term-table th {
  text-align: left;
  font-weight: normal;
  color: var(--term-muted);
  padding: 0 16px 0 0;
  white-space: nowrap;
}

#terminal-pane table.term-table td {
  padding: 0 16px 0 0;
  vertical-align: top;
  white-space: nowrap;
}

#terminal-pane table.term-table tr:hover td {
  background-color: rgba(255, 255, 255, 0.025);
}

#terminal-pane span.term-more {
  color: var(--term-scope);
  cursor: pointer;
}

#terminal-pane span.term-more:hover {
  text-decoration: underline;
}

#terminal-pane span.term-count {
  color: var(--term-dim);
}
</style>
