const example_query = "ChildOf(_Planet, Sun), !DwarfPlanet(_Planet), ChildOf(_Moon, _Planet), Satellite(_Moon)"

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
      query: example_query,
      ldt: undefined
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
      this.query = expr;
      this.$emit('changed', {query: expr});
      // this.ldt.update();
    },
    get_query() {
      return this.query;
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
