<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="onCancel">
      <div class="modal" :style="{ width }">
        <div class="modal-header noselect">{{ title }}</div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div class="modal-actions">
          <button class="modal-cancel" @click="onCancel">{{ cancelLabel }}</button>
          <button class="modal-ok" :disabled="okDisabled" @click="onOk">{{ okLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
export default { name: "modal" }
</script>

<script setup>
import { onMounted, onBeforeUnmount, defineProps, defineEmits } from 'vue';

const props = defineProps({
  title: {type: String, required: true},
  okLabel: {type: String, required: false, default: "OK"},
  cancelLabel: {type: String, required: false, default: "Cancel"},
  okDisabled: {type: Boolean, required: false, default: false},
  width: {type: String, required: false, default: "360px"}
});

const emit = defineEmits(["ok", "cancel"]);

function onOk() {
  if (props.okDisabled) {
    return;
  }
  emit("ok");
}

function onCancel() {
  emit("cancel");
}

function onKeydown(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    onCancel();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});

</script>

<style scoped>

div.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: modal-overlay-in 0.15s ease-out;
}

@keyframes modal-overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

div.modal {
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 32px);
  max-height: 70vh;
  background-color: var(--bg-pane);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-large);
  box-shadow: 0px 12px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: modal-in 0.16s cubic-bezier(0.2, 0.9, 0.3, 1);
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

div.modal-header {
  padding: 12px 16px;
  font-size: 1.1em;
  font-weight: 500;
  color: var(--primary-text);
}

div.modal-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

div.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--bg-content-alt);
}

div.modal-actions button {
  text-transform: none;
  min-width: 80px;
}

button.modal-ok {
  background-color: var(--bg-ok);
  color: var(--primary-text);
}

button.modal-ok:disabled {
  opacity: 0.5;
  cursor: default;
}

</style>
