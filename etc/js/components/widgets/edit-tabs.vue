<template>
  <div :class="editTabsCss()">
    <template v-if="items.length">
      <div :class="editTabsContainerCss()" :style="containerStyle" ref="containerEl">
        <div :class="tabBarCss(false)" ref="topBarEl" v-if="!hideTabs"
          @click="onBarClick($event, false)">
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
                v-if="activeTop && item.value == activeTop && (item.canClose || item.changed)">
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
                <teleport
                  :to="teleportTargets[item.value] || null"
                  :disabled="!teleportTargets[item.value]">
                  <div class="edit-tabs-borrow-content">
                    <slot :name="item.value"></slot>
                  </div>
                </teleport>
              </li>
            </template>
            <template v-for="item in hostedItems" :key="item.value">
              <li :class="editContentCss(item.value)" :style="tabStyle"
                :ref="el => setHostSlot(item.value, el)">
              </li>
            </template>
          </ul>
        </div>

        <div class="edit-tabs-splitter-row" ref="handleEl" v-if="isSplit">
          <splitter horizontal :active="resizing" @mousedown="onResizeStart"></splitter>
        </div>

        <div :class="tabBarCss(true)" ref="bottomBarEl" v-if="isSplit"
          @click="onBarClick($event, true)">
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

        <div class="edit-tabs-bar-catcher edit-tabs-bar-catcher-top"
          v-if="topMinimized && !hideTabs" @click="onBarClick($event, false)">
        </div>
        <div class="edit-tabs-bar-catcher edit-tabs-bar-catcher-bottom"
          v-if="bottomMinimized && isSplit" @click="onBarClick($event, true)">
        </div>

        <div class="edit-tabs-drop-overlay" :style="sharedDrag.overlay"
          v-if="sharedDrag.hostKey == dockKey && sharedDrag.overlay">
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
import { reactive, markRaw } from 'vue';

const BORROW_PREFIX = "@borrowed:";
const BORROWS_STORAGE = "flecs-explorer-tab-borrows";
const FULL_BAR_HEIGHT = 38.5;
const MINIMIZED_BAR_HEIGHT = 6;

const claimedDockKeys = new Set();
const dockWidgets = reactive(new Map());
const dockDrag = reactive({ hostKey: null, overlay: null });

function claimDockKey(storageKey) {
  const base = storageKey || "anon";
  let n = 0;
  while (claimedDockKeys.has(base + "#" + n)) {
    n++;
  }
  const key = base + "#" + n;
  claimedDockKeys.add(key);
  return key;
}

function releaseDockKey(key) {
  claimedDockKeys.delete(key);
}

function syntheticFor(ownerKey, value) {
  return BORROW_PREFIX + ownerKey + "/" + value;
}

function isSynthetic(value) {
  return typeof value == "string" && value.startsWith(BORROW_PREFIX);
}

function parseSynthetic(value) {
  const s = value.slice(BORROW_PREFIX.length);
  const sep = s.indexOf("/");
  return { ownerKey: s.slice(0, sep), value: s.slice(sep + 1) };
}

function loadBorrows() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(BORROWS_STORAGE));
    if (Array.isArray(parsed)) {
      return parsed.filter(b => b &&
        typeof b.ownerKey == "string" &&
        typeof b.value == "string" &&
        typeof b.hostKey == "string" &&
        b.ownerKey != b.hostKey);
    }
  } catch (e) {}
  return [];
}

const dockBorrows = reactive(loadBorrows());

function saveBorrows() {
  try {
    window.localStorage.setItem(BORROWS_STORAGE, JSON.stringify(
      dockBorrows.filter(b =>
        !b.ownerKey.startsWith("anon#") && !b.hostKey.startsWith("anon#"))));
  } catch (e) {}
}

function findBorrow(ownerKey, value) {
  return dockBorrows.findIndex(b => b.ownerKey == ownerKey && b.value == value);
}

function addBorrow(ownerKey, value, hostKey) {
  if (ownerKey == hostKey) {
    return;
  }
  const i = findBorrow(ownerKey, value);
  if (i != -1) {
    dockBorrows.splice(i, 1);
  }
  dockBorrows.push({ ownerKey: ownerKey, value: value, hostKey: hostKey });
  saveBorrows();
}

function removeBorrow(ownerKey, value) {
  const i = findBorrow(ownerKey, value);
  if (i != -1) {
    dockBorrows.splice(i, 1);
    saveBorrows();
  }
}

export default { name: "edit-tabs" }
</script>

