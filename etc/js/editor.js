
Vue.component('editor', {
  props: ['run_ok', 'run_error'],
  mounted: function() {
    this.ldt = new TextareaDecorator( 
      document.getElementById('plecs-editor'), syntax_highlighter );
  },
  updated: function() {
    this.ldt.update();
  },
  methods: {
    run() {
      if (this.code != this.last_code) {
        this.$emit('run-code', this.code);
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
      last_code: undefined
    }
  },
  computed: {
    button_css: function() {
      console.log(this.code);

      if (this.code != this.last_ran) {
        return "editor-button-run";
      } else {
        return "editor-button-run button-disabled";
      }
    }
  },
  template: `
    <div>

    <textarea 
      id="plecs-editor" 
      class="editor-textarea" 
      v-model="code" 
      v-on:keyup="run"
      v-on:keydown.tab.prevent="tab_pressed($event)">
    </textarea>



    </div>
    `
});
