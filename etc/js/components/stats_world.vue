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
      </template>
      <template v-else>
        <span>
          Connect to an application to see statistics.
        </span>
      </template>
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
          this.error = "request for stats failed";
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
