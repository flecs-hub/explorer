<template>
  <div class="layout-control">
    <button @click="onReset" title="Reset layout">
      <icon
        src="file"
        :opacity="0.7">
      </icon>
    </button>
    <button @click="onToggleSidebar" title="Toggle left pane">
      <icon
        :src="sidebarIcon"
        :opacity="0.7">
      </icon>
    </button>
    <button @click="onToggleInspector" title="Toggle right pane">
      <icon
        :src="inspectorIcon"
        :opacity="0.7">
      </icon>
    </button>
  </div>
</template>

<script>
export default { name: "layout-control" };
</script>

<script setup>
import { computed, defineModel, nextTick } from 'vue';

const app_params = defineModel("app_params");

const defaultLayout = {
  "flecs-explorer-tabs-tree": {
    bottomValues: ["Singletons", "Scripts"],
    activeTop: "Entities",
    activeBottom: "Singletons",
    splitRatio: 0.7,
    topMinimized: true,
    bottomMinimized: false
  },
  "flecs-explorer-tabs-content": {
    activeTop: "Scene"
  },
  "flecs-explorer-tabs-inspector-main": {
    activeTop: "Inspect"
  }
};

const sidebarIcon = computed(() => {
  if (app_params.value.sidebar) {
    return "layout-sidebar-left";
  } else {
    return "layout-sidebar-left-off";
  }
});

const inspectorIcon = computed(() => {
  if (app_params.value.inspector !== false) {
    return "layout-sidebar-right";
  } else {
    return "layout-sidebar-right-off";
  }
});

function onToggleSidebar() {
  app_params.value.sidebar = !app_params.value.sidebar;
}

function onToggleInspector() {
  app_params.value.inspector = app_params.value.inspector === false;
}

function onReset() {
  const remove = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key.startsWith("flecs-explorer-tabs-") ||
      key == "flecs-explorer-tab-borrows" ||
      key.endsWith(".leftPaneWidth") ||
      key.endsWith(".rightPaneWidth"))
    {
      remove.push(key);
    }
  }
  for (const key of remove) {
    window.localStorage.removeItem(key);
  }

  for (const key in defaultLayout) {
    window.localStorage.setItem(key, JSON.stringify(defaultLayout[key]));
  }

  const params = app_params.value;
  params.sidebar = true;
  params.inspector = true;
  params.entities.split = false;
  params.entities.split_path = undefined;
  params.entities.split_low_detail = false;
  params.entities.hsplit_main = false;
  params.entities.main2_path = undefined;
  params.entities.main2_low_detail = false;
  params.entities.split2 = false;
  params.entities.split2_path = undefined;
  params.entities.split2_low_detail = false;
  params.entities.low_detail = false;
  params.entities.active_inspector = "main";

  nextTick(() => window.location.reload());
}

</script>

<style scoped>
div.layout-control {
  display: flex;
  flex-direction: row;
  gap: 8px;
}
</style>
