
Vue.component('query', {
  props: ['valid'],
  data: function() {
    return {
      status: undefined,
      status_kind: undefined,
      query_result: undefined,
      error: false,
      invalid_query: false,
      request: undefined
    }
  },
  methods: {
    query_ok(msg) {
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
      this.query_result = undefined;
    },
    // Query changed event
    evt_query_changed(query) {
      let r = this.request;
      if (r) {
        r.abort();
      }
      if (query) {
        this.request = app.request_query('query', query, (reply) => {
          if (reply.error === undefined) {
            this.query_ok();
            this.query_result = reply;
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
          ids: false, 
          subjects: false,
          entity_labels: true,
          variable_labels: true
        });
      } else {
        this.query_ok();
        this.query_result = undefined;
      }
    },
    evt_enable_toggle(e) {
      this.$refs.container.enable_toggle(e);
    },
    refresh() {
      this.evt_query_changed(this.$refs.editor.get_query());
    },
    get_query() {
      return this.$refs.editor.get_query();
    },
    set_query(q) {
      this.$refs.editor.set_query(q);
      if (q !== undefined) {
        this.$refs.container.expand();
      } else if (this.request) {
        this.request.abort();
      }
    },
    get_error() {
      return this.query_error;
    },
    evt_close() {
      this.set_query();
    },
    result_count() {
      return this.$refs.results.count();
    }
  },
  computed: {
    count: function() {
      if (!this.query_result) {
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
    }
  },
  template: `
    <content-container 
      ref="container"
      :disable="query_result === undefined && !invalid_query"
      :hidden="query_result === undefined"
      :no_padding="true"
      closable="true" 
      v-on:close="evt_close">

      <template v-slot:summary>
        <query-editor
          ref="editor"
          :error="invalid_query"
          v-on:changed="evt_query_changed"
          v-on:enable_toggle="evt_enable_toggle"/>



        <span class="content-container-icon-close">

          <icon-button 
            icon="feather:x"
            :size="20"
            v-show="!(query_result === undefined && !invalid_query)"
            v-on:click.stop="evt_close"
            v-tooltip="'Close'" />
        </span>
      </template>

      <template v-slot:detail>
        <query-results 
          ref="results"
          v-if="query_result"
          :data="query_result" 
          :valid="valid"
          v-on="$listeners"/>
      </template>

      <template v-slot:footer>
        <status :status="status"
          :kind="status_kind">
        </status>
      </template>
    </content-container>
    `
});
