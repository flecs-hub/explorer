<template>
  <div :class="editTabsCss()">
    <template v-if="items.length">
      <div :class="editTabsContainerCss()" :style="containerStyle" ref="containerEl">
        <div class="edit-tabs-tabs" ref="topBarEl" v-if="!hideTabs">
          <div class="edit-tabs-tabs-line"></div>
          <div :class="editButtonCss(item, false)"
            @click="editButtonSelect(item.value, false)"
            @pointerdown="onTabPointerDown($event, item, false)"
            v-for="item in topItems">
            <div :class="editButtonContentCss(item)">
              <template v-if="item.icon">
                <icon :src="item.icon" :opacity="0.5"></icon>&nbsp;&nbsp;
              </template>
              {{ item.label }}
              <div class="edit-tabs-close-button"
                v-if="activeItem && item.value == activeItem && (item.canClose || item.changed)">
                <edit-tabs-close-button
                  :changed="item.changed"
                  :canClose="item.canClose"
                  @onClose="editButtonClose(item, false)">
                </edit-tabs-close-button>
              </div>
            </div>
          </div>
        </div>

        <div class="edit-tabs-content" :style="contentStyle">
          <ul style="height: inherit; padding: 0px; margin: 0px;">
            <template v-for="item in items" :key="item.value">
              <li :class="editContentCss(item.value)" :style="tabStyle">
                <slot :name="item.value"></slot>
              </li>
            </template>
          </ul>
        </div>

        <div class="edit-tabs-splitter-row" ref="handleEl" v-if="isSplit">
          <splitter horizontal :active="resizing" @mousedown="onResizeStart"></splitter>
        </div>

        <div class="edit-tabs-tabs edit-tabs-tabs-bottom" ref="bottomBarEl" v-if="isSplit">
          <div class="edit-tabs-tabs-line"></div>
          <div :class="editButtonCss(item, true)"
            @click="editButtonSelect(item.value, true)"
            @pointerdown="onTabPointerDown($event, item, true)"
            v-for="item in bottomItems">
            <div :class="editButtonContentCss(item)">
              <template v-if="item.icon">
                <icon :src="item.icon" :opacity="0.5"></icon>&nbsp;&nbsp;
              </template>
              {{ item.label }}
              <div class="edit-tabs-close-button"
                v-if="activeBottom && item.value == activeBottom && (item.canClose || item.changed)">
                <edit-tabs-close-button
                  :changed="item.changed"
                  :canClose="item.canClose"
                  @onClose="editButtonClose(item, true)">
                </edit-tabs-close-button>
              </div>
            </div>
          </div>
        </div>

        <div class="edit-tabs-drop-overlay" :style="drag.overlay"
          v-if="drag && drag.started && drag.overlay">
        </div>
      </div>
    </template>
    <teleport to="body">
      <div class="edit-tabs-drag-ghost" :style="ghostStyle" v-if="drag && drag.started">
        {{ drag.label }}
      </div>
    </teleport>
  </div>
</template>

<script>
export default { name: "edit-tabs" }
</script>

<script setup>
import { defineProps, defineModel, defineEmits, onMounted, onUnmounted, ref, computed, watch } from 'vue';

const props = defineProps({
  items: {type: Array, required: true},
  changed: {type: Boolean, required: false, default: false},
  padding: {type: String, required: false, default: "4px;"},
  inactive: {type: Boolean, required: false, default: false},
  hideTabs: {type: Boolean, required: false, default: false},
  storageKey: {type: String, required: false}
});

const emit = defineEmits(["onClose", "visibleChanged"]);
const activeItem = defineModel("active_item");

const bottomValues = ref([]);
const activeBottom = ref();
const containerEl = ref();
const topBarEl = ref();
const bottomBarEl = ref();
const handleEl = ref();
const drag = ref(null);
const suppressClick = ref(false);
const splitRatio = ref(0.5);
const resizing = ref(false);
let resizeCtx = null;

const bottomSet = computed(() => new Set(bottomValues.value));
const topItems = computed(() => props.items.filter(i => !bottomSet.value.has(i.value)));
const bottomItems = computed(() => props.items.filter(i => bottomSet.value.has(i.value)));
const isSplit = computed(() => !props.hideTabs && bottomItems.value.length > 0);

