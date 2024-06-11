<template>
  <div class="commands-sync">
    <div class="commands-sync-header">
      <span class="commands-sync-icon">
        <icon src="merge" :size="25" :rotate="180"></icon>
      </span>
      <span class="commands-sync-title">
        merge #{{index + 1}}
      </span>
      <span class="commands-sync-stats">
        {{ sync.commands.length }} commands, 
        {{ entityCount }} entities, 
        {{ componentCount }} components,
        {{ duration }}
      </span>
    </div>
    <commands-inspect-cmd-header>
    </commands-inspect-cmd-header>
    <div class="commands-cmds-container">
      <commands-inspect-cmd
        :cmd="cmd" 
        :index="i"
        :batched="batchedCommands.has(i)"
        v-for="(cmd, i) in sync.commands">
      </commands-inspect-cmd>
    </div>
  </div>
</template>

<script>
export default { name: "commands-inspect-sync" };
</script>

<script setup>
import { defineProps, defineEmits, computed  } from 'vue';

const props = defineProps({
  sync: {type: Object, required: true},
  index: {type: Number, required: true}
});

const batchedCommands = computed(() => {
  const batchedSet = new Set();
  let i = 0;
  for (const cmd of props.sync.commands) {
    let next = cmd.next_for_entity;
    if (next < 0) {
      next *= -1;
    }
    if (cmd.next_for_entity && next > 0) {
      batchedSet.add(i);
      batchedSet.add(next);
    }
    i ++;
  }

  return batchedSet;
});

const entityCount = computed(() => {
  const entitySet = new Set();

  for (const cmd of props.sync.commands) {
    if (cmd.entity) {
      entitySet.add(cmd.entity);
    }
  }

  return entitySet.size;
});

const componentCount = computed(() => {
  const componentSet = new Set();

  for (const cmd of props.sync.commands) {
    if (cmd.id) {
      componentSet.add(cmd.id);
    }
  }

  return componentSet.size;
});

const duration = computed(() => {
  if (!props.sync.duration) {
    return "?";
  }

  return fmtDuration(props.sync.duration);
});

</script>

<style scoped>

div.commands-sync {
  padding: 0.5rem;
  padding-left: 0.0rem;
  padding-right: 0.0rem;
  margin-bottom: 0.5rem;
}

div.commands-cmds-container {
  border-radius: var(--border-radius-medium);
  overflow-x: auto;
}

div.commands-sync-header {
  display: grid;
  grid-template-columns: 2.0rem 1fr;
  grid-template-rows: 20px 20px;
  padding: 0.5rem;
  padding-bottom: 0.0rem;
}

span.commands-sync-icon {
  grid-column: 1;
  grid-row: 1 / 3;
}

span.commands-sync-title {
  grid-column: 2;
  grid-row: 1;
  margin: 0px;
  text-transform: uppercase;
  color: var(--secondary-text);
  font-weight: bold;
  font-size: 1rem;
}

span.commands-sync-stats {
  grid-column: 2;
  grid-row: 2;
  margin: 0px;
  color: var(--primary-text);
  font-size: 0.8rem;
}

</style>
