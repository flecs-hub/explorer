<template>
  <content-container 
    :closable="true"
    v-on:panel-update="evt_panel_update" 
    ref="container">

    <template v-slot:summary>
      World statistics
    </template>
    <template v-slot:detail>
      <template v-if="remote_mode">
        <stats-period ref="period"></stats-period>
        <div v-for="(v, k) in results">
          <stat :name="k" :values="v"></stat>
        </div>
        <template v-if="Object.keys(results) == 0">
          <p>
            <span>
              Could not request statistics from application, make sure to update
              to the latest Flecs and import the flecs.monitor module!
            <span>
          </p>
          <p>
            In C:
          </p>
            <code>
              ECS_IMPORT(world, FlecsMonitor);
            </code>
          <p>
            In C++:
          </p>
            <code>
              world.import&lt;flecs::monitor&gt;();
            </code>
        </template>
      </template>
      <template v-else>
        <span>
          Connect to an application to see statistics.
        </span>
      </template>
    </template>
    <template v-slot:footer>
      <status :status="error" :kind="Status.Error">
      </status>
    </template>
  </content-container>
</template>

<script>
  module.exports = {
    name: "stats-world",
    mounted: function() {
      this.close(); // Closed by default
    },
    data: function() {
      return {
        results: {},
        error: undefined
      }
    },
    computed: {
      css() {
        let result = "stats-world";
        return result;
      },
      remote_mode() {
        return app.remote_mode;
      }
    },
    methods: {
      refresh() {
        if (!this.$refs.period || !this.$refs.period.period) {
          return;
        }
        
        if (this.$refs.container.is_closed()) {
          return;
        }

        app.request_stats('stats-world', "world", (reply) => {
          this.error = reply.error;
          if (this.error === undefined) {
            this.results = reply;
          }
        }, () => {
          this.error = "request for statistics failed";
          this.results = {};
        }, { period: this.$refs.period.period });
      },
      open() {
        this.$refs.container.open();
      },
      close() {
        this.$refs.container.close();
      },
      evt_panel_update() {
        this.$emit('panel-update');
      }
    }
  }
</script>

<style>

div.stats-world {
}

</style>