const contentStyle = computed(() => {
  if (isSplit.value) {
    return undefined;
  }
  return `padding: ${props.padding}; padding-bottom: 0px;`;
});

const tabStyle = computed(() => {
  if (!isSplit.value) {
    return undefined;
  }
  return `padding: ${props.padding}; padding-bottom: 0px;`;
});

const containerStyle = computed(() => {
  if (!isSplit.value) {
    return undefined;
  }
  const top = Math.round(splitRatio.value * 1000) / 1000;
  const bottom = Math.round((1 - splitRatio.value) * 1000) / 1000;
  return `grid-template-rows: 38.5px minmax(0, ${top}fr) calc(var(--gap) - 2px) 38.5px minmax(0, ${bottom}fr);`;
});

const ghostStyle = computed(() => {
  if (!drag.value) {
    return undefined;
  }
  return { left: (drag.value.x + 12) + "px", top: (drag.value.y + 12) + "px" };
});

onMounted(() => {
  if (props.items.length) {
    if (activeItem.value === undefined) {
      activeItem.value = firstValue(topItems.value);
    } else if (bottomSet.value.has(activeItem.value)) {
      activeBottom.value = activeItem.value;
      activeItem.value = firstValue(topItems.value);
    }
    if (bottomItems.value.length && !bottomSet.value.has(activeBottom.value)) {
      activeBottom.value = firstValue(bottomItems.value);
    }
  }
});

onUnmounted(() => {
  stopDrag();
  stopResize();
});

function firstValue(items) {
  return items.length ? items[0].value : undefined;
}

function collapse(active) {
  bottomValues.value = [];
  activeBottom.value = undefined;
  if (active !== undefined) {
    activeItem.value = active;
  }
}

function storageId() {
  return "flecs-explorer-tabs-" + props.storageKey;
}

function loadState() {
  if (!props.storageKey) {
    return;
  }

  let state;
  try {
    state = JSON.parse(window.localStorage.getItem(storageId()));
  } catch (e) {
    state = undefined;
  }
  if (!state) {
    return;
  }

  if (typeof state.splitRatio === "number") {
    splitRatio.value = Math.min(0.9, Math.max(0.1, state.splitRatio));
  }

  if (Array.isArray(state.bottomValues) && state.bottomValues.length) {
    if (!props.items.length ||
      props.items.some(i => !state.bottomValues.includes(i.value)))
    {
      bottomValues.value = state.bottomValues;
      activeBottom.value = state.activeBottom;
    }
  }
}

function saveState() {
  if (!props.storageKey) {
    return;
  }

  try {
    window.localStorage.setItem(storageId(), JSON.stringify({
      bottomValues: bottomValues.value,
      activeBottom: activeBottom.value,
      splitRatio: splitRatio.value
    }));
  } catch (e) {}
}

loadState();

watch(() => [bottomValues.value, activeBottom.value, splitRatio.value], () => {
  saveState();
});

watch(() => JSON.stringify(props.items.map(i => i.value)), () => {
  const values = new Set(props.items.map(i => i.value));
  bottomValues.value = bottomValues.value.filter(v => values.has(v));

  if (!bottomValues.value.length) {
    activeBottom.value = undefined;
    return;
  }

  if (bottomValues.value.length == values.size) {
    collapse(activeBottom.value);
    return;
  }

  if (!bottomSet.value.has(activeBottom.value)) {
    activeBottom.value = firstValue(bottomItems.value);
  }

  if (bottomSet.value.has(activeItem.value)) {
    activeItem.value = firstValue(topItems.value);
  }
});

watch(() => props.hideTabs, (hidden) => {
  if (hidden) {
    collapse(activeItem.value);
  }
});

watch(activeItem, (value) => {
  if (value !== undefined && bottomSet.value.has(value)) {
    activeBottom.value = value;
    activeItem.value = firstValue(topItems.value);
  }
});

watch(() => [activeItem.value, isSplit.value ? activeBottom.value : undefined], (visible) => {
  emit("visibleChanged", visible.filter(v => v !== undefined));
}, {immediate: true});

