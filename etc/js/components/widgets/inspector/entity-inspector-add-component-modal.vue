<template>
  <Teleport to="body">
    <div class="add-component-modal-overlay" @click.self="onCancel">
      <div class="add-component-modal">
        <div class="add-component-modal-header noselect">Add Component</div>
        <div class="add-component-modal-filter" ref="filterWrapper">
          <search-box v-model="filter"></search-box>
        </div>
        <div class="add-component-modal-list">
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
        <div class="add-component-modal-actions">
          <button class="add-component-modal-cancel" @click="onCancel">Cancel</button>
          <button class="add-component-modal-ok" @click="onOk">OK</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
export default { name: "entity-inspector-add-component-modal" }
</script>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, defineProps, defineEmits } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true}
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

function onOk() {
  if (browser.value) {
    browser.value.select("ok");
  }
}

function onCancel() {
  emit("cancel");
}

function onKeydown(e) {
  if (!browser.value) {
    return;
  }
  if (e.key === "Enter") {
    if (browser.value.select("enter")) {
      e.preventDefault();
    }
  } else if (e.key === "Escape") {
    e.preventDefault();
    onCancel();
  } else if (e.key === "ArrowDown") {
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

div.add-component-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

div.add-component-modal {
  display: flex;
  flex-direction: column;
  width: 420px;
  max-width: calc(100vw - 32px);
  max-height: 70vh;
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

div.add-component-modal-header {
  padding: 12px 16px;
  font-size: 1.1em;
  font-weight: 500;
  color: var(--primary-text);
}

div.add-component-modal-filter {
  padding: 0px 16px 12px 16px;
}

div.add-component-modal-list {
  flex: 1;
  overflow-y: auto;
  border-top: 1px solid var(--bg-content-alt);
  border-bottom: 1px solid var(--bg-content-alt);
}

div.add-component-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
}

div.add-component-modal-actions button {
  text-transform: none;
  min-width: 80px;
}

button.add-component-modal-ok {
  background-color: var(--bg-ok);
  color: var(--primary-text);
}

</style>
