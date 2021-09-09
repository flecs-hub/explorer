const example_query = "LocatedIn(_Author, _Location), Country(_Location), AuthorOf(_Author, _Framework)"

Vue.component('query', {
  props: ['error'],
  data: function() {
    return {
      query: example_query
    }
  },
  methods: {
    changed: function(e) {
      this.$emit('changed', {query: this.query});
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
      <input ref="input" :class="query_class()" v-model="query" v-on:keyup="changed">
      </input>
    </div>
    `
});
  