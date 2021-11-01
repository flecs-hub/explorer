
Vue.component('query-editor', {
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
      query: "",
      last_query: undefined,
      ldt: undefined,
      focus: false
    }
  },
  methods: {
    changed: function(e) {
      if (this.query != this.last_query) {
        this.refresh();
      }
    },
    refresh: function() {
      this.$emit('changed', this.query);
      this.last_query = this.query;
    },
    set_query(expr) {
      this.query = expr;
      this.$emit('changed', expr);
    },
    get_query() {
      return this.query;
    },
    is_empty() {
      return this.query == undefined || this.query.length == 0;
    },
    evt_focus(focus) {
      this.focus = focus;
    }
  },
  computed: {
    query_class() {
      if (this.error) {
        return "ecs-query ecs-query-error";
      } else if (this.focus) {
        return "ecs-query ecs-query-ok";
      } else {
        return "ecs-query";
      }
    },
  },
  template: `
    <div :class="query_class">
      <textarea ref="input" 
        id="query-editor"
        v-model="query"
        v-on:click.stop 
        v-on:keyup="changed"
        v-on:focus="evt_focus(true)"
        v-on:blur="evt_focus(false)">
      </textarea>
    </div>
    `
});
