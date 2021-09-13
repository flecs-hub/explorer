const example_query = "ChildOf(_Planet, Sun), !GasGiant(_Planet), ChildOf(_Moon, _Planet), Satellite(_Moon)"

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
      <textarea ref="input" 
        id="query-editor"
        :class="query_class()" 
        v-model="query" 
        v-on:keyup="changed">
      </textarea>
    </div>
    `
});
  