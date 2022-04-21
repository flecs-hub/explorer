<template>

  <div class="tabs-container">
    <div class="tabs">
      <ul>
        <li v-for="(tab, index) in tabs" :key="index">
          <input
            role="tab"
            :id="`${index}`"
            type="radio"
            :name="`${index}-tab`"
            :value="index + 1"
            v-model="active_tab_index"
          />
          <label :for="`${index}`" v-text="tab">
        </li>
      </ul>
    </div>

    <div class="tabs-view" role="tabpanel">
      <template v-for="(tab, index) in tabs">
        <div :key="index" v-if="index + 1 === active_tab_index">
          <slot :name="`tab-${index + 1}`"></slot>
        </div>
      </template>
    </div>



  </div>  
</template>

<script>
module.exports = ({
  name: "tabs",
  props: {
    tabs: { type: Array, required: true }
  },
  computed: {
    slots() {
      return this.$slots;
    }
  },
  data() {
    return {
      active_tab_index: 1,
    }
  },
})
</script>

<style scoped>
.tabs-container {
  display: flex;
  flex-direction: column;
  gap: var(--p-4);
}

ul {
  list-style: none;
  display: flex;
  flex-direction: row;
  gap: var(--p-3);
}

input[role=tab] {
  /* Input is hidden; we want only the radio input for its XOR functionality for its toggle ability */
  display: none;
}

label {
  font-size: var(--text-fs-sm);
  line-height: var(--text-lh-sm);
  font-weight: 400;

  /* color: var(--secondary-text); */
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.12s ease-in-out;
}

label:hover {
  /* color: var(--primary-text); */
  border-color: var(--ui-blue-30);
}

input[role=tab]:checked + label {
  font-weight: 500;
  color: var(--primary-text);
  border-color: var(--ui-blue);
}
</style>