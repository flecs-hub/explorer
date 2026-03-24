<template>
  <div>
    <template v-if="isArray(type, value)">
      <div class="prop-grid" :class="{'no-chevron': !hasComplexChildren}">
        <template v-for="(item, index) in value">
          <entity-inspector-kv
            :path="path + '[' + index + ']'"
            :keyname="String(index)"
            :value="item"
            :type="type[1]"
            :readonly="readonly"
            :showChevron="hasComplexChildren"
            @setValue="(evt) => emitArrayValue(evt, index)"
            @selectEntity="(evt) => emit('selectEntity', evt)">
          </entity-inspector-kv>
        </template>
      </div>
    </template>
    <template v-else-if="isObject(type, value)">
      <div class="prop-grid" :class="{'no-chevron': !hasComplexChildren}">
        <template v-for="(value, key) in value">
          <entity-inspector-kv
            :path="path + '.' + key"
            :keyname="key"
            :value="value"
            :type="type[key]"
            :readonly="readonly"
            :showChevron="hasComplexChildren"
            @setValue="(evt) => emit('setValue', evt)"
            @selectEntity="(evt) => emit('selectEntity', evt)">
          </entity-inspector-kv>
        </template>
      </div>
    </template>
    <template v-else>
      <entity-inspector-field
        :value="value"
        :type="type"
        :readonly="readonly"
        @setValue="(evt) => emit('setValue', evt)"
        @selectEntity="(evt) => emit('selectEntity', evt)">
      </entity-inspector-field>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-value" }
</script>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  path: {type: String, required: true},
  value: {required: true},
  type: {type: Object, required: true},
  readonly: {type: Boolean, required: true}
});

const emit = defineEmits(["setValue", "selectEntity"]);

const hasComplexChildren = computed(() => {
  if (Array.isArray(props.value)) {
    return props.value.some(v => typeof v === 'object' && v !== null);
  } else if (typeof props.value === 'object' && props.value !== null) {
    return Object.values(props.value).some(v => typeof v === 'object' && v !== null);
  }
  return false;
});

function emitArrayValue(evt, index) {
  const prefix = String(index);
  if (evt.hasOwnProperty("key")) {
    let subkey = evt.key;
    if (subkey === prefix) {
      emit('setValue', { key: `[${index}]`, value: evt.value });
    } else if (subkey.startsWith(prefix + '.')) {
      emit('setValue', { key: `[${index}].${subkey.slice(prefix.length + 1)}`, value: evt.value });
    }
  } else {
    emit('setValue', { key: `[${index}]`, value: evt.value });
  }
}

function isArray(type, value) {
  return Array.isArray(value);
}

function arrayElementType(type) {
  if (Array.isArray(type) && type[0] === "array") {
    return type[1];
  }
  return type;
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
  grid-template-columns: 16px auto 1fr;
}

div.prop-grid.no-chevron {
  grid-template-columns: auto 1fr;
}


</style>
