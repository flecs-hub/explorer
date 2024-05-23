<template>
  <div>
    <template v-if="isObject(type, value)">
      <div class="prop-grid">
        <template v-for="(value, key) in value">
          <entity-inspector-kv
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
import { defineProps, defineEmits, ref, computed } from 'vue';

const props = defineProps({
  value: {required: true},
  type: {type: Object, required: true},
  readonly: {type: Boolean, required: true}
});

const emit = defineEmits(["setValue"]);

function isObject(type, value) {
  if (type) {
    if (Array.isArray(type)) {
      return false;
    } else {
      return (typeof type) === "object";
    }
  }
  return (typeof value) === "object";
}

</script>

<style scoped>

div.prop-grid {
  display: grid;
  grid-template-columns: auto 1fr;
}

</style>
