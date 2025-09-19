<template>
  <div class="refresh-control">
    <button class="refresh-toggle" @click="toggle">{{ buttonText }}</button>
    <button :class="refreshButtonCss()">
      <icon 
        :src="buttonIcon" 
        :opacity="buttonIconOpacity" 
        @click="request"></icon>
    </button>
  </div>
</template>

<script>
export default { name: "refresh-control" };
</script>

<script setup>
import { defineProps, defineModel, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
});

const app_params = defineModel("app_params");

const autoRefresh = computed(() => {
  return app_params.value.refresh === "auto";
});

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
  if (app_params.value.refresh === "auto") {
    app_params.value.refresh = "manual";
  } else {
    app_params.value.refresh = "auto";
  }

  let poll_interval_ms = 1000;
  if (app_params.value.refresh !== "auto") {
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
