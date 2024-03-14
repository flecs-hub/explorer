<template>
  <div class="title-bar">
    <div class="title-bar-logo">
      <a
        class="flecs-logo" 
        href="https://github.com/SanderMertens/flecs" 
        target="_blank">
      </a>
    </div>
    <div class="title-info title-info-left" v-if="connected">
      <div class="title-version">
        {{ version }}
      </div>
    </div>

    <div class="title-info title-info-right" v-if="connected">
      <div :class="`title-config title-config-${config}-bg`">{{ config }}</div>
    </div>
    <div class="title-info title-info-right" v-if="connected">
      <div :class="`title-config title-config-${config}-bg-border`">{{ config }}</div>
    </div>
    <div class="title-info title-info-right" v-if="connected">
      <div :class="`title-config title-config-${config}`">{{ config }}</div>
    </div>

    <url-bar
      :app_state="app_state">
    </url-bar>
  </div>
</template>

<script>
export default { name: "title-bar" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  app_state: {type: Object, required: true},
});

const worldSummary = computed(() => {
  const app_state = props.app_state;
  if (app_state && app_state.worldInfo && app_state.worldInfo.values) {
    let i = 0;
    for (const i = 0; i < app_state.worldInfo.ids.length; i ++) {
      const el = app_state.worldInfo.ids[i];
      if (el == "flecs.monitor.WorldSummary") {
        return app_state.worldInfo.values[i];
      }
    }
  }

  return {};
});

const version = computed(() => {
  const bi = worldSummary.value.build_info;
  if (bi) {
    return bi.version;
  } else {
    return "3.x.x";
  }
});

const config = computed(() => {
  const bi = worldSummary.value.build_info;
  if (bi) {
    if (bi.sanitize) {
      return "sanitize";
    } else if (bi.debug) {
      return "debug";
    } else {
      return "release";
    }
  } else {
    return undefined;
  }
});

const connected = computed(() => {
  return props.app_state.status == flecs.ConnectionStatus.Connected;
});

</script>

<style scoped>
div.title-bar {
  display: grid;
  grid-template-columns: 2.5rem 1fr 30rem 1fr 2.5rem;
  grid-column: 2 / 4;
  grid-row: 2;
}

div.title-bar-logo a {
  grid-column: 1;
}

div.title-bar-logo {
  display: grid;
  grid-template-columns: 1fr;
  grid-column: 1;
  padding: 3px;
}

div.title-info {
  display: flex;
  align-items: center;
}

div.title-info-left {
  grid-column: 2;
}

div.title-info-right {
  grid-column: 4;
  position: absolute;
  top: calc(0.7rem - 1px);
  right: 0.7rem;
}

div.title-version {
  padding-top: 0.1rem;
  margin-left: 0.5rem;
  width: 50px;
  color: var(--secondary-text);
  text-align: center;
}

div.title-config {
  margin: 0px;
  margin-left: 1rem;
  padding: 0.3rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  border-radius: var(--border-radius-large);
  border-style: solid;
  border-width: 1px;
  border-color: rgba(0,0,0,0);
  height: 20px;
  color: var(--secondary-text);
  text-align: center;
  opacity: 0.7;
}

div.title-config-release {
  color: var(--green);
}

div.title-config-release-bg {
  background-color: var(--green);
  opacity: 0.075;
}

div.title-config-debug {
  color: var(--orange);
}

div.title-config-debug-bg {
  background-color: var(--orange);
  opacity: 0.075;
}


div.title-config-sanitize {
  color: var(--red);
}

div.title-config-sanitize-bg {
  background-color: var(--red);
  opacity: 0.075;
}

@media screen and (max-width: 800px) {
  div.title-bar {
    grid-template-columns: 2.5rem 1fr 25rem 1fr 2.5rem;
    grid-column: 2 / 4;
  }

  div.title-version {
    display: none;
  }

  div.title-config {
    display: none;
  }
}

</style>
