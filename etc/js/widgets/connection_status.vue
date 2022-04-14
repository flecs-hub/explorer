<template>
  <div class="text-token noselect" 
    v-tooltip="'Flecs application connection'"
    v-on="$listeners"
  > 
    <span ref="content">

      <template v-if="state == 0">
        <icon icon="codicons:circle-outline" :size="12"></icon>
        Initializing
      </template>
      <template v-else-if="state == 1">
        <icon icon="codicons:circle-outline" :size="12"></icon>
        Not connected
      </template>
      <template v-else-if="state == 2">
        <icon icon="codicons:circle-outline" :size="12"></icon>
        Connecting...
      </template>
      <template v-else-if="state == 3">
        <icon icon="codicons:circle-filled" :size="12" class="connected_icon ok"></icon>
        Connected 
        <icon icon="feather:arrow-right" :size="14"></icon>
        {{ value }}
      </template>
      <template v-else-if="state == 4">
        <icon icon="codicons:circle-outline" :size="12"></icon>
        Reconnecting
      </template>
      <template v-else-if="state == 5">
        <icon icon="codicons:circle-outline" :size="12"></icon>
        Connection failed
      </template>
      <template v-else-if="state == 6">
        <icon icon="codicons:circle-outline" :size="12"></icon>
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
  font-size: var(--text-fs-md);
  line-height: var(--text-lh-md);
  color: var(--secondary-text);



  padding: var(--p-1) var(--p-2);
  border-radius: var(--br-2);
  overflow: hidden;

  transition: all 0.12s ease-out;
  cursor: pointer;
}

.text-token:hover { 
  color: var(--primary-text);
  background-color: rgba(255, 255, 255, 0.1);
}

.text-token:focus,
.text-token:active { 
  color: var(--primary-text);
  background-color: rgba(255, 255, 255, 0.2);
}

.success-state {
  color: var(--light-green);
}

.text-token span {
  white-space: nowrap;
  gap: 2px;
  align-items: center;

}

.connected_icon {
  animation-duration: 1.2s;
  animation-name: connected_glow;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

@keyframes connected_glow {
  from {
    color: inherit;
  }

  to {
    color: var(--green);
  }
}
</style>