function onTabPointerDown(evt, item, fromBottom) {
  if (evt.button !== 0) {
    return;
  }
  if (props.items.length < 2) {
    return;
  }

  drag.value = {
    value: item.value,
    label: item.label,
    fromBottom: fromBottom,
    startX: evt.clientX,
    startY: evt.clientY,
    x: evt.clientX,
    y: evt.clientY,
    started: false,
    target: null,
    overlay: null
  };

  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
  window.addEventListener("pointercancel", onDragCancel);
}

function onDragMove(evt) {
  const d = drag.value;
  if (!d) {
    return;
  }

  d.x = evt.clientX;
  d.y = evt.clientY;

  if (!d.started) {
    if (Math.abs(d.x - d.startX) < 8 && Math.abs(d.y - d.startY) < 8) {
      return;
    }
    d.started = true;
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
  }

  updateDropTarget(d);
}

function updateDropTarget(d) {
  d.target = null;
  d.overlay = null;

  if (!containerEl.value) {
    return;
  }

  const c = containerEl.value.getBoundingClientRect();
  if (d.x < c.left || d.x > c.right || d.y < c.top || d.y > c.bottom) {
    return;
  }

  if (!isSplit.value) {
    if (topItems.value.length < 2 || !topBarEl.value) {
      return;
    }
    const contentTop = topBarEl.value.getBoundingClientRect().bottom;
    const half = (c.bottom - contentTop) / 2;
    if (d.y >= contentTop + half) {
      d.target = "split";
      d.overlay = overlayRect(c, contentTop + half, c.bottom);
    }
  } else {
    if (!bottomBarEl.value) {
      return;
    }
    const boundary = bottomBarEl.value.getBoundingClientRect().top;
    if (d.y < boundary) {
      if (d.fromBottom) {
        d.target = "top";
        d.overlay = overlayRect(c, c.top, boundary);
      }
    } else if (!d.fromBottom) {
      d.target = "bottom";
      d.overlay = overlayRect(c, boundary, c.bottom);
    }
  }
}

function overlayRect(c, top, bottom) {
  return {
    top: (top - c.top) + "px",
    left: "0px",
    width: "100%",
    height: (bottom - top) + "px"
  };
}

function onDragEnd() {
  const d = drag.value;
  if (d && d.started) {
    if (d.target) {
      applyDrop(d);
    }
    suppressClick.value = true;
    setTimeout(() => { suppressClick.value = false; }, 0);
  }
  stopDrag();
}

function onDragCancel() {
  stopDrag();
}

function stopDrag() {
  drag.value = null;
  document.body.style.userSelect = "";
  document.body.style.webkitUserSelect = "";
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  window.removeEventListener("pointercancel", onDragCancel);
}

function onResizeStart(evt) {
  if (evt.button !== 0) {
    return;
  }
  if (!containerEl.value || !topBarEl.value || !bottomBarEl.value || !handleEl.value) {
    return;
  }

  const c = containerEl.value.getBoundingClientRect();
  const topBar = topBarEl.value.getBoundingClientRect();
  const bottomBar = bottomBarEl.value.getBoundingClientRect();
  const handle = handleEl.value.getBoundingClientRect();

  resizeCtx = {
    contentTop: topBar.bottom,
    available: (c.bottom - topBar.bottom) - bottomBar.height - handle.height
  };
  resizing.value = true;

  document.body.style.userSelect = "none";
  document.body.style.webkitUserSelect = "none";
  document.body.style.cursor = "row-resize";

  window.addEventListener("pointermove", onResizeMove);
  window.addEventListener("pointerup", onResizeEnd);
  window.addEventListener("pointercancel", onResizeEnd);

  evt.preventDefault();
}

function onResizeMove(evt) {
  if (!resizeCtx || resizeCtx.available <= 0) {
    return;
  }
  const ratio = (evt.clientY - resizeCtx.contentTop) / resizeCtx.available;
  splitRatio.value = Math.min(0.9, Math.max(0.1, Math.round(ratio * 1000) / 1000));
}

function onResizeEnd() {
  stopResize();
}

function stopResize() {
  if (!resizeCtx && !resizing.value) {
    return;
  }
  resizeCtx = null;
  resizing.value = false;
  document.body.style.userSelect = "";
  document.body.style.webkitUserSelect = "";
  document.body.style.cursor = "";
  window.removeEventListener("pointermove", onResizeMove);
  window.removeEventListener("pointerup", onResizeEnd);
  window.removeEventListener("pointercancel", onResizeEnd);
}

