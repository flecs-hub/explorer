
Vue.component('editor-textarea', {
  mounted: function() {
    this.ldt = new TextareaDecorator( 
      document.getElementById('plecs-editor'), syntax_highlighter );

    var editor = new Behave({
      textarea: document.getElementById('plecs-editor'),
      replaceTab: true,
      softTabs: true,
      tabSize: 2,
      autoOpen: true,
      overwrite: true,
      autoStrip: true,
      autoIndent: true,
      fence: false
    });

    var ldtbehave = this.ldt;

    // Behavejs' event listeners  override some of LDT's, so we use Behavehooks to hook LDT updating to Behavejs' event listeners.
    BehaveHooks.add('keydown', function(data){
      setTimeout(function(){
        ldtbehave.update();
      })
    });
    BehaveHooks.add('keyup', function(data){
      setTimeout(function(){
        ldtbehave.update();
      })
    });
    BehaveHooks.add('keypress', function(data){
      setTimeout(function(){
        ldtbehave.update();
      })
    });
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
      if (this.code != this.last_ran) {
        return "editor-button-run";
      } else {
        return "editor-button-run button-disabled";
      }
    }
  },
  template: `
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
    `
});

Vue.component('editor', {
  mounted: function() {
    this.$refs.container.expand(false);
  },
  methods: {
    run() {
      this.$refs.textarea.run();
    },
    get_code() {
      return this.$refs.textarea.get_code();
    },
    set_code(code) {
      this.$refs.textarea.set_code(code);
      if (code !== undefined && code.length) {
        this.$refs.container.expand();
      }
    }
  },
  template: `
    <content-container no_padding="true" overflow="true" ref="container">
      <template v-slot:summary>
        Editor
      </template>

      <template v-slot:detail>
        <div class="editor">
          <editor-textarea ref="textarea" v-on="$listeners">
          </editor-textarea>
        </div>
      </template>
    </content-container>
    `
});