<script setup>
import { defineProps, defineModel, defineEmits, onMounted, onUnmounted, ref, computed, watch, shallowReactive, nextTick } from 'vue';

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

const dockKey = claimDockKey(props.storageKey);
const sharedDrag = dockDrag;

const bottomValues = ref([]);
const activeTop = ref();
const activeBottom = ref();
const containerEl = ref();
const topBarEl = ref();
const bottomBarEl = ref();
const handleEl = ref();
const drag = ref(null);
const suppressClick = ref(false);
const splitRatio = ref(0.5);
const resizing = ref(false);
const topMinimized = ref(false);
const bottomMinimized = ref(false);
const hostSlotEls = shallowReactive({});
let resizeCtx = null;

const borrowedAway = computed(() => {
  const res = new Map();
  for (const b of dockBorrows) {
    if (b.ownerKey != dockKey || b.hostKey == dockKey) {
      continue;
    }
    if (!props.items.some(i => i.value == b.value)) {
      continue;
    }
    const host = dockWidgets.get(b.hostKey);
    if (!host || !host.acceptsBorrows()) {
      continue;
    }
    res.set(b.value, b);
  }
  return res;
});

const hostedItems = computed(() => {
  const res = [];
  if (props.hideTabs || !props.items.length) {
    return res;
  }
  for (const b of dockBorrows) {
    if (b.hostKey != dockKey || b.ownerKey == dockKey) {
      continue;
    }
    const owner = dockWidgets.get(b.ownerKey);
    if (!owner) {
      continue;
    }
    const item = owner.item(b.value);
    if (!item) {
      continue;
    }
    res.push({
      label: item.label,
      icon: item.icon,
      canClose: item.canClose,
      changed: item.changed,
      value: syntheticFor(b.ownerKey, b.value),
      borrowOwner: b.ownerKey,
      borrowValue: b.value
    });
  }
  return res;
});

const effectiveItems = computed(() => [
  ...props.items.filter(i => !borrowedAway.value.has(i.value)),
  ...hostedItems.value
]);

const bottomSet = computed(() => new Set(bottomValues.value));
const topItems = computed(() => effectiveItems.value.filter(i => !bottomSet.value.has(i.value)));
const bottomItems = computed(() => effectiveItems.value.filter(i => bottomSet.value.has(i.value)));
const isSplit = computed(() => !props.hideTabs && bottomItems.value.length > 0);

const teleportTargets = computed(() => {
  const res = {};
  for (const [value, b] of borrowedAway.value) {
    const host = dockWidgets.get(b.hostKey);
    if (!host) {
      continue;
    }
    const el = host.getSlotEl(syntheticFor(dockKey, value));
    if (el) {
      res[value] = el;
    }
  }
  return res;
});

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
  const topBar = topMinimized.value ? MINIMIZED_BAR_HEIGHT + "px" : FULL_BAR_HEIGHT + "px";
  if (!isSplit.value) {
    if (!topMinimized.value || props.hideTabs) {
      return undefined;
    }
    return `grid-template-rows: ${topBar} 1fr;`;
  }
  const bottomBar = bottomMinimized.value ? MINIMIZED_BAR_HEIGHT + "px" : FULL_BAR_HEIGHT + "px";
  const top = Math.round(splitRatio.value * 1000) / 1000;
  const bottom = Math.round((1 - splitRatio.value) * 1000) / 1000;
  return `grid-template-rows: ${topBar} minmax(0, ${top}fr) calc(var(--gap) - 2px) ${bottomBar} minmax(0, ${bottom}fr);`;
});

const ghostStyle = computed(() => {
  if (!drag.value) {
    return undefined;
  }
  return { left: (drag.value.x + 12) + "px", top: (drag.value.y + 12) + "px" };
});

const visibleValues = computed(() => {
  const res = [];
  if (activeTop.value !== undefined && !isSynthetic(activeTop.value)) {
    res.push(activeTop.value);
  }
  if (isSplit.value && activeBottom.value !== undefined && !isSynthetic(activeBottom.value)) {
    res.push(activeBottom.value);
  }
  for (const [value, b] of borrowedAway.value) {
    const host = dockWidgets.get(b.hostKey);
    if (host && host.isValueVisible(syntheticFor(dockKey, value))) {
      res.push(value);
    }
  }
  return res;
});

