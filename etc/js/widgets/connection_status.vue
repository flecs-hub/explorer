<template>
  <div class="text-token noselect" 
    v-tooltip="'Connection settings'"
    v-on="$listeners"
  > 
    <span ref="content">
      <template v-if="state == 0">
        Initializing
      </template>
      <template v-else-if="state == 1">
        Not connected
      </template>
      <template v-else-if="state == 2">
        Connecting...
      </template>
      <template v-else-if="state == 3">
        <icon icon="feather:check" :size="14"></icon>
        Connected: {{ value }}
      </template>
      <template v-else-if="state == 4">
        Reconnecting
      </template>
      <template v-else-if="state == 5">
        Connection failed
      </template>
      <template v-else-if="state == 6">
        Disconnecting
      </template>
      <template v-else>
        Unknown error
      </template>
    </span>
  </div>
</template>

<script>
module.exports = {
  name: "experiment",
  props: {
    "value": { type: String },
    "connection": { type: Symbol, required: false },
    "retry_count": { type: Number, required: false },
  },
  data() {
    return {
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
    }
  },
  mounted() {
    let cwidth = this.$refs.content.offsetWidth;

    this.$el.style.width = cwidth;
    this.$el.style.height = this.$refs.content.offsetHeight;
  },
  updated() {
    this.$nextTick(() => {
      let cwidth = this.$refs.content.offsetWidth;
      this.$el.style.width = cwidth;
    })
  }
}
</script>

<style scoped>
.text-token {
  font-size: var(--text-fs-sm);
  line-height: var(--text-lh-sm);
  color: var(--secondary-text);

  background-color: var(--steel-650);

  padding: var(--p-1) var(--p-2);
  border-radius: var(--br-2);
  overflow: hidden;

  transition: all 0.12s ease-out;
  cursor: pointer;
}

.success-state {
  color: var(--light-green);
}

.text-token span {
  white-space: nowrap;
  gap: 2px;
  align-items: center;

}

.hide {

}
</style>