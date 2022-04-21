<template>

  <popover ref="popover" :element="element">
    <div class="popover-content">
      <div class="popover-title">
        <span><icon icon="codicons:radio-tower" :size="14" /></span>
        <span>Application connection</span>
      </div>
      <div class="popover-description">
        Connect to a Flecs application on localhost or remotely.
      </div>

      <div>
        <tabs :tabs="['Local', 'Remote']" >
          <template v-slot:tab-1> 
            <div class="input-group">
              <div class="input-field-row">
                <input type="text" value="127.0.0.1" placeholder="Address" disabled  />
                <input type="text" class="port" v-model="port" placeholder="Port" />
              </div>
            </div>
          </template>
          <template v-slot:tab-2> 
            <div class="input-group">
              <div class="input-field-row">
                <input type="text" v-model="address" placeholder="Address"  />
                <input type="text" class="port" v-model="port" placeholder="Port" />
              </div>
            </div>
          </template>
        </tabs>
      </div>

      <div>
      <div class="control-row">
        <primary-button :label="button_label" @click="button_action"></primary-button>
      </div>
    </div>
  </popover>

</template>

<script>
module.exports = {
  name: "connection-popover",
  props: {
    "connection": { type: Symbol, required: false },
    "host": { type: String, required: false },
  },
  components: {
    "popover": httpVueLoader("../../components/popover.vue"),
  },
  data() {
    return {
      element: undefined,
      address: undefined,
      port: undefined,
      state: 0,
    }
  },
  watch: {
    connection(new_state) {
      switch (new_state){
        case ConnectionState.Initializing:
          this.state = 0;
          break;
        case ConnectionState.Local:
          this.state = 1;
          break;
        case ConnectionState.Connecting:
          this.state = 2;
          break;
        case ConnectionState.Remote:
          this.$el.classList.add("success-state");
          this.state = 3;
          setTimeout(()=>{
            this.$el.classList.remove("success-state");
          }, 500)
          break;
        case ConnectionState.RetryConnecting:
          this.state = 4;
          break;
        case ConnectionState.ConnectionFailed:
          this.state = 5;
          break;
        case ConnectionState.Disconnecting:
          this.state = 6;
          break;
        default:
          this.state = 5;
      }
    },
  },
  computed: {
    button_label() {
      if (this.connection == ConnectionState.Local) {
        return "Connect"
      } else if (this.connection == ConnectionState.Connecting) {
        return "Disconnect"
      } else if (this.connection == ConnectionState.RetryConnecting) {
        return "Disconnect"
      } else {
        return "Disconnect"
      }
    }
  },
  methods: {
    show() {
      this.$refs.popover.show();

      if (this.host) {
        let [address, port] = this.host.split(":");
        this.address = address;
        this.port = port;
      }
    },
    hide() {
      this.$refs.popover.hide();
    },
    select_url_field() {
      this.$refs.url_field.select();
    },
    button_action() {
      if (this.connection == ConnectionState.Local) {
        this.connect();
      } else {
        this.disconnect();
      }
    },
    connect() {
      console.log("Connecting now")
      const url = new URL(window.location);

      if (this.address) {
        url.searchParams.set("host", this.address);
      } else {
        url.searchParams.delete("host");
      }

      if (this.port) {
        url.searchParams.set("port", this.port);
      } else {
        url.searchParams.delete("port");
      }

      window.history.pushState({}, '', url);
      app.connect()
      // needs a way to disengage
    },
    disconnect() {
      app.disconnect();
    }
  },
  mounted() {
    this.element = app.$refs.connection_button.$el;
  }
}
</script>

<style scoped>
.popover-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.port {
  max-width: 25%;
}

.popover-title {
  font-size: var(--text-fs-md);
  line-height: var(--text-lh-md);
  font-weight: 600;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}

.popover-description {
  font-size: var(--text-fs-sm);
  line-height: var(--text-lh-sm);
  font-weight: 400;
  color: var(--secondary-text);
  white-space:normal;
}

.status-box {
  color: var(--tertiary-text);
  font-size: var(--text-fs-sm);
  line-height: var(--text-lh-sm);
  border-radius: var(--br-3);
  padding: var(--p-3);
}
</style>