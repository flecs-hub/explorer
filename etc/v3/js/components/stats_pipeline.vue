<template>
  <content-container 
    :closable="true"
    v-on:panel-update="evt_panel_update" 
    ref="container">

    <template v-slot:summary>
      Pipeline statistics
    </template>
    <template v-slot:detail>
      <stats-period ref="period"></stats-period>

      <div class="stats-charts stats-systems">
        <span class="top-level-stat">Systems&nbsp;</span><span class="top-level-stat-value">{{ system_count }}</span>
        <span class="top-level-stat">Sync points&nbsp;</span><span class="top-level-stat-value">{{ sync_count }}</span>
        <span class="top-level-stat top-level-toggle">Hide &lt; 1%&nbsp;<toggle-button v-model="hide_below_pct"></toggle-button></span>
        <module-filter :modules="modules"
          v-on:toggle="evt_module_toggle"></module-filter>

        <template v-for="(sys, i) in results">
          <template v-if="after_sync(i)">
            <div class="stats-merge-header">
              <template v-if="has_sync_info(i)">
                {{  sync_multi_threaded(i) }}, {{ sync_no_readonly(i) }}, {{ block_system_count(i) }}
              </template>
            </div>
          </template>
          <div :class="css_system(sys, i)" v-if="show_system(sys.name, i)">
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
              <div class="stats-system-charts">
                <div v-if="sys.time_spent">
                  <div class="stats-system-chart">
                    <stat-chart 
                      :zoom="1" 
                      :width="280"
                      :values="sys.time_spent"
                      :disabled="!valid">
                    </stat-chart>
                    <span class="noselect stats-chart-label">
                      Time spent (
                        {{get_system_time_avg(i)}}
                        {{(system_time_pct.system_pct[i] * 100).toFixed(0)}}%
                      )
                    </span>
                  </div>
                </div>
                <div v-if="sys.commands_enqueued">
                  <div class="stats-system-chart">
                    <stat-chart 
                      :zoom="1" 
                      :width="280"
                      :values="sys.commands_enqueued"
                      :disabled="!valid">
                    </stat-chart>
                    <span class="noselect stats-chart-label">
                      Commands enqueued
                    </span>
                  </div>
                </div>
                <div class="stats-sync-icon">
                  <icon icon="codicons:merge" :size="48" :rotate="180"></icon>
                </div>
              </div>
            </template>
          </div>
          <div v-else>
            <template v-if="!sys.name">
              <div class="stats-system stats-merge"></div>
            </template>
          </div>
        </template>
      </div>

      <!-- Explorer is connected to application but monitoring is not on -->
      <template v-if="error">
        <p>
          <span>
            Could not request statistics from application, make sure to update
            to the latest Flecs and import the flecs.monitor module!
          </span>
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
    <template v-slot:footer>
      <status :status="error">
      </status>
    </template>
  </content-container>
</template>