function applyDrop(d) {
  if (d.target == "split") {
    bottomValues.value = [d.value];
    activeBottom.value = d.value;
    if (activeItem.value == d.value) {
      activeItem.value = firstValue(topItems.value);
    }
  } else if (d.target == "bottom") {
    if (!bottomValues.value.includes(d.value)) {
      bottomValues.value = [...bottomValues.value, d.value];
    }
    activeBottom.value = d.value;
    if (!topItems.value.length) {
      collapse(d.value);
      return;
    }
    if (bottomSet.value.has(activeItem.value)) {
      activeItem.value = firstValue(topItems.value);
    }
  } else if (d.target == "top") {
    bottomValues.value = bottomValues.value.filter(v => v != d.value);
    activeItem.value = d.value;
    if (!bottomValues.value.length) {
      activeBottom.value = undefined;
    } else if (activeBottom.value == d.value) {
      activeBottom.value = firstValue(bottomItems.value);
    }
  }
}

function editTabsCss() {
  let classes = ["edit-tabs"];
  if (!props.items.length) {
    classes.push("pane");
    classes.push("pane-scripts-empty");
  }
  return classes;
}

function editTabsContainerCss() {
  let classes = ["edit-tabs-container", "pane"];
  if (props.hideTabs) {
    classes.push("edit-tabs-container-no-tabs");
  }
  if (isSplit.value) {
    classes.push("edit-tabs-container-split");
  }
  return classes;
}

function editButtonCss(item, bottom) {
  let classes = ["noselect", "edit-tabs-button"];

  const active = bottom ? activeBottom.value : activeItem.value;
  if (active && item.value == active) {
    classes.push("edit-tabs-button-active");
    if (props.inactive) {
      classes.push("edit-tabs-button-inactive");
    }
  }

  const d = drag.value;
  if (d && d.started && d.value == item.value && d.fromBottom == bottom) {
    classes.push("edit-tabs-button-dragging");
  }

  return classes;
}

function editButtonContentCss(item) {
  let classes = ["noselect", "edit-tabs-button-content"];

  if (item.canClose || item.changed) {
    classes.push("edit-tabs-button-content-can-close");
  }

  return classes;
}

function editButtonSelect(value, bottom) {
  if (suppressClick.value) {
    suppressClick.value = false;
    return;
  }
  if (bottom) {
    activeBottom.value = value;
  } else {
    activeItem.value = value;
  }
}

function editButtonClose(item, bottom) {
  const viewItems = bottom ? bottomItems.value : topItems.value;
  let prevItem = undefined;

  for (let i of viewItems) {
    if (i.value == item.value) {
      break;
    }
    prevItem = i;
  }

  if (prevItem) {
    if (bottom) {
      activeBottom.value = prevItem.value;
    } else {
      activeItem.value = prevItem.value;
    }
  }

  emit("onClose", item);
}

function editContentCss(value) {
  const bottom = bottomSet.value.has(value);
  let classes = ["edit-tabs-tab"];
  classes.push(bottom ? "edit-tabs-tab-bottom" : "edit-tabs-tab-top");

  const active = bottom ? activeBottom.value : activeItem.value;
  if (value == active && (!bottom || isSplit.value)) {
    classes.push("selected");
  }

  return classes;
}

</script>

<style scoped>

div.edit-tabs {
  display: grid;
  overflow: hidden;
  grid-template-rows: auto;
  gap: var(--gap);
  background-color: var(--bg-content);
  height: 100%;
}

div.edit-tabs-container {
  position: relative;
  grid-row: 1;
  display: grid;
  grid-template-rows: 38.5px 1fr;
  border-radius: var(--border-radius-medium);
  overflow: hidden;
  height: calc(100% - 2px);
  min-height: 0;
}

div.edit-tabs-content {
  grid-row: 2;
  height: 100%;
  min-height: 0;
  overflow: auto;
  box-sizing: border-box;
}

div.edit-tabs-container-no-tabs {
  grid-template-rows: 1fr;
}

div.edit-tabs-container-no-tabs div.edit-tabs-content {
  grid-row: 1;
}

div.edit-tabs-container-split {
  grid-template-rows: 38.5px minmax(0, 1fr) calc(var(--gap) - 2px) 38.5px minmax(0, 1fr);
  grid-template-columns: 100%;
}

