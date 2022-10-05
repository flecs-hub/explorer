<template>
  <content-container 
    :closable="true"
    v-on:panel-update="evt_panel_update" 
    ref="container">

    <template v-slot:summary>
      Pipeline statistics
    </template>
    <template v-slot:detail>
      <template v-if="remote_mode">
        <stats-period ref="period"></stats-period>

        <div class="stats-charts stats-systems">
          <div :class="css_system(sys, i)" v-for="(sys, i) in results">
            <template v-if="sys.name">
              <entity-hierarchy :entity_path="sys.name"></entity-hierarchy>
              <entity-reference :entity="sys.name" :show_name="true" v-on="$listeners">
              </entity-reference>
              <div class="stats-system-charts">
                <div>
                  <div class="stats-system-chart">
                    <stat-chart 
                      :zoom="1" 
                      :width="280"
                      :values="sys.time_spent"
                      :disabled="!valid">
                    </stat-chart>
                    <span class="noselect stats-chart-label">
                      Time spent 
                      (
                        {{get_system_time_avg(i)}},
                        {{(system_time_pct.system_pct[i] * 100).toFixed(0)}}%
                      )
                    </span>
                  </div>
                </div>
                <div v-if="sys.matched_entity_count">
                  <div class="stats-system-chart">
                    <stat-chart
                      :zoom="1" 
                      :width="280"
                      :values="sys.matched_entity_count"
                      :disabled="!valid">
                    </stat-chart>
                    <span class="noselect stats-chart-label">
                      Matched entities
                      (
                        {{get_system_entities_avg(i)}}
                      )
                    </span>
                  </div>
                </div>
                <div v-if="sys.matched_table_count">
                  <div class="stats-system-chart">
                    <stat-chart 
                      :zoom="1" 
                      :width="280"
                      :values="sys.matched_table_count"
                      :disabled="!valid">
                    </stat-chart>
                    <span class="noselect stats-chart-label">
                      Matched tables
                      (
                        {{get_system_tables_avg(i)}}
                      )
                    </span>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <icon icon="codicons:merge" :size="36" :rotate="180"></icon>
            </template>
          </div>
        </div>

        <!-- Explorer is connected to application but monitoring is not on -->
        <template v-if="connected && error">
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

      <!-- Explorer is not connected to application -->
      <template v-else>
        <span>
          Connect to an application to see statistics.
        </span>
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
    name: "stats-pipeline",
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
        let result = "stats-pipeline";
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
      system_time_pct() {
        let result = [];
        let total = 0;

        for (const sys of this.results) {
          let sum = 0;
          if (sys.name == undefined) {
            result.push(0);
            continue;
          }

          for (const t of sys.time_spent.avg) {
            sum += t;
          }

          result.push(sum);
          total += sum;
        }

        for (let i = 0; i < result.length; i ++) {
          const sum = result[i];
          result[i] = sum / total;
        }

        return {system_pct: result, total: total};
      },
      system_entities() {
        let result = [];

        for (const sys of this.results) {
          let sum = 0;
          if (sys.matched_entity_count == undefined) {
            result.push(0);
            continue;
          }

          for (const t of sys.matched_entity_count.avg) {
            sum += t / 60;
          }

          result.push(sum);
        }

        return result;
      },
      system_tables() {
        let result = [];

        for (const sys of this.results) {
          let sum = 0;
          if (sys.matched_table_count == undefined) {
            result.push(0);
            continue;
          }

          for (const t of sys.matched_table_count.avg) {
            sum += t / 60;
          }

          result.push(sum);
        }

        return result;
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

        app.request_stats('stats-pipeline', "pipeline", (reply) => {
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
      css_system(sys, index) {
        let result = "stats-system";
        if (sys.name == undefined) {
            result += " stats-merge";
        } else {
          result += " " + this.system_impact_css(index);
        }
        return result;
      },
      get_system_time_pct(index) {
        return this.system_time_pct.system_pct[index];
      },
      get_system_time_avg(index) {
        const pct = this.system_time_pct;
        let result = (pct.system_pct[index] * pct.total) / 60;
        let unit = "s";
        if (result < 1) {
          result *= 1000;
          unit = "ms";
        }
        if (result < 1) {
          result *= 1000;
          unit = "us";
        }
        if (result < 1) {
          result *= 1000;
          unit = "ns";
        }
        return "" + result.toFixed(0) + unit;
      },
      get_system_entities_avg(index) {
        return Math.round(this.system_entities[index]).toFixed(0);
      },
      get_system_tables_avg(index) {
        return Math.round(this.system_tables[index]).toFixed(0);
      },
      system_impact_css(index) {
        const pct = this.get_system_time_pct(index);
        if (pct == 0) {
          return "";
        }
        if (pct < 0.001) {
          return "stats-system-impact-01";
        }

        let lbl = Math.round(pct * 20).toFixed(0) * 5;
        lbl = Math.max(lbl, 1);
        lbl = Math.min(lbl, 50);

        return "stats-system-impact-" + lbl;
      }
    }
  }
</script>

<style scoped>

div.stats-charts {
  border-style: solid;
  border-width: 0px;
  border-top-width: 1px;
  border-color: #3f3f46;
  padding-top: 10px;
  margin-left: 10px;
  height: 100%;
  overflow-y: auto;
}

div.stats-system-chart {
  background-color: var(--panel-bg-secondary);
  border-color: var(--steel-700);
  border-width: 1px;
  border-style: solid;
  padding-top: 10px;
  padding-bottom: 5px;
  padding-left: 10px;
  padding-right: 10px;
}

div.stats-system {
  background-color: var(--panel-bg);

  border-style: solid;
  border-width: 0px;
  border-left-width: 10px;
  border-color: var(--steel-900);
  transition: 0.6s border-left-color ease;

  padding: 7px;
  padding-left: 15px;
  padding-bottom: 15px;
  margin-bottom: 5px;
}

div.stats-system-impact-01 {
  border-left-color: hsl(200, 54%, 15%);
}

div.stats-system-impact-1 {
  border-left-color: hsl(200, 54%, 22%);
}

div.stats-system-impact-5 {
  border-left-color: hsl(220, 54%, 30%);
}

div.stats-system-impact-10 {
  border-left-color: hsl(240, 54%, 32%);
}

div.stats-system-impact-15 {
  border-left-color: hsl(250, 54%, 34%);
}

div.stats-system-impact-20 {
  border-left-color: hsl(260, 54%, 34%);
}

div.stats-system-impact-25 {
  border-left-color: hsl(270, 54%, 34%);
}

div.stats-system-impact-30 {
  border-left-color: hsl(280, 54%, 34%);
}

div.stats-system-impact-35 {
  border-left-color: hsl(290, 54%, 34%);
}

div.stats-system-impact-40 {
  border-left-color: hsl(300, 54%, 34%);
}

div.stats-system-impact-45 {
  border-left-color: hsl(310, 54%, 36%);
}

div.stats-system-impact-50 {
  border-left-color: hsl(320, 54%, 36%);
}

div.stats-system-charts {
  display: flex;
  flex-direction: row;
}

div.stats-system-charts div {
  display: flex;
  flex-direction: column;
  margin-top: 2px;
  margin-right: 5px;
}

div.stats-merge {
  display: flex;
  background-color: var(--panel-bg-secondary);
  border-style: none;
  justify-content: center;
}

span.stats-chart-label {
  font-size: 13px;
  color: var(--steel-400);
  justify-content: center;
  margin-top: 2px;
}

</style>
