<template>
  <div class="module">
    <div class="module-header noselect" @click="toggle">
      <icon src="chevron-right" 
        :opacity="0.7" 
        :size="16" 
        :rotate="chevronRotation">
      </icon>&nbsp;{{ moduleHeaderName(item.name) }}
    </div>
    <template v-if="expand">
      <!-- Components -->
      <entity-inspector-component 
        :name="elem.name" 
        icon_src="symbol-field"
        :value="elem.value"
        :type="type_info[elem.fullName]"
        v-for="elem in item.value.components">
      </entity-inspector-component>

      <!-- Pairs -->
      <entity-inspector-component 
        :name="elem.name" 
        icon_src="symbol-interface"
        :targets="elem.value"
        v-for="elem in item.value.pairs">
      </entity-inspector-component>

      <!-- Tags -->
      <entity-inspector-component 
        :name="elem.name" 
        icon_src="tag"
        v-for="elem in item.value.tags">
      </entity-inspector-component>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-module" }
</script>

<script setup>
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  item: {type: Object, required: true},
  type_info: {type: Object, required: true}
});

const expand = ref(true);

const chevronRotation = computed(() => {
  if (expand.value) {
    return 90;
  } else {
    return 0;
  }
});

function toggle() {
  expand.value = !expand.value;
}

function moduleHeaderName(name) {
  if (!name || !name.length) {
    return "root";
  }
  return name.split(".").join(" > ");
}

</script>

<style scoped>

div.module-header {
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  color: var(--secondary-text);
  font-size: 0.9rem;
  padding: 3px;
  padding-left: 8px;
  margin-bottom: 4px;
  cursor: pointer;
}

</style>
