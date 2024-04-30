<template>
  <content-container 
    ref="container"
    :show_detail="query_result != undefined"
    :no_padding="true"
    :closable="true"
    v-on:close="evt_close"
    v-on:panel-update="evt_panel_update">

    <template v-slot:summary>
      <query-editor
        ref="editor"
        :error="invalid_query"
        v-on:changed="change_query"
        v-on:allow-toggle="evt_allow_toggle"/>
    </template>

    <template v-slot:detail>
      <div class="query-graph-select">
        <icon-button icon="codicons:type-hierarchy" :size="20"
          v-on:click="toggle_graph_mode"
          v-if="!graph_mode" v-tooltip="'Toggle graph mode'"></icon-button>
        <icon-button icon="codicons:table" :size="20"
          v-on:click="toggle_graph_mode"
          v-if="graph_mode" v-tooltip="'Toggle graph mode'"></icon-button>
      </div>

      <template v-if="!graph_mode">
        <query-results 
          ref="results"
          v-if="query_result"
          :data="query_result" 
          :valid="is_valid"
          v-on="$listeners"/>
      </template>
      <template v-else>
        <query-graph
          :results="query_result"
          v-on="$listeners">
        </query-graph>
      </template>
    </template>

    <template v-slot:footer>
      <status :status="status"
        :kind="status_kind">
      </status>
      <query-footer ref="footer"
        :result="query_result"
        v-model="offset_limit"
        v-on:refresh="refresh">
      </query-footer>
    </template>
  </content-container>
</template>

<script>
  module.exports = {
    name: "query",
    props: ['valid'],
    data: function() {
      return {
        status: undefined,
        status_kind: undefined,
        query_result: undefined,
        error: false,
        invalid_query: false,
        request: undefined,
        graph_mode: false,
        offset_limit: {
          offset: undefined,
          limit: undefined
        }
      }
    },
    methods: {
      query_ok() {
        this.$emit('changed');
        this.status = undefined;
        this.status_kind = Status.Info;
        this.error = false;
        this.invalid_query = false;
      },
      query_error(msg) {
        this.$emit('changed');
        this.status = msg;
        this.status_kind = Status.Error;
        this.error = true;
      },
      invalid_query_error(msg) {
        this.query_error(msg);
        this.invalid_query = true;
      },
      // Query changed event
      evt_query_changed(query) {
        if (query) {
          let r = app.request_query('query', query, (reply) => {
            if (reply.error === undefined) {
              this.query_ok();
              if (this.query_result === undefined) {
                this.$refs.container.expand();
              }
              this.query_result = reply;
              this.eval_duration = reply.eval_duration;
            } else {
              this.invalid_query_error(reply.error);
            }
          }, (err_reply) => {
            if (err_reply) {
              this.invalid_query_error(err_reply.error);
            } else {
              this.query_error("request failed");
            }
          }, {
            term_ids: true,
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
            type_info: true,
            values: true
          });

          if (this.$refs.container) {
            this.$refs.container.set_url(r);
          }

          app.set_subtitle(this.query_name);
        } else {
          this.query_ok();
          this.query_result = undefined;
          app.set_subtitle();
          this.$refs.container.set_url(undefined);
        }
      },
      evt_allow_toggle(e) {
        this.$refs.container.allow_toggle(e);
      },
      refresh() {
        if (this.$refs.container.is_closed()) {
          return;
        }
        this.evt_query_changed(this.$refs.editor.get_query());
      },
      change_query() {
        this.refresh();
        if (this.$refs.results) {
          this.$refs.results.reset();
        }
      },
      get_query() {
        return this.$refs.editor.get_query();
      },
      get_query_params() {
        const query = this.get_query();
        if (!query) {
          return undefined;
        }

        let result;
        if (this.is_query_name) {
          const query_encoded = encodeURIComponent(query.slice(2).trim());
          result = "query_name=" + query_encoded;
          query_name = true;
        } else {
          const query_encoded = encodeURIComponent(query);
          result = "query=" + query_encoded;
        }

        if (this.offset !== undefined && this.offset != 0) {
          result += "&offset=" + this.offset;
        }

        if (this.limit !== undefined && this.limit != QUERY_DEFAULT_LIMIT) {
          result += "&limit=" + this.limit;
        }

        return result;
      },
      set_query(q, offset, limit) {
        this.$refs.editor.set_query(q);
        if (q !== undefined) {
          this.$refs.container.expand();
        } else if (this.request) {
          this.request.abort();
        }
        this.set_offset_limit(offset, limit);
      },
      set_offset_limit(offset, limit) {
        this.offset_limit.offset = offset;
        this.offset_limit.limit = limit;
        if (this.$refs.footer) {
          this.$refs.footer.set_offset_limit(offset, limit);
        }
      },
      get_error() {
        return this.query_error;
      },
      result_count() {
        return this.$refs.results.count();
      },
      open() {
        this.$refs.container.open();
      },
      close() {
        this.$refs.container.close();
      },
      evt_close() {
        this.set_query();
      },
      evt_panel_update() {
        this.$emit("panel-update");
      },
      toggle_graph_mode() {
        this.graph_mode = !this.graph_mode;
      }
    },
    computed: {
      count: function() {
        if (!this.query_result || !this.query_result.results) {
          return 0;
        }

        let result = 0;
        for (let i = 0; i < this.query_result.results.length; i ++) {
          const elem = this.query_result.results[i];
          if (elem.entities) {
            result += elem.entities.length;
          } else {
            result ++;
          }
        }
        return result;
      },
      page: function() {
        if (this.limit) {
          return Math.floor(this.offset / this.limit);
        } else {
          return 0;
        }
      },
      eval_time: function() {
        let t = this.eval_duration;
        let r;
        if (t < (1 / (1000 * 1000))) {
          r = Math.round(t * 1000 * 1000 * 1000) + "ns";
        } else if (t < (1 / (1000))) {
          r = Math.round(t * 1000 * 1000) + "us";
        } else if (t < 1) {
          r = Math.round(t * 1000) + "ms";
        } else {
          r = t + "s";
        }
        return r;
      },
      has_next: function() {
        return this.count == this.limit;
      },
      has_prev: function() {
        return this.offset != 0;
      },
      is_valid: function() {
        return this.valid && !this.error;
      },
      default_limit: function() {
        return QUERY_DEFAULT_LIMIT;
      },
      query_name: function() {
        let q = this.get_query();
        if (q.slice(0, 2) == "?-") {
          const name = q.slice(2).trim();
          const name_elems = name.split(".");
          return name_elems[name_elems.length - 1];
        } else {
          return;
        }
      },
      is_query_name: function(){
        const query = this.get_query();
        return query.slice(0, 2) == "?-";
      },
      offset: function() {
        return this.offset_limit.offset;
      },
      limit: function() {
        return this.offset_limit.limit;
      }
    }
  };
</script>

<style scoped>
  div.query-graph-select {
    position: absolute;
    top: 12px;
    right: 5px;
    z-index: 100;
    background-color: var(--panel-bg-secondary);
  }
</style>
