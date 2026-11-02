<template>
  <modal
    title="Add Component"
    width="420px"
    @ok="onOk"
    @cancel="onCancel">
    <div class="add-component-filter" ref="filterWrapper">
      <search-box v-model="filter"></search-box>
    </div>
    <div class="add-component-list">
      <prop-browser
        ref="browser"
        :conn="conn"
        :expr="filter"
        :first="''"
        :x="0"
        :y="0"
        docked
        builtin_last
        @select="onPropSelect">
      </prop-browser>
    </div>
    <div class="add-component-error" v-if="error">{{ error }}</div>
  </modal>
</template>

<script>
export default { name: "entity-inspector-add-component-modal" }
</script>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, defineProps, defineEmits } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  error: {type: String, required: false}
});

const emit = defineEmits(["submit", "cancel"]);

const filter = ref("");
const filterWrapper = ref(null);
const browser = ref(null);

function onPropSelect(evt) {
  const prop = evt.value;
  const path = prop.parent ? prop.parent + "." + prop.name : prop.name;
  emit("submit", path);
}

function submitFilter(kind) {
  const expr = filter.value.trim();
  if (expr[0] !== "(" && browser.value && browser.value.select(kind)) {
    return true;
  }
  if (expr.length) {
    emit("submit", expr);
    return true;
  }
  return false;
}

function onOk() {
  submitFilter("ok");
}

function onCancel() {
  emit("cancel");
}

function onKeydown(e) {
  if (e.key === "Enter") {
    if (submitFilter("enter")) {
      e.preventDefault();
    }
    return;
  }
  if (!browser.value) {
    return;
  }
  if (e.key === "ArrowDown") {
    if (browser.value.moveDown()) {
      e.preventDefault();
    }
  } else if (e.key === "ArrowUp") {
    if (browser.value.moveUp()) {
      e.preventDefault();
    }
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  nextTick(() => {
    if (filterWrapper.value) {
      const input = filterWrapper.value.querySelector("input");
      if (input) {
        input.focus();
      }
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});

</script>

<style scoped>

div.add-component-filter {
  padding: 0px 16px 12px 16px;
}

div.add-component-error {
  padding: 8px 16px;
  color: var(--bright-red);
  border-top: 1px solid var(--bg-content-alt);
  overflow-wrap: anywhere;
}

div.add-component-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-top: 1px solid var(--bg-content-alt);
}

</style>
