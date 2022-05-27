
Vue.component('query-editor', {
  props: ['error'],
  mounted: function() {
    this.ldt = new TextareaDecorator( 
      document.getElementById('query-editor'), syntax_highlighter);
  },
  updated: function() {
    this.ldt.update();
  },
  data: function() {
    return {
      query: "",
      actual_query: "",
      last_query: undefined,
      ldt: undefined,
      focus: false
    }
  },
  methods: {
    strip_newlines(query) {
      let q = query.replaceAll("\n ", " ");
      q = q.replaceAll(" \n", " ");
      q = q.replaceAll("\n", " ");
      return q;
    },
    changed: function(e) {
      if (this.query != this.last_query) {
        this.refresh();
      }
    },
    refresh: function() {
      if (this.focus) {
        this.actual_query = this.query;
      }
      this.$emit('changed', this.actual_query);
      this.last_query = this.query;
    },
    set_query(expr) {
      if (expr === undefined) {
        expr = "";
      }
      this.query = this.strip_newlines(expr);
      this.actual_query = expr;
      this.$emit('changed', expr);
    },
    get_query() {
      return this.actual_query;
    },
    is_empty() {
      return this.query == undefined || this.query.length == 0;
    },
    evt_focus(focus) {
      this.focus = focus;
      this.$emit('enable_toggle', !focus);

      if (focus) {
        this.query = this.actual_query;
      } else {
        this.actual_query = this.query;
        this.query = this.strip_newlines(this.query);
      }
    },
    set_focus() {
      this.$refs.input.focus();
      this.$refs.input.select();
    }
  },
  computed: {
    multiline() {
      return this.query.indexOf("\n") != -1;
    },
    query_class() {
      let result = "ecs-query";
      if (this.focus) {
        result += " ecs-query-focus";
        if (this.multiline) {
          result += " ecs-query-multiline";
        }
      }
      if (this.error) {
        result += " ecs-query-error";
      } else if (this.focus) {
        result += " ecs-query-ok";
      }
      if (!this.query.length) {
        result += " ecs-query-empty";
      }
      return result;
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
      <div class="query-default-text" v-if="!query.length" 
        v-on:click.stop="set_focus">Search</div>
      <div style="padding-left: 2px;">
        <icon-button icon="codicons:search" v-on:click.stop="set_focus" v-if="!focus"/>
      </div>
    </div>
    `
});
