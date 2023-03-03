const QueryDefaultLimit = 25;

Vue.component('query', {
  props: ['valid'],
  data: function() {
    return {
      status: undefined,
      status_kind: undefined,
      query_result: undefined,
      error: false,
      invalid_query: false,
      request: undefined,
      offset: 0,
      eval_duration: 0,
      limit: QueryDefaultLimit
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
          ids: false, 
          sources: false,
          entity_labels: true,
          entity_ids: true,
          variable_labels: true,
          type_info: true,
          colors: true,
          offset: this.offset,
          limit: this.limit,
          duration: true
        });

        app.set_subtitle(this.query_name);
      } else {
        this.query_ok();
        this.query_result = undefined;
        app.set_subtitle();
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
      this.offset = 0;
      this.refresh();
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
    on_prev() {
      this.offset -= this.limit;
      if (this.offset < 0) {
        this.offset = 0;
      }
      this.update_page();
      this.refresh();
    },
    on_next() {
      this.offset += this.limit;
      this.update_page();
      this.refresh();
    },
    on_limit(evt) {
      this.limit = parseInt(evt.target.value);
      if (!this.limit) {
        this.limit = QueryDefaultLimit;
      }
      this.update_page();
      this.refresh();
      evt.target.blur();
    },
    on_page(evt) {
      this.offset = parseInt(evt.target.value) * this.limit;
      this.refresh();
      evt.target.blur();
    },
    update_page() {
      this.$refs.page.value = Math.floor(this.offset / this.limit);
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
      return QueryDefaultLimit;
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
    }
  },
  template: `
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
        <query-results 
          ref="results"
          v-if="query_result"
          :data="query_result" 
          :valid="is_valid"
          v-on="$listeners"/>
      </template>

      <template v-slot:footer>
        <status :status="status"
          :kind="status_kind">
        </status>
        <template v-if="query_result && !invalid_query">
          <div class="query-results-stats">
            <span>Returned {{count}} entities in {{eval_time}}</span>
          </div>
          <div class="query-results-nav">
            <span class="noselect">Results</span> <input type="text" :placeholder="default_limit"
              v-on:keyup.enter="on_limit"
              v-on:blur="on_limit"></input>
            <span class="noselect">Page</span> <input type="text" :placeholder="0" ref="page"
              v-on:keyup.enter="on_page"
              v-on:blur="on_page"></input>
            <button :disabled="!has_prev" v-on:click="on_prev" class="noselect">
              Previous
            </button>
            <button :disabled="!has_next" v-on:click="on_next" class="noselect">
              Next
            </button>
          </div>
        </template>
      </template>
    </content-container>
    `
});
