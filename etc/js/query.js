
Vue.component('query', {
  props: ['error'],
  mounted: function() {
    this.ldt = new TextareaDecorator( 
      document.getElementById('query-editor'), syntax_highlighter );
  },
  updated: function() {
    this.ldt.update();
  },
  data: function() {
    return {
      query: undefined,
      last_query: undefined,
      ldt: undefined
    }
  },
  methods: {
    changed: function(e) {
      if (this.query != this.last_query) {
        this.refresh();
      }
    },
    refresh: function() {
      this.$emit('changed', {query: this.query});
      this.last_query = this.query;
    },
    query_class() {
      if (this.error) {
        return "query-error";
      } else {
        return "query-ok";
      }
    },
    set_query(expr) {
      this.query = expr;
      this.$emit('changed', {query: expr});
    },
    get_query() {
      return this.query;
    },
    is_empty() {
      return this.query == undefined || this.query.length == 0;
    }
  },
  template: `
    <div class="ecs-query">
      <textarea ref="input" 
        id="query-editor"
        :class="query_class()" 
        v-model="query" 
        v-on:keyup="changed">
      </textarea>
    </div>
    `
});
