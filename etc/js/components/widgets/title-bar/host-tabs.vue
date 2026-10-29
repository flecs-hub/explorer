<template>
  <div class="host-tabs">
    <div :class="playgroundCss"
      title="Playground: write Flecs Script in a world that runs in your browser"
      @click="selectPlayground">
      <div class="host-tab-inner">
        <icon src="edit-code" :opacity="isPlayground ? 0.9 : 0.6"></icon>
      </div>
    </div>

    <div v-for="tab in tabs"
      :key="tab.key"
      :class="tabCss(tab)"
      :title="tabTooltip(tab)"
      @click="selectHost(tab)"
      @dblclick="startEdit(tab)"
      @auxclick="onAuxClick($event, tab)">
      <div class="host-tab-inner" v-if="isEditing(tab)">
        <input
          ref="editHostInput"
          class="host-tab-input"
          type="text"
          placeholder="host:port"
          :value="tab.host"
          @click.stop
          @dblclick.stop
          @keydown.enter="confirmEdit(tab)"
          @keydown.esc="cancelEdit"
          @blur="cancelEdit">
        </input>
      </div>
      <div class="host-tab-inner" v-else>
        <span :class="statusCss(tab)"></span>
        <span class="host-tab-label">{{ tabLabel(tab) }}</span>
        <span class="host-tab-port" v-if="tabPort(tab)">{{ tabPort(tab) }}</span>
        <span :class="closeCss(tab)" @click.stop="closeTab(tab)" :title="canClose(tab) ? 'Close' : undefined">
          <icon src="close" :size="14" :opacity="0.7"></icon>
        </span>
      </div>
    </div>

    <div class="host-tab host-tab-new" v-if="adding">
      <div class="host-tab-inner">
        <input
          ref="newHostInput"
          class="host-tab-input"
          type="text"
          placeholder="host:port"
          @keydown.enter="confirmAdd"
          @keydown.esc="cancelAdd"
          @blur="cancelAdd">
        </input>
      </div>
    </div>

    <div class="host-tabs-add" title="Connect to host" @click="startAdd" v-else>
      <icon src="add" :opacity="0.7"></icon>
    </div>
  </div>
</template>

<script>
export default { name: "host-tabs" };
</script>

<script setup>
import { computed, ref, defineProps, defineModel, onMounted, onUnmounted, nextTick, watch } from 'vue';

const TABS_STORAGE = "flecs-explorer-host-tabs";
const PLAYGROUND_HOST = "flecs_explorer.wasm";

const props = defineProps({
  app_state: {type: Object, required: true}
});

const app_params = defineModel("app_params");

const tabs = ref(loadList(TABS_STORAGE).map((tab) => ({
  key: flecs.normalizeHost(tab.host),
  host: tab.host,
  name: tab.name,
  manual: !!tab.manual,
  seen: !!tab.seen,
  online: undefined
})));
const adding = ref(false);
const editing = ref(undefined);
const savedStates = new Map();
const newHostInput = ref(null);
const editHostInput = ref(null);
let discovery;

function loadList(key) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key));
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {}
  return [];
}

