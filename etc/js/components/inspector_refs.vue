<template>
  <div>
    <div v-for="ref in refs">
      <div class="inspector-ref">
        <entity-hierarchy :entity_path="ref"></entity-hierarchy>
        <entity-reference :entity="ref" :show_name="true" :show_parent="false" 
          v-on="$listeners">
        </entity-reference>
      </div>
    </div>
  </div>
</template>
  
<script>
  module.exports = {
    name: "inspector-refs",
    props: {
      refs: { type: Array, required: true },
    }
  }
</script>
  
<style>
  div.inspector-ref {
    border-style: solid;
    border-width: 0px;
    border-bottom-width: 1px;
    border-color: var(--steel-700);
    font-size: var(--text-fs-md);
    color: var(--secondary-text);
    padding-top: 5px;
    padding-bottom: 5px;
    padding-left: 25px;
  }
</style>
  