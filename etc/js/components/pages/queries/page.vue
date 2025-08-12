<template>
  <div id="page-queries" :class="css">
    <pane-query
      v-model:app_params="app_params"
      :conn="conn"
      v-if="app_params.sidebar">
    </pane-query>

    <pane-inspect
      :app_params="app_params"
      :conn="conn"
      @selectEntity="selectEntity">
    </pane-inspect>

    <template v-if="showInspector">
      <pane-inspector
        :conn="conn"
        :app_params="app_params.queries"
        @abort="onAbort"
        @selectEntity="onSelectEntity">
      </pane-inspector>
    </template>
  </div>
</template>

<script>
export default { name: "page-queries" };
</script>

<script setup>
import { defineProps, defineModel, computed, ref } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_params: {type: Object, required: true},
});

const app_params = defineModel("app_params");
const selectedEntity = ref();

const css = computed(() => {
  let result = ["page-content"];

  let s = "panes";
  if (app_params.value.sidebar) {
    s += "-with-sidebar";
  }
  if (app_params.value.queries.path) {
    s += "-with-inspector";
  }

  result.push(s);

  return result;
});

const showInspector = computed(() => {
  return app_params.value.queries.path !== undefined;
});

function selectEntity(entity) {
  app_params.value.queries.path = entity;
}

function onAbort() {
  app_params.value.queries.path = undefined;
}

function onSelectEntity(path) {
  app_params.value.queries.path = path;
}

</script>

<style scoped>
#page-queries {
  display: grid;
  gap: var(--gap);
}

/* No editor, no inspector */
div.panes {
  grid-template-columns: calc(100% - var(--gap));
}

/* With editor, no inspector */
div.panes-with-sidebar {
  grid-template-columns: 500px calc(100% - 500px - var(--gap));
}

/* No editor, with inspector */
div.panes-with-inspector {
  grid-template-columns: 300px calc(100% - 800px - var(--gap)) calc(500px - var(--gap));
}

/* With editor, with inspector */
div.panes-with-sidebar-with-inspector {
  grid-template-columns: 300px calc(100% - 800px - var(--gap)) calc(500px - var(--gap));
}

div.page-content div.queries-left-pane {
  grid-column: 1;
  grid-row: 1;
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
}

div.page-content div.queries-right-pane {
  grid-row: 1;
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
}

@media screen and (max-width: 1400px) {
  div.panes-with-sidebar-with-inspector {
    grid-template-columns: 300px calc(100% - 700px - var(--gap)) calc(400px - var(--gap));
  }
}

@media screen and (max-width: 1200px) {
  div.panes-with-sidebar {
    grid-template-columns: 300px calc(100% - 300px - var(--gap));
  }
}

@media screen and (max-width: 1200px) {
  div.panes-with-sidebar-with-inspector {
    grid-template-columns: calc(100% - 400px) calc(400px - var(--gap));
    grid-template-rows: calc(30vh - var(--header-height) - var(--gap)) calc(70vh - var(--footer-height) - var(--gap));
  }

  div.panes-with-sidebar-with-inspector div.queries-left-pane {
    grid-column: 1;
    grid-row: 1;
    height: calc(30vh - - var(--header-height) - var(--gap));
  }

  div.panes-with-sidebar-with-inspector div.queries-right-pane {
    grid-column: 1;
    grid-row: 2;
    height: calc(70vh - var(--footer-height) - 3 * var(--gap));
  }

  div.panes-with-sidebar-with-inspector #pane-inspector {
    grid-column: 2;
    grid-row: 1 / 3;
    height: calc(100% - 2 * var(--gap));
  }

  div.panes-with-sidebar-with-inspector div.editor {
    grid-template-rows: calc(30vh - 7rem);
  }
}

@media screen and (max-width: 800px) {
  /* No query/inspector pane */
  div.panes {
    grid-template-columns: calc(100%);
    grid-template-rows: calc(100vh - var(--header-height) - var(--gap));
  }

  div.panes div.queries-right-pane {
    grid-column: 1;
    grid-row: 1;
  }

  /* With query pane */
  div.panes-with-sidebar {
    grid-template-columns: calc(100%);
    grid-template-rows: calc(30vh - var(--header-height) - var(--gap)) calc(70vh - var(--footer-height) - var(--gap));
  }

  div.panes-with-sidebar div.queries-left-pane {
    grid-column: 1;
    grid-row: 1;
    height: calc(30vh - var(--header-height) - 1.5 * var(--gap));
  }

  div.panes-with-sidebar div.queries-right-pane {
    grid-column: 1;
    grid-row: 2;
    height: calc(70vh - var(--footer-height) - 3 * var(--gap));
  }

  /* With inspector pane */
  div.panes-with-inspector {
    grid-template-columns: calc(100%);
    grid-template-rows: calc(50vh - var(--header-height) - var(--gap)) calc(50vh - var(--footer-height) - var(--gap));
  }

  div.panes-with-inspector #pane-inspector {
    grid-column: 1;
    grid-row: 2;
    height: calc(50vh - var(--header-height) - 2 * var(--gap));
  }

  div.panes-with-inspector div.queries-right-pane {
    grid-column: 1;
    grid-row: 1;
    height: calc(50vh - var(--footer-height) - 2.5 * var(--gap));
  }

  /* With query and inspector pane */
  div.panes-with-sidebar-with-inspector {
    grid-template-columns: calc(100%);
    grid-template-rows: 90px 
      calc(60vh - var(--header-height) - var(--footer-height) - 90px - var(--gap)) 
      calc(40vh - 4 * var(--gap))
  }

  div.panes-with-sidebar-with-inspector div.queries-left-pane {
    grid-column: 1;
    grid-row: 1;
    height: inherit;
  }

  div.panes-with-sidebar-with-inspector div.queries-right-pane {
    grid-column: 1;
    grid-row: 2;
    height: inherit;
  }

  div.panes-with-sidebar-with-inspector #pane-inspector {
    grid-column: 1;
    grid-row: 3;
    height: inherit;
  }
}

</style>

<style>
@media screen and (max-width: 1200px) {
  div.panes-with-sidebar-with-inspector div.editor {
    grid-template-rows: calc(30vh - var(--header-height) - var(--gap) - 4rem);
  }
}

@media screen and (max-width: 800px) {
  div.panes-with-sidebar div.editor {
    grid-template-rows: calc(30vh - 4rem);
  }

  div.panes-with-sidebar-with-inspector div.editor {
    grid-template-rows: calc(90px - 4rem);
  }
}
</style>
