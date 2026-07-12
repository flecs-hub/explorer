<template>
  <div>
    <template v-if="isMap(type)">
      <div class="prop-grid" :class="{'no-chevron': !hasComplexChildren}">
        <template v-for="(item, key) in value">
          <entity-inspector-kv
            :path="path + '.' + key"
            :keyname="String(key)"
            :value="item"
            :type="mapValueType(type)"
            :readonly="readonly"
            :showChevron="hasComplexChildren"
            @setValue="(evt) => emit('setValue', evt)"
            @selectEntity="(evt) => emit('selectEntity', evt)">
          </entity-inspector-kv>
        </template>
      </div>
    </template>
    <template v-else-if="isValueType(type)">
      <div class="prop-grid" :class="{'no-chevron': !hasComplexChildren}">
        <entity-inspector-kv
          :path="path + '.' + valueTypeName()"
          :keyname="valueTypeName()"
          :value="valueTypeInner()"
          :type="inferType(valueTypeInner())"
          :readonly="readonly"
          :showChevron="hasComplexChildren"
          @setValue="(evt) => emit('setValue', evt)"
          @selectEntity="(evt) => emit('selectEntity', evt)">
        </entity-inspector-kv>
      </div>
    </template>
    <template v-else-if="isArray(type, value)">
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

function isMap(type) {
  return Array.isArray(type) && type[0] === "map";
}

function mapValueType(type) {
  return type[2];
}

function isValueType(type) {
  return Array.isArray(type) && type[0] === "value";
}

function valueTypeName() {
  if (props.value && typeof props.value === "object") {
    return Object.keys(props.value)[0];
  }
  return "";
}

function valueTypeInner() {
  const name = valueTypeName();
  if (name !== "") {
    return props.value[name];
  }
}

function inferType(value) {
  if (typeof value === "boolean") {
    return ["bool"];
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? ["int"] : ["float"];
  }
  if (Array.isArray(value)) {
    return ["array", value.length ? inferType(value[0]) : ["text"]];
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const key in value) {
      result[key] = inferType(value[key]);
    }
    return result;
  }
  return ["text"];
}

</script>

<style scoped>

div.prop-grid {
  display: grid;
  grid-template-columns: 16px minmax(0, max-content) minmax(60px, 1fr);
  min-width: 0;
}

div.prop-grid.no-chevron {
  grid-template-columns: minmax(0, max-content) minmax(60px, 1fr);
}


</style>
