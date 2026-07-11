<template>
  <div id="menu-bar" class="left-bar pane" ref="rootEl">
    <div v-if="indicator" :class="indicatorCss" :style="indicatorStyle"></div>
    <div class="menu-bar-items">
      <template v-for="item in items">
        <slot :name="item"></slot>
      </template>
    </div>
  </div>
</template>

<script>
export default { name: "menu-bar" };
</script>

<script setup>
import { defineProps, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  items: {type: Array, required: true},
  page: {type: String, required: false}
});

const rootEl = ref(null);
const indicator = ref(null);

function updateIndicator() {
  nextTick(() => {
    const root = rootEl.value;
    if (!root) {
      return;
    }
    const active = root.querySelector("div.menu-button-active");
    if (!active) {
      indicator.value = null;
      return;
    }
    const rootRect = root.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    indicator.value = {
      top: rect.top - rootRect.top + 6,
      height: rect.height - 12,
      animate: indicator.value !== null
    };
  });
}

watch(() => props.page, updateIndicator);

onMounted(() => {
  updateIndicator();
  window.addEventListener("resize", updateIndicator);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateIndicator);
});

const indicatorStyle = computed(() => {
  if (!indicator.value) {
    return "";
  }
  return `top: ${indicator.value.top}px; height: ${indicator.value.height}px;`;
});

const indicatorCss = computed(() => {
  let classes = ["menu-bar-indicator"];
  if (indicator.value && indicator.value.animate) {
    classes.push("menu-bar-indicator-animate");
  }
  return classes;
});

</script>

<style scoped>
#menu-bar {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius-medium);
}

div.menu-bar-items {
  padding: 0.25rem;
  padding-top: 0px;
  padding-left: 0.2rem;
}

div.menu-bar-indicator {
  position: absolute;
  left: 0px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background-color: var(--accent);
  z-index: 1;
  pointer-events: none;
}

div.menu-bar-indicator-animate {
  transition: top 0.12s cubic-bezier(0.4, 0, 0.2, 1),
              height 0.12s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
