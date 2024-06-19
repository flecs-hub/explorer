<template>
  <div>
    <detail-toggle>
      <template v-slot:summary>
        {{ moduleHeaderName(item.name) }}
      </template>
      <template v-slot:detail>
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
    </detail-toggle>
  </div>
</template>

<script>
export default { name: "entity-inspector-module" }
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  entity: {type: String, required: true},
  item: {type: Object, required: true},
  type_info: {type: Object, required: true}
});

function moduleHeaderName(name) {
  if (!name || !name.length) {
    return "root";
  }
  return name.split(".").join(" > ");
}

</script>

<style scoped>

</style>