const dockHandle = markRaw({
  acceptsBorrows() {
    return !props.hideTabs && props.items.length > 0;
  },
  item(value) {
    return props.items.find(i => i.value == value);
  },
  getSlotEl(value) {
    return hostSlotEls[value];
  },
  isValueVisible(value) {
    return activeTop.value == value ||
      (isSplit.value && activeBottom.value == value);
  },
  showValue(value) {
    if (bottomSet.value.has(value) && isSplit.value) {
      activeBottom.value = value;
    } else {
      setActiveTop(value);
    }
  },
  receiveBorrow(value, region) {
    if (region == "bottom" && isSplit.value) {
      if (!bottomValues.value.includes(value)) {
        bottomValues.value = [...bottomValues.value, value];
      }
      activeBottom.value = value;
    } else {
      bottomValues.value = bottomValues.value.filter(v => v != value);
      activeTop.value = value;
    }
  },
  notifyClose(value) {
    const item = props.items.find(i => i.value == value);
    if (item) {
      emit("onClose", item);
    }
  },
  containsPoint(x, y) {
    if (!containerEl.value) {
      return false;
    }
    const c = containerEl.value.getBoundingClientRect();
    return x >= c.left && x <= c.right && y >= c.top && y <= c.bottom;
  },
  dropZone(x, y) {
    if (props.hideTabs || !props.items.length || !containerEl.value) {
      return null;
    }
    const c = containerEl.value.getBoundingClientRect();
    if (x < c.left || x > c.right || y < c.top || y > c.bottom) {
      return null;
    }
    let region = "top", top = c.top, bottom = c.bottom;
    if (isSplit.value && bottomBarEl.value) {
      const boundary = bottomBarEl.value.getBoundingClientRect().top;
      if (y >= boundary) {
        region = "bottom";
        top = boundary;
      } else {
        bottom = boundary;
      }
    }
    return {
      region: region,
      overlay: {
        top: (top - c.top) + "px",
        left: "0px",
        width: "100%",
        height: (bottom - top) + "px"
      }
    };
  }
});

onMounted(() => {
  dockWidgets.set(dockKey, dockHandle);
  if (props.items.length) {
    const v = activeItem.value;
    if (v !== undefined && bottomSet.value.has(v)) {
      activeBottom.value = v;
      setActiveTop(firstValue(topItems.value));
    } else if (v !== undefined && topItems.value.some(i => i.value == v)) {
      activeTop.value = v;
    } else {
      setActiveTop(firstValue(topItems.value));
    }
    if (bottomItems.value.length && !bottomSet.value.has(activeBottom.value)) {
      activeBottom.value = firstValue(bottomItems.value);
    }
  }
});

onUnmounted(() => {
  stopDrag();
  stopResize();
  dockWidgets.delete(dockKey);
  releaseDockKey(dockKey);
});

function firstValue(items) {
  return items.length ? items[0].value : undefined;
}

function notifyLayoutChanged() {
  nextTick(() => {
    window.dispatchEvent(new Event('resize'));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  });
}

function setActiveTop(value) {
  activeTop.value = value;
  if (value !== undefined && !isSynthetic(value)) {
    activeItem.value = value;
  }
}

function setHostSlot(value, el) {
  if (el) {
    hostSlotEls[value] = el;
  } else {
    delete hostSlotEls[value];
  }
}

function collapse(active) {
  bottomValues.value = [];
  activeBottom.value = undefined;
  if (active !== undefined) {
    setActiveTop(active);
  }
}

function borrowForHost(syntheticValue) {
  const parsed = parseSynthetic(syntheticValue);
  return dockBorrows.some(b => b.ownerKey == parsed.ownerKey &&
    b.value == parsed.value && b.hostKey == dockKey);
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

  if (state.topMinimized === true) {
    topMinimized.value = true;
  }
  if (state.bottomMinimized === true) {
    bottomMinimized.value = true;
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
      splitRatio: splitRatio.value,
      topMinimized: topMinimized.value,
      bottomMinimized: bottomMinimized.value
    }));
  } catch (e) {}
}

loadState();

watch(() => [bottomValues.value, activeBottom.value, splitRatio.value], () => {
  saveState();
});

watch(() => [topMinimized.value, bottomMinimized.value], () => {
  saveState();
  notifyLayoutChanged();
});

watch(isSplit, (split) => {
  if (!split) {
    bottomMinimized.value = false;
  }
});

