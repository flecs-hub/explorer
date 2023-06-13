<template>
  <textarea 
    id="plecs-editor" 
    class="editor-textarea" 
    autocorrect="off" 
    autocapitalize="off" 
    spellcheck="false" 
    v-model="code" 
    v-on:keyup="run"
    v-on:keydown.tab.prevent="tab_pressed($event)">
  </textarea>
</template>

<script>
  module.exports = {
    name: 'editor-textarea',
    mounted: function() {
      const el = document.getElementById('plecs-editor');
      this.ldt = new TextareaDecorator(el, syntax_highlighter );

      new Behave({
        textarea: el,
        replaceTab: true,
        softTabs: true,
        tabSize: 2,
        autoOpen: true,
        overwrite: true,
        autoStrip: true,
        autoIndent: true,
        fence: false
      });
    },
    updated: function() {
      this.ldt.update();
    },
    methods: {
      run() {      
        if (this.code != this.last_code) {
          app.run_code(this.code, (reply) => {
            this.$emit('changed', reply);
          });

          this.last_code = this.code;
        }
      },
      get_code() {
        return this.code;
      },
      set_code(code) {
        this.code = code;
        this.run();
      },
      tab_pressed (event) { }
    },
    data: function() {
      return {
        code: undefined,
        last_code: undefined,
        last_key_event: undefined,
        key_events_since_emit: 0,
      }
    },
    computed: {
      button_css: function() {
        if (this.code != this.last_ran) {
          return "editor-button-run";
        } else {
          return "editor-button-run button-disabled";
        }
      }
    },
  };
</script>

<style>
</style>
