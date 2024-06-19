<template>
  <div class="commands-header pane">
    <div class="commands-header-label">
      <p>Commands</p>
    </div>

    <div class="commands-header-history">
      <commands-inspect-cmd-history
        :app_state="app_state">
      </commands-inspect-cmd-history>
    </div>

    <div class="commands-header-button">
      <button class="commands-capture-button"
        v-on:click="onCapture">
        capture
      </button>
    </div>
  </div>
</template>

<script>
export default { name: "commands-pane-header" };
</script>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true}
});

const emit = defineEmits(['capture'])

const onCapture = () => {
  emit('capture');
}

</script>

<style scoped>
div.commands-header {
  display: grid;
  grid-template-columns: 120px 1fr 95px;
  border-radius: var(--border-radius-medium);
  padding: 0.25rem;
  grid-row: 1;
}

div.commands-header p {
  margin: 0px;
  padding-left: 0.5rem;
  text-transform: uppercase;
  color: var(--secondary-text);
  font-weight: bold;
  font-size: 1rem;
}

div.commands-header div {

}

div.commands-header-label {
  grid-column: 1;
  display: flex;
  align-items: center;
  justify-content: left;
}

div.commands-header-history {
  grid-column: 2;
  margin-top: 0.25rem;
}

div.commands-header-button {
  grid-column: 3;
  display: flex;
  align-items: center;
  justify-content: right;
  margin-right: 0.25rem;
}

</style>
