
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
  props: ["disable"],
  data: function() {
    return {
      status: undefined,
      status_kind: undefined
    }
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
    },
    evt_changed(msg) {
      if (msg && msg.error) {
        this.status = msg.error;
        this.status_kind = Status.Error;
      } else {
        this.status = undefined;
        this.status_kind = Status.Info;
      }
    },
    open: function() {
      this.$refs.container.open();
    },
    close: function() {
      this.$refs.container.close();
    },
    evt_panel_update: function() {
      this.$emit('panel-update');
    },
    evt_close() {
      this.evt_panel_update();
    }
  },
  watch: {
    disable: function() {
      this.$emit("panel-update");
    }
  },
  template: `
    <content-container 
      :no_padding="true" 
      overflow="true" 
      ref="container"
      :closable="true"
      v-on:close="evt_close"
      v-on:panel-update="evt_panel_update">

      <template v-slot:summary>
        Editor
      </template>

      <template v-slot:detail>
        <div class="editor">
          <editor-textarea ref="textarea" 
            v-on:changed="evt_changed">
          </editor-textarea>
        </div>
      </template>

      <template v-slot:footer>
        <status :status="status"
          :kind="status_kind">
        </status>
      </template>
    </content-container>
    `
});
