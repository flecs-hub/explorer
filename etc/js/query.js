
Vue.component('query', {
  props: ['valid'],
  data: function() {
    return {
      query_result: undefined,
      query_error: undefined
    }
  },
  methods: {
    // Query changed event
    evt_query_changed(query) {
      if (query.length > 1) {
        app.request_query(query, (reply) => {
          this.query_error = reply.error;
          if (reply.error === undefined) {
            this.query_result = reply;
          }
          this.$emit('changed');
        });
      } else {
        this.query_result = undefined;
        this.query_error = undefined;
        this.$emit('changed');
      }
    },
    refresh() {
      this.evt_query_changed(this.$refs.editor.get_query());
    },
    get_query() {
      return this.$refs.editor.get_query();
    },
    set_query(q) {
      this.$refs.editor.set_query(q);
    },
    get_error() {
      return this.query_error;
    }
  },
  template: `
    <content-container :disable="query_result === undefined">
      <template v-slot:summary>
        Query&nbsp;&nbsp;<query-editor
          ref="editor"
          :error="query_error"
          v-on:changed="evt_query_changed"/>
      </template>

      <template v-slot:detail>
        <query-results 
          :data="query_result" 
          :valid="valid && query_error === undefined"
          v-on="$listeners"/>
      </template>
    </content-container>
    `
});
