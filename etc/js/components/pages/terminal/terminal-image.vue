<template>
  <div class="term-image">
    <div v-if="!url" class="term-dim">{{ resource.content_type }} resource {{ resource.name }}: images can only be shown when connected to a running application</div>
    <img v-else-if="src" :src="src" :alt="label" :title="label" @error="fail('image could not be decoded')">
    <div v-else-if="error">
      <span class="term-error">error: </span><span class="term-error-msg">{{ error }} </span>
      <span class="term-more" @click.stop="load">retry</span>
    </div>
    <div v-else class="term-dim">loading image&hellip;</div>
  </div>
</template>

<script>
export default { name: "terminal-image" };
</script>

<script setup>
import { defineProps, computed, ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  resource: {type: Object, required: true},
  url: {type: String, required: false}
});

const RETRY_INTERVAL_MS = 250;
const TIMEOUT_MS = 30000;

const src = ref(undefined);
const error = ref(undefined);
let timer;
let deadline = 0;
let attemptId = 0;

const label = computed(() => `${props.resource.content_type} resource ${props.resource.name}`);

function release() {
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

async function attempt(id) {
  let blob;
  let gone = false;
  try {
    const response = await fetch(props.url, { cache: "no-store" });
    gone = response.status === 404;
    if (response.ok) {
      blob = await response.blob();
    }
  } catch (e) {}

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
  if (props.url) {
    load();
  }
});

onUnmounted(() => {
  attemptId ++;
  release();
});
</script>

<style>
#terminal-pane div.term-image img {
  display: block;
  max-width: 100%;
  max-height: 32rem;
  cursor: default;
}
</style>
