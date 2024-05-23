<template>
  <div class="component">
    <div class="component-header noselect" @click="toggle">
      <template v-if="value">
        <div class="chevron-icon">
          <icon src="chevron-right" 
            :opacity="0.5" 
            :size="16" 
            :rotate="chevronRotation">
          </icon>
        </div>
      </template>
      <div class="component-icon">
        <icon :src="icon_src" :size="16" :opacity="0.5"></icon>
      </div>
      <div class="component-name">
        {{ name }}
        <template v-if="singleTarget">
          <icon src="arrow-right" 
            :opacity="0.5" 
            :size="16">
          </icon>&nbsp;{{ shortenEntity(targets) }}
        </template>
      </div>
    </div>
    <template v-if="expand && value">
      <div class="component-value">
        <entity-inspector-value
          :value="value"
          :type="type">
        </entity-inspector-value>
      </div>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-component" }
</script>

<script setup>
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  name: {type: String, required: true},
  icon_src: {type: String, required: true},
  value: {type: Object, required: false},
  type: {type: Object, required: false},
  targets: {required: false},
});

const expand = ref(true);

const chevronRotation = computed(() => {
  if (expand.value) {
    return 90;
  } else {
    return 0;
  }
})

function toggle() {
  expand.value = !expand.value;
}

const singleTarget = computed(() => {
  return props.targets && !Array.isArray(props.targets);
})

function shortenEntity(entity) {
  return entity.split(".").pop();
}

</script>

<style scoped>

div.component {
  margin-bottom: 8px;
}

div.component-header {
  display: grid;
  grid-template-columns: 20px 20px 1fr;
  padding: 4px;
  padding-left: 8px;
  cursor: pointer;
  border-radius: var(--border-radius-medium);
  background-color: rgba(0,0,0,0);
  color: var(--primary-text);
  transition: background-color 0.1s ease-out;
}

div.component-header:hover {
  background-color: var(--bg-content-hover);
}

div.chevron-icon {
  grid-column: 1;
}

div.component-icon {
  grid-column: 2;
}

div.component-name {
  grid-column: 3;
  padding-left: 2px;
}

div.component-value {
  padding-left: 52px;
}

</style>
