<template>
  <div :class="wrapper_css">
    <div class="content-container">
      <detail-toggle ref="toggle"
          summary_toggle="true" 
          :collapse="collapse" 
          :show_detail="show_detail"
          v-model="expanded">
        <template v-slot:summary>
          <span class="content-summary" ref="summary">
            <slot name="summary"></slot>
            <span class="content-container-icon-close">
              <icon-button v-if="url"
                :icon="'feather:download'"
                :size="20"
                v-on:click.stop="evt_follow_link"
                v-tooltip="'REST endpoint'">
              </icon-button>

              <icon-button 
                v-if="closable"
                icon="feather:x"
                :size="20"
                v-on:click.stop="evt_close"
                v-tooltip="'close'">
              </icon-button>
            </span>
          </span>
        </template>
        <template v-slot:detail>
          <div :class="detail_css" ref="detail">
            <slot name="detail"></slot>
          </div>
        </template>
        <template v-slot:footer>
          <div :class="footer_css">
            <slot name="footer"></slot>
          </div>
        </template>
      </detail-toggle>
    </div>
  </div>
</template>

<script>
  module.exports = {
    name: 'content-container',
    props: {
      show_detail: { type: Boolean, required: false, default: true },
      collapse: { type: Boolean, required: false, default: true },
      no_padding: { type: Boolean, required: false },
      closable: { type: Boolean, required: false }
    },
    data: function() {
      return {
        closed: false,
        maximized: false,
        expanded: true,
        url: undefined
      }
    },
    methods: {
      open() {
        this.closed = false;
        this.$emit("panel-update");
      },
      close() {
        this.closed = true;
        this.$emit("panel-update");
      },
      is_closed() {
        return this.closed;
      },
      expand: function(arg) {
        this.$refs.toggle.expand(arg);
      },
      allow_toggle(e) {
        this.$refs.toggle.allow_toggle(e);
      },
      evt_close: function() {
        this.close();
        this.$emit('close');
      },
      evt_follow_link: function() {
        window.open(this.url, '_blank');
      },
      set_url: function(url) {
        this.url = url;
      }
    },
    computed: {
      wrapper_css: function() {
        let result = "content-container-wrapper content-container-wrapper-overflow";
        if (this.closed) {
          result += " disable";
        }
        return result;
      },
      detail_css: function() {
        let result = "content-detail ";
        if (!this.no_padding) {
          result += " content-detail-padding";
        }
        return result;
      },
      footer_css: function() {
        if (!this.expanded) {
          return "hidden";
        } else {
          return "";
        }
      }
    }
  };
</script>

<style>
div.content-container {
  position: relative;
}

div.content-container > div.detail-toggle > div.detail-toggle-summary {
  background-color: var(--panel-header-bg);
  transition: opacity 0.2s ease-in-out;
}

div.content-container > div.detail-toggle > div.detail-toggle-summary:hover {
  background-color: var(--panel-header-hover-bg);
}

div.content-container > div.detail-toggle > div.detail-toggle-summary:hover > span.icon:not(.icon-hide) > * {
  opacity: 0.7;
}

div.content-container > div.detail-toggle > div.detail-toggle-summary:hover > span.icon:not(.icon-hide):hover > * {
  opacity: 1;
}

div.content-container > div.detail-toggle > div.detail-toggle-detail {
  background-color: var(--panel-bg-secondary);
}

span.content-container-icon-close {
  position: absolute;
  right: 0px;
  padding-right: 5px;
  padding-left: 2px;
  background-color: var(--panel-header-bg);
}

span.content-summary {
  font-weight: 600;
  font-size: var(--text-fs-md);
  line-height: var(--text-lh-md);
  color: var(--secondary-text);
  width: calc(100% - 24px);
  /* 24px subtraction accounts for chevron space to left of content-summary */
  height: 30px;
  align-items: center;
  white-space: nowrap;
  z-index: 3;
}

div.content-detail {
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  max-width: 100%;
}

div.content-detail-padding {
  padding: 8px;
}

div.content-detail ecs-value {
  max-width: 150px;
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

div.content-status {
  padding: 0px;
  opacity: 0;
  transition: opacity 0.2s;
}

div.content-status-visible {
  display: flex;
  opacity: 1;
}

div.content-status-body {
  display: flex;
  background-color: var(--steel-transparent-80);
  color: var(--footer-text);
  width: calc(100% - 3px);
  margin-left: 3px;
  min-height: 30px;
  align-items: center;
}

div.content-status-error {
  background-color: var(--red);
}

span.content-status-text {
  position: relative;
  left: -10px; /* correct for icon padding */
}

</style>