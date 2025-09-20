<template>
  <div>
    <detail-toggle v-if="matchCount > 0">
      <template v-slot:summary>
        {{ moduleHeaderName(item.name) }}
      </template>
      <template v-slot:detail>
        <!-- Components -->
        <template v-for="elem in item.value.components">
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
            v-model:loading="loading"
            @selectEntity="onSelectEntity"
            @removeComponent="emit('removeComponent', elem.fullName)"
            v-if="matchesFilter(elem)">
          </entity-inspector-component>
        </template>

        <!-- Pairs -->
        <template v-for="elem in item.value.pairs">
          <entity-inspector-component 
            :conn="conn"
            :entity="entity"
            :name="elem.name"
            :fullName="elem.fullName"
            :key="elem.fullName"
            icon_src="symbol-interface"
            :targets="elem.value"
            :base="elem.base"
            v-model:loading="loading"
            @selectEntity="onSelectEntity"
            @removeComponent="emit('removeComponent', elem.fullName)"
            v-if="matchesFilter(elem)">
          </entity-inspector-component>
        </template>

        <!-- Tags -->
        <template v-for="elem in item.value.tags">
          <entity-inspector-component
            :conn="conn"
            :entity="entity"
            :name="elem.name"
            :fullName="elem.fullName"
            :key="elem.fullName"
            :base="elem.base"
            icon_src="tag"
            v-model:loading="loading"
            @selectEntity="onSelectEntity"
            @removeComponent="emit('removeComponent', elem.fullName)"
            v-if="matchesFilter(elem)">
          </entity-inspector-component>
        </template>
      </template>
    </detail-toggle>
  </div>
</template>

<script>
export default { name: "entity-inspector-module" }
</script>

<script setup>
import { defineEmits, defineProps, defineModel, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  entity: {type: String, required: true},
  item: {type: Object, required: true},
  type_info: {type: Object, required: true},
  filter: {type: String, required: false}
});

const emit = defineEmits(["selectEntity", "removeComponent"]);

const loading = defineModel("loading");

function moduleHeaderName(name) {
  if (!name || !name.length) {
    return "root";
  }
  return name.split(".").join(" > ");
}

function onSelectEntity(evt) {
  emit("selectEntity", evt);
}

function matchesFilter(elem) {
  if (!props.filter) {
    return true;
  }
  return elem.fullName.includes(props.filter);
}

const matchCount = computed(() => {
  const item = props.item.value;
  if (!props.filter) {
    let count = 0;
    if (item.components) {
      count += Object.keys(item.components).length;
    }
    if (item.pairs) {
      count += Object.keys(item.pairs).length;
    }
    if (item.tags) {
      count += Object.keys(item.tags).length;
    }
    return count;
  }

  let count = 0;
  if (item.components) {
    for (let elem of Object.values(item.components)) {
      if (matchesFilter(elem)) {
        count++;
      }
    }
  }

  if (item.pairs) {
    for (let elem of Object.values(item.pairs)) {
      if (matchesFilter(elem)) {
        count++;
      }
    }
  }

  if (item.tags) {
    for (let elem of Object.values(item.tags)) {
      if (matchesFilter(elem)) {
        count++;
      }
    }
  }

  return count;
});

</script>

<style scoped>

</style>
