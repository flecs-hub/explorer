<template>

  <popover ref="popover" :element="element">
    <div class="popover-content">
      <div class="popover-title">
        <span><icon icon="feather:link" :size="12" /></span>
        <span>Link</span>
      </div>
      <div>
        <div class="input-group">
          <input ref="url_field" class="form-control" :value="url" @click="select_url_field" readonly>
          <icon-button icon="feather:copy" :size="24" v-tooltip="'Copy'" @click="copy_to_clipboard" />
        </div>
      </div>
    </div>
  </popover>

</template>

<script>
module.exports = {
  name: "url-popover",
  props: ['url'],
  components: {
    "popover": httpVueLoader("../../components/popover.vue"),
  },
  data() {
    return {
      element: undefined,
    }
  },
  methods: {
    show() {
      this.$refs.popover.show();
    },
    hide() {
      this.$refs.popover.hide();
    },
    select_url_field() {
      this.$refs.url_field.select();
    },
    copy_to_clipboard() {
      let type = "text/plain";
      let blob = new Blob([this.url], { type });
      let data = [new ClipboardItem({ [type]: blob })];
      navigator.clipboard.write(data);
      return;
    }
  },
  mounted() {
    this.element = this.$root.$refs.share_url_button;
  }
}
</script>

<style scoped>
.popover-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-control {
  flex: 1 1 auto;
  border: 1px solid var(--grey-700);
  border-radius: var(--br-2);
  background-color: transparent;
}

.form-control:focus {
  border-color: var(--color-acent-emphasis);
  outline: 3px solid var(--color-acent-emphasis-translucent);
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
</style>