div.edit-tabs-container-split div.edit-tabs-content,
div.edit-tabs-container-split div.edit-tabs-content > ul {
  display: contents;
}

div.edit-tabs-container-split li.edit-tabs-tab.selected {
  overflow: auto;
  min-height: 0;
  box-sizing: border-box;
  height: auto;
  grid-column: 1;
}

div.edit-tabs-container-split li.edit-tabs-tab-top.selected {
  grid-row: 2;
}

div.edit-tabs-container-split li.edit-tabs-tab-bottom.selected {
  grid-row: 5;
}

div.edit-tabs-tabs {
  position: relative;
  border-radius: var(--border-radius-medium);
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  overflow: auto;
  background-color: var(--bg-color);
  grid-row: 1;
  display: flex;
  flex-wrap: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

div.edit-tabs-tabs::-webkit-scrollbar {
  display: none;
}

div.edit-tabs-tabs-bottom {
  grid-row: 4;
  grid-column: 1;
  border-radius: 0px;
  box-sizing: border-box;
}

div.edit-tabs-tabs-line {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: calc(100% - 1px);
  border-style: solid;
  border-width: 0px;
  border-top-width: 0px;
  border-bottom-width: 1px;
  border-color: var(--border);
}

div.edit-tabs-button {
  display: inline-block;
  position: relative;
  grid-column: 1;
  cursor: pointer;
  border-style: solid;
  border-width: 0px;
  border-left-width: 1px;
  border-right-width: 0px;
  border-top-width: 0px;
  border-bottom-width: 1px;
  border-color: var(--border);
  border-top-color: rgba(0, 0, 0, 0);
  transition: background-color var(--animation-duration) ease-in-out;
  color: var(--secondary-text);
  white-space: nowrap;
  overflow: hidden;
}

div.edit-tabs-button-content-can-close {
  padding-right: 30px !important;
}

div.edit-tabs-button:nth-child(2) {
  border-left-width: 0px;
}

div.edit-tabs-button:last-child {
  border-right-width: 1px;
}

div.edit-tabs-button-content {
  padding: 8px;
  padding-left: 16px;
  padding-right: 16px;
  font-size: 0.9rem;
  border-style: solid;
  border-width: 0px;
  border-top-width: 2px;
  border-color: rgba(0, 0, 0, 0);
}

div.edit-tabs-button-active {
  background-color: var(--bg-pane);
  border-bottom-color: rgba(0, 0, 0, 0);
  border-top-left-radius: var(--border-radius-small);
  border-top-right-radius: var(--border-radius-small);
  border-right-width: 1px;
  color: var(--primary-text);
}

div.edit-tabs-button-active + div.edit-tabs-button {
  border-left-width: 0px;
}

div.edit-tabs-button-active .edit-tabs-button-content {
  border-top-color: var(--green);
}

div.edit-tabs-button-active.edit-tabs-button-inactive {
  color: var(--secondary-text);
}

div.edit-tabs-button-active.edit-tabs-button-inactive .edit-tabs-button-content {
  border-top-color: var(--tertiary-text);
}

div.edit-tabs-button:hover {
  background-color: var(--bg-pane);
}

div.edit-tabs-button-dragging {
  opacity: 0.5;
}

div.edit-tabs-close-button {
  position: absolute;
  top: 10px;
  right: 8px;
}

div.edit-tabs-splitter-row {
  grid-row: 3;
  grid-column: 1;
  z-index: 15;
  display: grid;
  background-color: var(--bg-content);
}

div.edit-tabs-drop-overlay {
  position: absolute;
  z-index: 10;
  pointer-events: none;
  box-sizing: border-box;
  background-color: rgba(66, 185, 131, 0.12);
  border: 1px solid var(--green);
  border-radius: var(--border-radius-small);
}

div.edit-tabs-drag-ghost {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  padding: 6px 14px;
  font-size: 0.9rem;
  color: var(--primary-text);
  background-color: var(--bg-pane);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-small);
  opacity: 0.9;
  white-space: nowrap;
}

.edit-tabs-tab {
  display: none;
}

.edit-tabs-tab.selected {
  display: block;
  height: 100%;
}

</style>