<script>
  module.exports = {
    name: "stats-pipeline",
    data: function() {
      return {
        results: [],
        module_visibility: {},
        error: undefined,
        hide_below_pct: false
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
          if (sys.time_spent == undefined) {
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
      },
      module_counts() {
        if (!this.results) {
          return [];
        }

        let modules = {sync: 0};
        for (let r of this.results) {
          let name = r.name;
          if (!name) {
            name = "sync";
          }

          const module_name = this.module_name(r.name);
          if (modules[module_name] === undefined) {
            modules[module_name] = 0;
          }
          modules[module_name] ++;
        }
        return modules;
      },
      modules() {
        let modules = [];

        for (let k in this.module_counts) {
          modules.push({name: k, count: this.module_counts[k]});
        }

        return modules;
      },
      module_labels() {
        let labels = [];
        for (let m of this.modules) {
          labels.push(this.module_label(m));
        }
        return labels;
      },
      system_count() {
        let count = 0;
        for (let r of this.results) {
          if (r.name == undefined) {
            continue;
          }
          count ++;
        }
        return count;
      },
      sync_count() {
        let count = 0;
        for (let r of this.results) {
          if (r.name != undefined) {
            continue;
          }
          count ++;
        }
        return count;
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
        }
        if (sys.time_spent) {
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
      },
      evt_module_toggle(evt) {
        this.module_visibility[evt.module] = evt.enabled;
        this.$forceUpdate();
      },
      module_name(system_name) {
        if (!system_name) {
          return "sync";
        }
        let result = system_name.split(".").slice(0, -1).join(".");
        if (result.length === 0) {
          result = "root";
        }
        return result;
      },
      module_count(module_name) {
        return this.module_counts[module_name];
      },
      module_label(module_name) {
        return module_name.replaceAll(".", " > ") + " (" + this.module_count(module_name) + ")";
      },
      show_system(system_name, i) {
        let module_name = this.module_name(system_name);
        if (this.module_visibility[module_name] === undefined) {
          this.module_visibility[module_name] = true;
        }
        let visibility = this.module_visibility[module_name];
        if (!visibility) {
          return false;
        }
        if (this.hide_below_pct) {
          const pct = this.system_time_pct.system_pct[i];
          if (pct < 0.01) {
            return false;
          }
        }
        return visibility;
      },
      after_sync(index) {
        if (index == 0) {
          return true;
        } else if (this.results[index - 1].name == undefined) {
          return true;
        } else {
          return false;
        }
      },
      next_sync(index) {
        let result = index;
        while (result < this.results.length) {
          if (this.results[result].name == undefined) {
            return result;
          }
          result ++;
        }
      },
      sync_multi_threaded(index) {
        index = this.next_sync(index);
        return this.results[index].multi_threaded ? "multi-threaded" : "single-threaded";
      },
      sync_no_readonly(index) {
        index = this.next_sync(index);
        return this.results[index].no_readonly ? "no_readonly" : "readonly";
      },
      block_system_count(index) {
        index = this.next_sync(index);
        let count = this.results[index].system_count;
        return count > 1 ? count + " systems" : count + " system";
      },
      has_sync_info(index) {
        index = this.next_sync(index);
        return this.results[index].multi_threaded !== undefined;
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

  width: 950px;
}

div.stats-merge {
  display: flex;
  border-style: none;
  justify-content: left;

  background-color: var(--panel-bg);

  border-style: solid;
  border-width: 0px;
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 15px;
  border-left-width: 10px;
  border-color: hsl(200, 54%, 15%);

  padding: 7px;
  padding-left: 15px;
  padding-top: 10px;
  padding-bottom: 15px;
  margin-bottom: 20px;

  width: 950px;
}

div.stats-merge-header {
  display: flex;
  border-style: none;
  justify-content: left;

  background-color: var(--panel-bg);
  color: var(--secondary-text);

  border-style: solid;
  border-width: 0px;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  border-left-width: 10px;
  border-color: hsl(200, 54%, 15%);

  padding: 7px;
  padding-left: 15px;
  padding-bottom: 15px;
  margin-top: 10px;
  margin-bottom: 5px;

  width: 950px;
}

.stats-sync-icon {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
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
  width: 100%;
}

div.stats-system-charts div {
  display: flex;
  flex-direction: column;
  margin-top: 2px;
  margin-right: 5px;
}

span.stats-chart-label {
  font-size: 13px;
  color: var(--steel-400);
  justify-content: center;
  margin-top: 2px;
}

span.top-level-stat {
  background-color: var(--steel-700);
  border-radius: 6px;
  border-top-right-radius: 0px;
  border-bottom-right-radius: 0px;
  color: var(--secondary-text);
  padding: 4px;
  padding-left: 8px;
  margin-bottom: 12px;
  height: 20px;
}

span.top-level-stat-value {
  background-color: var(--panel-bg);
  border-radius: 6px;
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
  color: var(--primary-text);
  padding: 4px;
  padding-left: 8px;
  padding-right: 8px;
  margin-bottom: 12px;
  height: 20px;
}

span.top-level-toggle {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

span.top-level-toggle .toggle-button {
  position: relative;
  top: -2px;
}

span.top-level-toggle svg {
  margin-right: 1px;
}

</style>
