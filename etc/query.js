
Vue.component('query', {
  props: ['error'],
  methods: {
    on_change: function(e) {
      this.$emit('changed', {query: e.target.value});
    },
    query_class() {
      if (this.error) {
        return "query-error";
      } else {
        return "query-ok";
      }
    },
    set_query(expr) {
      this.$refs.input.value = expr;
      this.$emit('changed', {query: expr});
    }
  },
  template: `
    <div class="ecs-query">
      <input ref="input" :class="query_class()" v-on:keyup="on_change">
      </input>
    </div>
    `
});
  