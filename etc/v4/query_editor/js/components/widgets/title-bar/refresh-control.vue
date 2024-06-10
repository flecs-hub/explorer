<template>
  <div class="refresh-control">
    <button class="refresh-toggle" @click="toggle">{{ buttonText }}</button>
    <button :class="refreshButtonCss()">
      <icon 
        :src="buttonIcon" 
        :opacity="buttonIconOpacity" 
        :rotate="90"
        @click="request"></icon>
    </button>
  </div>
</template>

<script>
export default { name: "refresh-control" };
</script>

<script setup>
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
});

const autoRefresh = ref(true);

const buttonText = computed(() => {
  return autoRefresh.value ? "Auto refresh" : "Manual refresh";
});

const buttonIcon = computed(() => {
  return autoRefresh.value ? "circle-large" : "refresh";
});

const buttonIconOpacity = computed(() => {
  return autoRefresh.value ? 0.5 : 1.0;
})

function toggle() {
  autoRefresh.value = !autoRefresh.value;

  let poll_interval_ms = 1000;
  if (!autoRefresh.value) {
    poll_interval_ms = 0;
  }

  props.conn.set_managed_params({ poll_interval_ms });
}

function request() {
  if (!autoRefresh.value) {
    props.conn.request_managed();
  }
}

function refreshButtonCss() {
  let classes = ["refresh-button"];
  if (autoRefresh.value) {
    classes.push("refresh-button-disabled");
  }
  return classes;
}

</script>

<style scoped>

button {
  background-color: var(--bg-button-alt);
  font-weight: normal;
  color: var(--primary-text);
}

div.refresh-control {
  display: grid;
  grid-template-columns: 125px 40px;
  grid-template-rows: var(--header-height);
  gap: var(--gap);
  height: 100%;
}

button.refresh-toggle {
  grid-column: 1;
  grid-row: 1;
}

button.refresh-button {
  grid-column: 2;
  grid-row: 1;
}

button.refresh-button-disabled {
  cursor: default;
}

</style>
