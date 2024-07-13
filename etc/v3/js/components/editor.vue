<template>
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
      <div class="editor" v-on:click="request_focus">
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
</template>

<script>
  module.exports = {
    name: 'editor',
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
      },
      request_focus() {
        this.$emit("request-focus");
      }
    },
    watch: {
      disable: function() {
        this.$emit("panel-update");
      }
    }
  };
</script>