function saveList(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

function compareTabs(a, b) {
  const sepA = a.key.lastIndexOf(":");
  const sepB = b.key.lastIndexOf(":");
  const hostA = a.key.slice(0, sepA);
  const hostB = b.key.slice(0, sepB);
  if (hostA !== hostB) {
    return hostA < hostB ? -1 : 1;
  }
  return Number(a.key.slice(sepA + 1)) - Number(b.key.slice(sepB + 1));
}

function saveTabs() {
  tabs.value.sort(compareTabs);
  saveList(TABS_STORAGE, tabs.value.filter((tab) => tab.manual || tab.seen).map((tab) => ({
    host: tab.host,
    name: tab.name,
    manual: tab.manual,
    seen: tab.seen
  })));
}

const isPlayground = computed(() => {
  const host = app_params.value.host;
  return !!host && host.endsWith(".wasm");
});

const currentKey = computed(() => {
  if (isPlayground.value) {
    return undefined;
  }
  return flecs.normalizeHost(app_params.value.host);
});

function ensureCurrentTab() {
  const key = currentKey.value;
  if (!key) {
    return;
  }
  if (!tabs.value.find((tab) => tab.key === key)) {
    tabs.value.push({
      key: key,
      host: app_params.value.host,
      name: undefined,
      manual: false,
      seen: false,
      online: undefined
    });
  }
  saveTabs();
}

function onHosts(hosts) {
  const found = new Set();

  for (const host of hosts) {
    const key = flecs.normalizeHost(host.host);
    found.add(key);

    const tab = tabs.value.find((t) => t.key === key);
    if (tab) {
      tab.name = host.name;
      tab.online = true;
      tab.seen = true;
    } else {
      tabs.value.push({
        key: key,
        host: host.host,
        name: host.name,
        manual: false,
        seen: true,
        online: true
      });
    }
  }

  tabs.value = tabs.value.filter((tab) => {
    if (found.has(tab.key)) {
      return true;
    }
    tab.online = false;
    return tab.manual || tab.seen || tab.key === currentKey.value;
  });

  saveTabs();
}

function isCurrent(tab) {
  return tab.key === currentKey.value;
}

function prettyName(name) {
  if (!name) {
    return undefined;
  }
  name = name.replaceAll("_", " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function tabName(tab) {
  if (isCurrent(tab) && props.app_state.app_name) {
    return prettyName(props.app_state.app_name);
  }
  return prettyName(tab.name);
}

function tabLabel(tab) {
  return tabName(tab) || tab.key;
}

function tabPort(tab) {
  if (!tabName(tab)) {
    return undefined;
  }
  const sep = tab.key.lastIndexOf(":");
  if (sep === -1) {
    return undefined;
  }
  return tab.key.slice(sep);
}

function tabStatus(tab) {
  if (isCurrent(tab)) {
    const status = props.app_state.status;
    if (status == flecs.ConnectionStatus.Connected) {
      return "online";
    } else if (status == flecs.ConnectionStatus.Disconnected) {
      return "offline";
    }
    return "connecting";
  }
  if (tab.online === true) {
    return "online";
  } else if (tab.online === false) {
    return "offline";
  }
  return "unknown";
}

function tabTooltip(tab) {
  const status = {
    online: "connected",
    offline: "not reachable",
    connecting: "connecting",
    unknown: "checking"
  }[tabStatus(tab)];

  const name = tabName(tab);
  if (name) {
    return `${name} (${tab.key}) - ${status}`;
  }
  return `${tab.key} - ${status}`;
}

function tabCss(tab) {
  const classes = ["host-tab"];
  if (isCurrent(tab)) {
    classes.push("host-tab-active");
  }
  if (tabStatus(tab) === "offline") {
    classes.push("host-tab-offline");
  }
  if (isEditing(tab)) {
    classes.push("host-tab-editing");
  }
  return classes;
}

const playgroundCss = computed(() => {
  const classes = ["host-tab", "host-tab-pinned"];
  if (isPlayground.value) {
    classes.push("host-tab-active");
  }
  return classes;
});

function statusCss(tab) {
  return ["host-tab-status", "host-tab-status-" + tabStatus(tab)];
}

function stateKey() {
  if (isPlayground.value) {
    return PLAYGROUND_HOST;
  }
  return currentKey.value;
}

function copyParam(value) {
  if (Array.isArray(value)) {
    return [...value];
  }
  if (value && typeof value === "object") {
    return {...value};
  }
  return value;
}

function saveState() {
  const key = stateKey();
  if (!key) {
    return;
  }
  const params = app_params.value;
  const state = {};
  for (const name in params) {
    if (typeof params[name] !== "function") {
      state[name] = copyParam(params[name]);
    }
  }
  savedStates.set(key, state);
}

function restoreState(key) {
  const state = savedStates.get(key);
  if (!state) {
    return false;
  }
  const params = app_params.value;
  for (const name in state) {
    params[name] = copyParam(state[name]);
  }
  return true;
}

function resetHostParams() {
  const params = app_params.value;
  params.script = undefined;
  params.scripts = [];
  params.code = undefined;
  params.code_url = undefined;
  params.entities.tab = "Overview";
  params.entities.inspector_tab = "Inspect";
  params.entities.info_mode = undefined;
  params.entities.path = undefined;
  if (params.terminal) {
    params.terminal.session = undefined;
  }
}

function selectHost(tab) {
  if (isCurrent(tab)) {
    return;
  }
  saveState();
  if (restoreState(tab.key)) {
    return;
  }
  resetHostParams();
  app_params.value.host = tab.host;
}

function selectPlayground() {
  if (isPlayground.value) {
    return;
  }
  saveState();
  if (restoreState(PLAYGROUND_HOST)) {
    return;
  }
  app_params.value.run_playground();
}

function canClose(tab) {
  return tabStatus(tab) !== "online";
}

function closeCss(tab) {
  const classes = ["host-tab-close"];
  if (!canClose(tab)) {
    classes.push("host-tab-close-hidden");
  }
  return classes;
}

function closeTab(tab) {
  const index = tabs.value.indexOf(tab);
  if (index === -1 || !canClose(tab)) {
    return;
  }

  const wasCurrent = isCurrent(tab);
  tabs.value.splice(index, 1);
  saveTabs();

  if (wasCurrent) {
    const next = tabs.value[index] || tabs.value[index - 1];
    if (next) {
      selectHost(next);
    } else {
      selectPlayground();
    }
  }
  savedStates.delete(tab.key);
}

function onAuxClick(event, tab) {
  if (event.button === 1) {
    event.preventDefault();
    closeTab(tab);
  }
}

function startAdd() {
  adding.value = true;
  nextTick(() => {
    if (newHostInput.value) {
      newHostInput.value.focus();
    }
  });
}

function cancelAdd() {
  adding.value = false;
}

function confirmAdd() {
  const host = newHostInput.value ? newHostInput.value.value.trim() : "";
  adding.value = false;
  if (!host) {
    return;
  }

  const key = flecs.normalizeHost(host);

  let tab = tabs.value.find((t) => t.key === key);
  if (tab) {
    tab.manual = true;
  } else {
    tab = {key: key, host: host, name: undefined, manual: true, seen: false, online: undefined};
    tabs.value.push(tab);
  }
  saveTabs();
  selectHost(tab);
}

function isEditing(tab) {
  return editing.value === tab.key;
}

function startEdit(tab) {
  editing.value = tab.key;
  nextTick(() => {
    const input = editInput();
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function editInput() {
  const input = editHostInput.value;
  return Array.isArray(input) ? input[0] : input;
}

function cancelEdit() {
  editing.value = undefined;
}

function confirmEdit(tab) {
  const input = editInput();
  const host = input ? input.value.trim() : "";
  editing.value = undefined;
  if (!host) {
    return;
  }

  const key = flecs.normalizeHost(host);
  if (key === tab.key) {
    tab.host = host;
    saveTabs();
    return;
  }

  const index = tabs.value.indexOf(tab);
  if (index === -1) {
    return;
  }

  const wasCurrent = isCurrent(tab);
  savedStates.delete(tab.key);

  let target = tabs.value.find((t) => t.key === key);
  if (target) {
    tabs.value.splice(index, 1);
    target.manual = true;
  } else {
    tab.key = key;
    tab.host = host;
    tab.name = undefined;
    tab.manual = true;
    tab.seen = false;
    tab.online = undefined;
    target = tab;
  }
  saveTabs();

  if (wasCurrent) {
    if (restoreState(target.key)) {
      return;
    }
    resetHostParams();
    app_params.value.host = target.host;
  }
}

ensureCurrentTab();
watch(currentKey, ensureCurrentTab);

watch(() => props.app_state.status, (status) => {
  if (status != flecs.ConnectionStatus.Connected) {
    return;
  }
  const tab = tabs.value.find((t) => t.key === currentKey.value);
  if (tab && !tab.seen) {
    tab.seen = true;
    saveTabs();
  }
});

function onVisibilityChange() {
  if (discovery && document.visibilityState === "visible") {
    discovery.scan();
  }
}

onMounted(() => {
  discovery = flecs.startDiscovery({
    on_hosts: onHosts
  });
  document.addEventListener("visibilitychange", onVisibilityChange);
});

onUnmounted(() => {
  if (discovery) {
    discovery.stop();
    discovery = undefined;
  }
  document.removeEventListener("visibilitychange", onVisibilityChange);
});

</script>

<style scoped>
div.host-tabs {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  min-width: 0;
  padding: 0px 8px;
  user-select: none;
}

div.host-tab {
  position: relative;
  display: flex;
  flex: 0 1 auto;
  min-width: 56px;
  height: 100%;
  margin: 0px 1px;
  border-radius: var(--border-radius-large);
  color: var(--secondary-text);
  cursor: pointer;
  transition: color var(--animation-duration), background-color var(--animation-duration);
}

div.host-tab-pinned {
  flex: 0 0 40px;
  min-width: 40px;
}

div.host-tab + div.host-tab::before {
  content: "";
  position: absolute;
  left: -2px;
  top: 50%;
  width: 1px;
  height: 14px;
  transform: translateY(-50%);
  background-color: var(--border);
  pointer-events: none;
  transition: opacity var(--animation-duration);
}

div.host-tab + div.host-tab.host-tab-active::before,
div.host-tab + div.host-tab:hover::before,
div.host-tab-active + div.host-tab.host-tab::before,
div.host-tab:hover + div.host-tab.host-tab::before {
  opacity: 0;
}

div.host-tab-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  padding: 0px 6px 0px 10px;
}

div.host-tab-pinned div.host-tab-inner {
  justify-content: center;
  padding: 0px;
}

div.host-tab:hover {
  background-color: var(--hover-bg);
  color: var(--primary-text);
}

div.host-tab-active,
div.host-tab-active:hover {
  background-color: var(--bg-pane);
  color: var(--highlight-text);
}

div.host-tab-offline span.host-tab-label {
  opacity: 0.6;
}

span.host-tab-status {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--steel-500);
}

span.host-tab-status-online {
  background-color: var(--green);
}

span.host-tab-status-connecting {
  background-color: var(--orange);
  animation: host-tab-pulse 1s ease-in-out infinite alternate;
}

span.host-tab-status-offline {
  background-color: var(--steel-600);
}

span.host-tab-status-unknown {
  background-color: transparent;
  border: 1px solid var(--steel-500);
  width: 5px;
  height: 5px;
}

@keyframes host-tab-pulse {
  from { opacity: 0.35; }
  to { opacity: 1.0; }
}

span.host-tab-label {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 150px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

span.host-tab-port {
  flex: 0 100 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  color: var(--secondary-text);
  opacity: 0.7;
  font-size: 0.8rem;
}

span.host-tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-left: auto;
  border-radius: 50%;
  opacity: 0.5;
  transition: opacity var(--animation-duration), background-color var(--animation-duration);
}

div.host-tab:hover span.host-tab-close,
div.host-tab-active span.host-tab-close {
  opacity: 1.0;
}

span.host-tab-close:hover {
  background-color: var(--bg-button-hover);
}

span.host-tab-close-hidden {
  visibility: hidden;
}

div.host-tab-new,
div.host-tab-editing {
  flex: 0 1 200px;
  padding: 0px 2px;
}

div.host-tab-editing div.host-tab-inner {
  padding: 0px;
}

input.host-tab-input {
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0px 6px;
  border: 1px solid var(--accent);
  border-radius: var(--border-radius-small);
  box-shadow: 0 0 0 3px var(--accent-muted);
  outline: none;
  background-color: var(--bg-input);
  color: var(--highlight-text);
  font-size: inherit;
}

div.host-tabs-add {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  margin-left: 6px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color var(--animation-duration);
}

div.host-tabs-add:hover {
  background-color: var(--bg-button);
}

</style>
