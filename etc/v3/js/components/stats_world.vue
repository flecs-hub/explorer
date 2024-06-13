<template>
  <content-container 
    :closable="true"
    v-on:panel-update="evt_panel_update" 
    ref="container">

    <template v-slot:summary>
      World statistics
    </template>
    <template v-slot:detail>
      <stats-period ref="period"></stats-period>

      <div class="stats-groups">
        <div :class="group_css(i)" v-for="(group, k, i) in groups">
          <detail-toggle>
            <template v-slot:summary>
              <span class="stats-group-name">{{name_fmt(k)}}</span>
            </template>
            <template v-slot:detail>
              <div class="stats-group-stats">
                <template v-for="(v, k) in group">
                  <div>
                    <stat :name="k" :values="v" :valid="valid"></stat>
                  </div>
                </template>
              </div>
            </template>
          </detail-toggle>
        </div>
      </div>

      <!-- Explorer is connected to application but monitoring is not on -->
      <template v-if="error">
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
          ECS_IMPORT(world, FlecsStats);
        </code>
        <p>
          In C++:
        </p>
        <code>
          world.import&lt;flecs::monitor&gt;();
        </code>
      </template>
    </template>
    <template v-slot:footer>
      <status :status="error">
      </status>
    </template>
  </content-container>
</template>

<script>
  module.exports = {
    name: "stats-world",
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
      },
      connected() {
        return app.connection == ConnectionState.Remote;
      },
      valid() {
        return this.error === undefined;
      },
      groups() {
        let groups = {};

        for (const k in this.results) {
          const elems = k.split(".");
          let group;
          let stat;

          if (elems.length == 2) {
            group = elems[0];
            stat = elems[1];
          } else {
            // Backwards compatibility
            group = "";
            stat = k;
          }

          if (groups[group] === undefined) {
            groups[group] = {};
          }

          groups[group][stat] = this.results[k];
        }

        return groups;
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
      },
      name_fmt(name) {
        let str = name.replaceAll("_", " ");
        str = str.charAt(0).toUpperCase() + str.slice(1);
        return str;
      },
      group_css(index) {
        return "stats-group stats-group-color-" + (index % 2);
      }
    }
  }
</script>

<style scoped>
span.stats-group-name {
  font-weight: bold;
}

div.stats-group-stats {
  display: flex;
  flex-flow: row wrap;
  padding-left: 10px;
  padding-bottom: 10px;
}

div.stats-group {
  display: flex;
  background-color: var(--panel-bg);
  border-color: var(--panel-header-bg);
  border-style: solid;
  border-width: 0px;
  border-left-width: 10px;
  padding-top: 10px;
  padding-left: 5px;
  padding-bottom: 10px;
  margin-bottom: 5px;
}

div.stats-groups {
  border-style: solid;
  border-width: 0px;
  border-top-width: 1px;
  border-color: #3f3f46;
  padding-top: 10px;
  height: 100%;
  overflow-y: auto;
}

div.stats-group-color-0 {
  border-left-color: hsl(200, 54%, 15%);
}

div.stats-group-color-1 {
  border-left-color: hsl(200, 54%, 22%);
}

</style>
