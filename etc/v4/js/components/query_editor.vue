<template>
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
      v-on:click.stop="set_focus">Enter query</div>
    <div style="padding-left: 2px;">
      <template v-if="!focus">
        <icon-button 
          icon="codicons:chrome-close" 
          v-on:click.stop="clear" 
          v-if="query && query.length"/>
        <icon-button 
          icon="codicons:search" 
          v-on:click.stop="set_focus"
          v-if="!query || !query.length"/>
      </template>
    </div>
  </div>
</template>

<script>
module.exports = {
  name: "query-editor",
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
      this.$emit('allow-toggle', !focus);
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
    },
    clear() {
      this.set_query("");
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
  }
};
</script>

<style>
  div.ecs-query {
    display: flex;
    align-items: center;
    
    padding-top: 2px;
    padding-left: 8px;
    margin-left: -5px; /* offset padding */

    font-family: Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    letter-spacing: 0.0px;
    font-size: 14;

    transition: background-color 0.2s;
    border-radius: 6px;
    border-width: 1px;
    border-style: solid;
    border-color: rgb(0, 0, 0, 0);

    color: var(--primary-text);
    max-width: calc(100% - 40px);
  }

  div.query-default-text {
    font-family: Inter, Helvetica, sans-serif;
    font-weight: 400;
    color: var(--primary-text);
    opacity: 0.5;
    cursor: pointer;
  }

  div.ecs-query div.ldt {
    min-width: 36px;
    max-width: 100%;
    min-height: 19px;
    overflow: hidden;
  }

  div.ecs-query-empty div.ldt {
    min-width: 1px;
  }

  div.ecs-query:hover {
    background-color: var(--light-hover-bg);
  }

  div.ecs-query pre, div.editor pre {
    min-height: 16px;
  }

  div.ecs-query-ok {
    transition: background-color 0s;
  }

  div.ecs-query-error span {
    color: var(--error) !important;
  }

  div.ecs-query-error div.ecs-query-focus {
    border-color: var(--red) !important;
  }

  div.ecs-query-focus {
    padding-top: 2px;
    transition: padding-top 0.2s;
    padding-right: 25px;
    background-color: #13151A !important;
  }

  div.ecs-query-multiline {
    border-color: #b4b4b4;
    border-style: solid;
    border-width: 2px;
    border-radius: 6px;
    padding-top: 5px;
    padding-left: 7px;
    padding-right: 40px;
    padding-bottom: 10px;
    box-shadow: 0px 0px 20px black;
    position: absolute;
    top: 3px;
  }
</style>