watch(() => JSON.stringify(effectiveItems.value.map(i => i.value)), () => {
  const values = new Set(effectiveItems.value.map(i => i.value));
  bottomValues.value = bottomValues.value.filter(v =>
    values.has(v) || (isSynthetic(v) && borrowForHost(v)));

  const present = bottomValues.value.filter(v => values.has(v));

  if (!present.length) {
    activeBottom.value = undefined;
  } else if (present.length == values.size) {
    collapse(activeBottom.value);
  } else if (!present.includes(activeBottom.value)) {
    activeBottom.value = firstValue(bottomItems.value);
  }

  if (activeTop.value === undefined ||
    !topItems.value.some(i => i.value == activeTop.value))
  {
    setActiveTop(firstValue(topItems.value));
  }
});

watch(() => props.hideTabs, (hidden) => {
  if (hidden) {
    collapse(activeTop.value);
  }
});

watch(activeItem, (value) => {
  if (value === undefined || value === activeTop.value) {
    return;
  }
  const borrow = borrowedAway.value.get(value);
  if (borrow) {
    const host = dockWidgets.get(borrow.hostKey);
    if (host) {
      host.showValue(syntheticFor(dockKey, value));
    }
    return;
  }
  if (bottomSet.value.has(value) && isSplit.value) {
    activeBottom.value = value;
    activeItem.value = firstValue(topItems.value);
    return;
  }
  activeTop.value = value;
});

watch(() => JSON.stringify(visibleValues.value), () => {
  emit("visibleChanged", visibleValues.value);
  notifyLayoutChanged();
}, {immediate: true});

function onBarClick(evt, bottom) {
  const minimized = bottom ? bottomMinimized : topMinimized;
  if (minimized.value) {
    toggleBar(bottom, false);
    return;
  }
  if (evt.target.closest && evt.target.closest(".edit-tabs-button")) {
    return;
  }
  toggleBar(bottom, true);
}

function toggleBar(bottom, value) {
  const minimized = bottom ? bottomMinimized : topMinimized;
  if (minimized.value == value) {
    return;
  }

  if (isSplit.value && containerEl.value && topBarEl.value &&
    bottomBarEl.value && handleEl.value)
  {
    const c = containerEl.value.getBoundingClientRect();
    const topBar = topBarEl.value.getBoundingClientRect();
    const bottomBar = bottomBarEl.value.getBoundingClientRect();
    const handle = handleEl.value.getBoundingClientRect();
    const barHeight = bottom ? bottomBar.height : topBar.height;
    const newBarHeight = value ? MINIMIZED_BAR_HEIGHT : FULL_BAR_HEIGHT;
    const delta = barHeight - newBarHeight;
    const avail = c.height - topBar.height - bottomBar.height - handle.height;
    const newAvail = avail + delta;
    let top = splitRatio.value * avail;
    if (!bottom) {
      top += delta;
    }
    if (newAvail > 0) {
      splitRatio.value = Math.min(0.9, Math.max(0.1,
        Math.round((top / newAvail) * 1000) / 1000));
    }
  }

  minimized.value = value;
}

function tabBarCss(bottom) {
  let classes = ["edit-tabs-tabs"];
  if (bottom) {
    classes.push("edit-tabs-tabs-bottom");
  }
  if (bottom ? bottomMinimized.value : topMinimized.value) {
    classes.push("edit-tabs-tabs-minimized");
  }
  return classes;
}

