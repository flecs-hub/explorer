
Vue.component('editor-textarea', {
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

    // Behavejs' event listeners  override some of LDT's, so we use Behavehooks 
    // to hook LDT updating to Behavejs' event listeners. BehaveHooks are only 
    // used when doc query commands are unsupported, to force ldt update.
    if (!document.queryCommandSupported('insertText')) {
      BehaveHooks.add('keydown', (data) => {
        setTimeout(() => {
          this.ldt.update();
        })
      });
      BehaveHooks.add('keypress', (data) => {
        setTimeout(function(){
          this.ldt.update();
        })
      });
    }
  },
  updated: function() {
    this.ldt.update();
  },
  methods: {
    run() {      
      if (this.code != this.last_code) {

        if(this.last_key_event) 
        {
          this.key_events_since_emit++;
          this.last_key_event = Date.now();

          var callback_time = 600;
          if (this.key_events_since_emit == 1) {
            // Make single, unchained key events feel fast
            callback_time = 250;
          }

          setTimeout(() => {
            var time_delta = Date.now() - this.last_key_event;
            if (
              time_delta >= 600
              || this.key_events_since_emit == 1 && time_delta >= 250
              ) {
              this.$emit('run-code', this.code); 
              this.key_events_since_emit = 0;
            }
          }, callback_time);
        } else {
          // First code set

          this.last_key_event = Date.now();
          this.$emit('run-code', this.code); 
        }
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
