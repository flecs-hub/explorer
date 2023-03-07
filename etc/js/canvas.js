
  Vue.component('explorer-canvas', {
    data: function() {
      return {
        focus: false
      }
    },
    methods: {
      open: function() {
        this.$refs.container.open();
      },
      close: function() {
        this.$refs.container.close();
      },
      on_focus() {
        this.focus = !this.focus;
        if (capture_keyboard_events) {
          capture_keyboard_events(this.focus);
        }
        if (this.focus) {
          document.activeElement.blur()
        }
      },
      evt_panel_update() {
        this.$emit("panel-update");
      },
    },
    computed: {
      css() {
        let css = "explorer-canvas";
        if (this.focus) {
          css += " explorer-canvas-focus";
        }
        return css;
      }
    },
    template: `
        <content-container ref="container" :closable="true"
          v-on:panel-update="evt_panel_update">
          <template v-slot:summary>
            Canvas
          </template>
          <template v-slot:detail>
            <canvas id="canvas" :class="css" ref="canvas" v-on:click="on_focus">
            </canvas>
          </template>
        </content-container>
      `
  });
  