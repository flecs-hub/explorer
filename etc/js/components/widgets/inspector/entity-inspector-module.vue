<template>
  <div class="module">
    <div class="module-header noselect" @click="toggle">
      <expand-button
        :size="16" 
        :expand="expand">
      </expand-button>&nbsp;{{ moduleHeaderName(item.name) }}
    </div>
    <template v-if="expand">
      <!-- Components -->
      <entity-inspector-component
        :conn="conn"
        :entity="entity"
        :name="elem.name"
        :fullName="elem.fullName"
        :key="elem.fullName"
        icon_src="symbol-field"
        :value="elem.value"
        :type="type_info[elem.fullName]"
        :base="elem.base"
        v-for="elem in item.value.components">
      </entity-inspector-component>

      <!-- Pairs -->
      <entity-inspector-component 
        :conn="conn"
        :entity="entity"
        :name="elem.name"
        :fullName="elem.fullName"
        :key="elem.fullName"
        icon_src="symbol-interface"
        :targets="elem.value"
        :base="elem.base"
        v-for="elem in item.value.pairs">
      </entity-inspector-component>

      <!-- Tags -->
      <entity-inspector-component
        :conn="conn"
        :entity="entity"
        :name="elem.name"
        :fullName="elem.fullName"
        :key="elem.fullName"
        :base="elem.base"
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
  conn: {type: Object, required: true},
  entity: {type: String, required: true},
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

div.module {
  margin-bottom: 16px;
}

div.module-header {
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  color: var(--secondary-text);
  font-size: 0.9rem;
  padding: 3px;
  padding-left: 8px;
  margin-top: 4px;
  cursor: pointer;
}

</style>
