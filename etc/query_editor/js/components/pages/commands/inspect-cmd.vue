<template>
  <div :class="css">
    <span class="commands-cmd-icon">
      <icon :src="cmdIcon" :opacity="0.5"></icon>
    </span>
    <template v-if="cmd.system">
      <span class="commands-cmd-system">
        <entity-parent :path="cmd.system"></entity-parent>
      </span>
    </template>
    <template v-else>
      <entity-parent path="unknown source"></entity-parent>
    </template>
    <span class="commands-cmd-kind">
      {{ cmd.kind }}
      <template v-if="batched">
        <span>
          <span class="commands-cmd-batched">batched</span>
        </span>
      </template>
    </span>
    <template v-if="cmd.entity">
      <span class="commands-cmd-entity code-identifier">
        {{ cmd.entity }}
        <template v-if="!cmd.is_alive">
          <span class="commands-cmd-not-alive">not alive</span>
        </template>
      </span>
    </template>
    <template v-if="cmd.id">
      <span class="commands-cmd-id code-type">{{ cmd.id }}</span>
    </template>
  </div>
</template>

<script>
export default { name: "commands-inspect-cmd" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  cmd: {type: Object, required: true},
  index: {type: Number, required: true},
  batched: {type: Boolean, required: true}
});

const cmdIcon = computed(() => {
  return "issues";
});

const css = computed(() => {
  let classes = ["commands-cmd"]
  if (!(props.index % 2)) {
    classes.push("commands-cmd-alt");
  }
  return classes;
});

const liveliness = (cmd) => {
  return cmd.is_alive ? "alive" : "not alive";
}

</script>

<style scoped>

div.commands-cmd {
  display: grid;
  grid-template-columns: 2.0rem 300px 300px 1fr;
  grid-template-rows: 20px 20px;
  padding: 0.25rem;
  padding-left: 0.5rem;
  background-color: var(--bg-content);
}

div.commands-cmd span {
  display: flex;
  align-items: center;
}

div.commands-cmd-alt {
  background-color: var(--bg-content-alt);
}

span.commands-cmd-icon {
  grid-column: 1;
  grid-row: 1 / 3;
  margin-left: 0.25rem;
}

span.commands-cmd-system {
  grid-column: 2 / 4;
  grid-row: 1;
}

span.commands-cmd-kind {
  grid-column: 2;
  grid-row: 2;
  color: var(--primary-text);
}

span.commands-cmd-batched {
  padding: 0.1rem;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  border-radius: var(--border-radius-medium);
  font-weight: normal;
  font-size: 0.8rem;
  margin-left: 0.25rem;
  background-color: var(--purple);
  color: var(--dark-text);
  opacity: 0.7;
}

span.commands-cmd-not-alive {
  padding: 0.1rem;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  border-radius: var(--border-radius-medium);
  font-weight: normal;
  font-size: 0.8rem;
  margin-left: 0.25rem;
  background-color: var(--red);
  color: var(--dark-text);
  opacity: 0.7;
}

span.commands-cmd-is-alive {
  color: var(--secondary-text);
}

span.commands-cmd-entity {
  grid-column: 3;
  grid-row: 1 / 3;
  overflow: hidden;
}

span.commands-cmd-id {
  grid-column: 4;
  grid-row: 1 / 3;
  overflow: hidden;
}

</style>
