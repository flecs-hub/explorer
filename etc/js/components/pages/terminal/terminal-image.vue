<template>
  <div class="term-image">
    <div v-if="!loader" class="term-dim">{{ resource.content_type }} resource {{ resource.name }}: images can only be shown when connected to a running application</div>
    <img v-else-if="src" :src="src" :alt="label" :title="label" @click.stop="zoomIn" @error="fail('image could not be decoded')">
    <div v-else-if="error">
      <span class="term-error">error: </span><span class="term-error-msg">{{ error }} </span>
      <span class="term-more" @click.stop="load">retry</span>
    </div>
    <div v-else class="term-dim">loading image&hellip;</div>
    <teleport to="body" v-if="zoomed">
      <div class="term-image-zoom" @click.stop="zoomOut">
        <img :src="src" :alt="label">
      </div>
    </teleport>
  </div>
</template>

<script>
export default { name: "terminal-image" };
</script>

<script setup>
import { defineProps, computed, ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  resource: {type: Object, required: true},
  loader: {type: Function, required: false}
});

const RETRY_INTERVAL_MS = 250;
const TIMEOUT_MS = 30000;

const src = ref(undefined);
const error = ref(undefined);
const zoomed = ref(false);
let timer;
let deadline = 0;
let attemptId = 0;

const label = computed(() => `${props.resource.content_type} resource ${props.resource.name}`);

function onZoomKey(event) {
  if (event.key === "Escape") {
    event.stopPropagation();
    zoomOut();
  }
}

function zoomIn() {
  zoomed.value = true;
  window.addEventListener("keydown", onZoomKey, true);
}

function zoomOut() {
  zoomed.value = false;
  window.removeEventListener("keydown", onZoomKey, true);
}

function release() {
  zoomOut();
  clearTimeout(timer);
  if (src.value) {
    URL.revokeObjectURL(src.value);
    src.value = undefined;
  }
}

function fail(message) {
  release();
  error.value = message;
}

function attempt(id) {
  props.loader(
    (blob) => received(id, blob, false),
    (err) => received(id, undefined, !!err && err.status === 404));
}

function received(id, blob, gone) {
  if (id !== attemptId) {
    return;
  }
  if (blob && blob.size) {
    src.value = URL.createObjectURL(blob);
  } else if (gone) {
    fail("image is no longer available");
  } else if (Date.now() >= deadline) {
    fail("timed out waiting for image");
  } else {
    timer = setTimeout(() => attempt(id), RETRY_INTERVAL_MS);
  }
}

function load() {
  release();
  error.value = undefined;
  deadline = Date.now() + TIMEOUT_MS;
  attemptId ++;
  attempt(attemptId);
}

onMounted(() => {
  if (props.loader) {
    load();
  }
});

onUnmounted(() => {
  attemptId ++;
  release();
});
</script>

<style>
#terminal-pane div.term-image {
  padding-top: 6px;
}

#terminal-pane div.term-image img {
  display: block;
  box-sizing: border-box;
  max-width: 100%;
  max-height: 32rem;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-medium);
  cursor: zoom-in;
}

div.term-image-zoom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.8);
  cursor: zoom-out;
}

div.term-image-zoom img {
  box-sizing: border-box;
  max-width: 95%;
  max-height: 95%;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-medium);
}
</style>
