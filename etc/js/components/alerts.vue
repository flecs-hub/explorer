<template>
    <content-container 
      ref="container"
      :show_detail="result != undefined"
      :no_padding="true"
      :closable="true"
      v-on:close="evt_close"
      v-on:panel-update="evt_panel_update">

      <template v-slot:summary>
        Alerts
      </template>
      <template v-slot:detail>
        <query-results 
          ref="alerts_results"
          v-if="result"
          :data="result" 
          :valid="true"
          :show_this="false"
          :row_style="row_style"
          :column_style="column_style"
          v-on="$listeners"/>
      </template>
      <template v-slot:footer>
        <status :status="status"
          :kind="status_kind">
        </status>
        <query-footer ref="footer"
          :result="result"
          v-model="offset_limit"
          v-on:refresh="refresh">
        </query-footer>
      </template>
  </content-container>
</template>

<script>
  module.exports = {
    name: "alerts",
    data: function() {
      return {
        query: `
          flecs.metrics.Source, 
          flecs.alerts.Instance, 
          flecs.metrics.Value,
          $Severity(),
          (ChildOf, $Alert), 
          flecs.alerts.Alert($Alert, $Severity)`,
        result: null,
        request: undefined,
        status: undefined,
        status_kind: undefined,
        is_valid: false,
        offset_limit: {
          offset: undefined,
          limit: 0
        }
      };
    },
    methods: {
      query_ok() {
        this.status = undefined;
        this.status_kind = Status.Info;
        this.error = false;
        this.invalid_query = false;
      },
      query_error(msg) {
        this.status = msg;
        this.status_kind = Status.Error;
        this.error = true;
      },
      request_alerts() {
        let r = app.request_query('alert-query', this.query, (reply) => {
          if (reply.error === undefined) {
            this.result = reply;
            this.query_ok();
          } else {
            this.query_error(reply.error);
          }
        }, (err_reply) => {
          this.query_error(err_reply.error);
        }, {
          ids: true, 
          sources: false,
          entity_labels: true,
          entity_ids: true,
          variable_labels: true,
          type_info: true,
          sources: true,
          colors: true,
          offset: this.offset,
          limit: this.limit,
          duration: true,
          type_info: true
        });

        if (this.$refs.container) {
          this.$refs.container.set_url(r);
        }
      },
      open() {
        this.$refs.container.open();
        this.refresh();
      },
      close() {
        this.$refs.container.close();
      },
      refresh() {
        if (this.$refs.container.is_closed()) {
          return;
        }
        this.request_alerts();
      },
      evt_close() {
        this.set_query();
      },
      evt_panel_update() {
        this.$emit("panel-update");
      },
      set_query(q) {
        if (q !== undefined) {
          this.$refs.container.expand();
        } else if (this.request) {
          this.request.abort();
        }
      },
      row_style(columns, i) {
        const severity = columns.data.vars[0][i];
        let icon, background_color;
        if (severity === "flecs.alerts.Info") {
          icon = 'feather:info';
          background_color = 'var(--alert-info)';
        } else if (severity === "flecs.alerts.Warning") {
          icon = 'feather:alert-triangle';
          background_color = 'var(--alert-warning)';
        } else if (severity === "flecs.alerts.Error") {
          icon = 'feather:alert-octagon';
          background_color = 'var(--alert-error)';
        }
        return {
          icon: icon,
          background_color: background_color
        };
      }
    },
    computed: {
      offset: function() {
        if (this.$refs.footer) {
          return this.$refs.footer.offset;
        } else {
          return 0;
        }
      },
      limit: function() {
        if (this.$refs.footer) {
          return this.$refs.footer.limit;
        } else {
          return QUERY_DEFAULT_LIMIT
        }
      },
      column_style: function(){
        return [{
          name: 'Severity',
          style: 'min-width: 100px;'
        }, {
          name: 'Alert',
          style: 'min-width: 225px;'
        }, {
          name: 'Source',
          style: 'min-width: 175px;'
        }, {
          name: 'Message',
          style: 'min-width: 525px;'
        }, {
          name: 'Duration',
          type: {"value": ["float", {
            unit: "flecs.units.Duration.Seconds",
            symbol: "s",
            quantity: "time"
          }]}
        }];
      }
    }
  }

</script>

<style>
</style>