function onTabPointerDown(evt, item, fromBottom) {
  if (evt.button !== 0) {
    return;
  }
  if (fromBottom ? bottomMinimized.value : topMinimized.value) {
    return;
  }
  if (effectiveItems.value.length < 2 && dockWidgets.size < 2) {
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
    targetKey: null,
    targetRegion: null
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
  d.targetKey = null;
  d.targetRegion = null;
  d.outside = false;
  sharedDrag.hostKey = null;
  sharedDrag.overlay = null;

  if (containerEl.value) {
    const c = containerEl.value.getBoundingClientRect();
    if (d.x >= c.left && d.x <= c.right && d.y >= c.top && d.y <= c.bottom) {
      if (!isSplit.value) {
        if (topItems.value.length < 2 || !topBarEl.value) {
          return;
        }
        const contentTop = topBarEl.value.getBoundingClientRect().bottom;
        const half = (c.bottom - contentTop) / 2;
        if (d.y >= contentTop + half) {
          d.target = "split";
          setSharedOverlay(c, contentTop + half, c.bottom);
        }
      } else {
        if (!bottomBarEl.value) {
          return;
        }
        const boundary = bottomBarEl.value.getBoundingClientRect().top;
        if (d.y < boundary) {
          if (d.fromBottom) {
            d.target = "top";
            setSharedOverlay(c, c.top, boundary);
          }
        } else if (!d.fromBottom) {
          d.target = "bottom";
          setSharedOverlay(c, boundary, c.bottom);
        }
      }
      return;
    }
  }

  for (const [key, widget] of dockWidgets) {
    if (key == dockKey) {
      continue;
    }
    const zone = widget.dropZone(d.x, d.y);
    if (!zone) {
      continue;
    }
    d.target = "dock";
    d.targetKey = key;
    d.targetRegion = zone.region;
    sharedDrag.hostKey = key;
    sharedDrag.overlay = zone.overlay;
    return;
  }

  d.outside = ![...dockWidgets.values()].some(w => w.containsPoint(d.x, d.y));
}

function setSharedOverlay(c, top, bottom) {
  sharedDrag.hostKey = dockKey;
  sharedDrag.overlay = {
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
      notifyLayoutChanged();
    } else if (d.outside && isSynthetic(d.value)) {
      const b = parseSynthetic(d.value);
      bottomValues.value = bottomValues.value.filter(v => v != d.value);
      removeBorrow(b.ownerKey, b.value);
      notifyLayoutChanged();
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
  sharedDrag.hostKey = null;
  sharedDrag.overlay = null;
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
  nextTick(() => {
    window.dispatchEvent(new Event('resize'));
  });
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
  notifyLayoutChanged();
}

function applyDrop(d) {
  if (d.target == "dock") {
    const host = dockWidgets.get(d.targetKey);
    if (!host) {
      return;
    }
    if (isSynthetic(d.value)) {
      const b = parseSynthetic(d.value);
      bottomValues.value = bottomValues.value.filter(v => v != d.value);
      if (b.ownerKey == d.targetKey) {
        removeBorrow(b.ownerKey, b.value);
        host.showValue(b.value);
      } else {
        addBorrow(b.ownerKey, b.value, d.targetKey);
        host.receiveBorrow(d.value, d.targetRegion);
      }
    } else {
      addBorrow(dockKey, d.value, d.targetKey);
      host.receiveBorrow(syntheticFor(dockKey, d.value), d.targetRegion);
    }
    return;
  }

  if (d.target == "split") {
    bottomValues.value = [d.value];
    activeBottom.value = d.value;
    if (activeTop.value == d.value) {
      setActiveTop(firstValue(topItems.value));
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
    if (bottomSet.value.has(activeTop.value)) {
      setActiveTop(firstValue(topItems.value));
    }
  } else if (d.target == "top") {
    bottomValues.value = bottomValues.value.filter(v => v != d.value);
    setActiveTop(d.value);
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

  const active = bottom ? activeBottom.value : activeTop.value;
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
  if (bottom ? bottomMinimized.value : topMinimized.value) {
    return;
  }
  if (suppressClick.value) {
    suppressClick.value = false;
    return;
  }
  if (bottom) {
    activeBottom.value = value;
  } else {
    setActiveTop(value);
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
      setActiveTop(prevItem.value);
    }
  }

  if (item.borrowOwner) {
    const owner = dockWidgets.get(item.borrowOwner);
    if (owner) {
      owner.notifyClose(item.borrowValue);
    }
    return;
  }

  emit("onClose", item);
}

function editContentCss(value) {
  const bottom = bottomSet.value.has(value);
  let classes = ["edit-tabs-tab"];
  classes.push(bottom ? "edit-tabs-tab-bottom" : "edit-tabs-tab-top");

  if (!borrowedAway.value.has(value)) {
    const active = bottom ? activeBottom.value : activeTop.value;
    if (value == active && (!bottom || isSplit.value)) {
      classes.push("selected");
    }
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
  grid-column: 1;
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

div.edit-tabs-borrow-content {
  display: contents;
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

div.edit-tabs-tabs-minimized {
  overflow: hidden;
  cursor: pointer;
  border-radius: 0px;
  background-color: var(--bg-button);
}

div.edit-tabs-tabs-minimized:hover {
  background-color: var(--bg-button-hover);
}

div.edit-tabs-tabs-minimized div.edit-tabs-tabs-line {
  display: none;
}

div.edit-tabs-tabs-minimized div.edit-tabs-button {
  background-color: transparent;
  border-color: rgba(0, 0, 0, 0);
}

div.edit-tabs-bar-catcher {
  z-index: 12;
  grid-column: 1;
  align-self: start;
  height: 8px;
  cursor: pointer;
}

div.edit-tabs-bar-catcher-top {
  grid-row: 2;
}

div.edit-tabs-bar-catcher-bottom {
  grid-row: 5;
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
