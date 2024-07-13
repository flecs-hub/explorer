<template>
  <div class="layout-control">
    <button @click="onToggle">
      <icon 
        :src="buttonIcon"
        :opacity="0.7">
      </icon>
    </button>
  </div>
</template>

<script>
export default { name: "layout-control" };
</script>

<script setup>
import { computed, defineModel } from 'vue';

const app_params = defineModel("app_params");

const buttonIcon = computed(() => {
  if (app_params.value.sidebar) {
    return "layout-sidebar-left";
  } else {
    return "layout-sidebar-left-off";
  }
});

function onToggle() {
  app_params.value.sidebar = !app_params.value.sidebar;
}

</script>

<style scoped>
</style>
