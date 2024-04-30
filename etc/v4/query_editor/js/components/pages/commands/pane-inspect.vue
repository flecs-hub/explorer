<template>
  <div class="commands-inspect ace-github-dark">
    <div class="commands-inspect-container">
      <template v-if="syncs.length">
        <div class="commands-frame-header">
          <span class="commands-frame-title">Frame {{ frameId }}</span>
          <span class="commands-frame-stats">
            {{ syncCount }} merges,
            {{ commandCount }} commands,
            {{ entityCount }} entities, 
            {{ componentCount }} components,
            {{ duration }}
          </span>
        </div>
        <commands-inspect-sync 
          :sync="sync"
          :index="i"
          v-for="(sync, i) in syncs">
        </commands-inspect-sync>
      </template>
      <template v-else>
        <span class="commands-inspect-placeholder">
          ECS operations like add, remove, set, delete get enqueued as commands
          when they're called from systems and observers. To inspect commands 
          enqueued in the last frame, press "Capture".
        </span>
      </template>
    </div>
  </div>
</template>

<script>
export default { name: "commands-pane-inspect" };
</script>

<script setup>
import { defineProps, defineExpose, computed, ref } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true}
});

const commandData = ref();
const frameId = ref();

const syncs = computed(() => {
  if (commandData.value) {
    return commandData.value.syncs;
  } else {
    return [];
  }
});

const syncCount = computed(() => {
  return syncs.value.length;
})

const commandCount = computed(() => {
  let result = 0;

  for (const sync of syncs.value) {
    result += sync.commands.length;
  }

  return result;
});

const entityCount = computed(() => {
  const entitySet = new Set();

  for (const sync of syncs.value) {
    for (const cmd of sync.commands) {
      if (cmd.entity) {
        entitySet.add(cmd.entity);
      }
    }
  }

  return entitySet.size;
});

const componentCount = computed(() => {
  const componentSet = new Set();

  for (const sync of syncs.value) {
    for (const cmd of sync.commands) {
      if (cmd.id) {
        componentSet.add(cmd.id);
      }
    }
  }

  return componentSet.size;
});

const duration = computed(() => {
  let result = 0;
  for (const sync of syncs.value) {
    if (sync.duration) {
      result += sync.duration;
    }
  }
  return fmtDuration(result);
});

const requestCapture = () => {
  props.conn.request("commands/capture", {},
    (msg) => {
      requestFrame(msg.frame);
    },
    (err) => {
      console.error("failed to request commands");
    }); 
}

const requestFrame = (frame) => {
  props.conn.request("commands/frame/" + frame, {},
    (msg) => {
      commandData.value = msg;
      frameId.value = frame;
    },
    (err) => {
      console.error("failed to request command frame");
    }); 
}

defineExpose({
  requestCapture
});

</script>

<style scoped>
div.commands-inspect {
  display: grid;
  border-radius: var(--border-radius-medium);
  padding: 0.5rem;
  grid-row: 2;
}

div.commands-frame-header {
  display: grid;
  grid-template-columns: 2.0rem 1fr;
  grid-template-rows: 20px 20px;
  padding: 0.5rem;
  padding-bottom: 0.5rem;
}

span.commands-frame-title {
  grid-column: 2;
  grid-row: 1;
  margin: 0px;
  text-transform: uppercase;
  color: var(--secondary-text);
  font-weight: bold;
  font-size: 1rem;
}

span.commands-frame-stats {
  grid-column: 2;
  grid-row: 2;
  margin: 0px;
  color: var(--primary-text);
  font-size: 0.8rem;
}

div.commands-inspect-container {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  width: 100%;
  height: 100%;
}

span.commands-inspect-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  max-height: 400px;
  text-align: center;
  padding-left: 25px;
  padding-right: 25px;
}

</style>
