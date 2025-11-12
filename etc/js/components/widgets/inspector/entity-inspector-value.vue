<template>
  <div>
    <template v-if="isArray(type, value)">
      <div class="array-list">
        <template v-for="(item, index) in value">
          <div class="array-item">
            <span class="array-index">{{ index }}:</span>
            <span class="array-value">{{ item }}</span>
          </div>
        </template>
      </div>
    </template>
    <template v-else-if="isObject(type, value)">
      <div class="prop-grid">
        <template v-for="(value, key) in value">
          <entity-inspector-kv
            :path="path + '.' + key"
            :keyname="key"
            :value="value"
            :type="type[key]"
            :readonly="readonly"
            @setValue="(evt) => emit('setValue', evt)">
          </entity-inspector-kv>
        </template>
      </div>
    </template>
    <template v-else>
      <entity-inspector-field
        :value="value"
        :type="type"
        :readonly="readonly"
        @setValue="(evt) => emit('setValue', evt)">
      </entity-inspector-field>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-value" }
</script>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  path: {type: String, required: true},
  value: {required: true},
  type: {type: Object, required: true},
  readonly: {type: Boolean, required: true}
});

const emit = defineEmits(["setValue"]);

function isArray(type, value) {
  if (type) {
    return Array.isArray(type);
  }
  return Array.isArray(value);
}

function isObject(type, value) {
  if (type) {
    if (Array.isArray(type)) {
      return false;
    } else {
      return (typeof type) === "object";
    }
  }
  return (typeof value) === "object" && !Array.isArray(value);
}

</script>

<style scoped>

div.prop-grid {
  display: grid;
  grid-template-columns: auto 1fr;
}

div.array-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

div.array-item {
  display: flex;
  gap: 8px;
  padding: 4px;
  background-color: var(--bg-content);
  border-radius: var(--border-radius-small);
}

span.array-index {
  color: var(--secondary-text);
  font-weight: 500;
  min-width: 2em;
}

span.array-value {
  color: var(--orange);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

</style>
