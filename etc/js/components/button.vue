<template>
  <div class="button" v-on="$listeners">
    <span class="button-label" ref="content">
      {{ label }}
    </span>
  </div>
</template>

<script>
module.exports = {
  name: "primary-button",
  props: {
    label: {type: String, required: true }
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
.button {
  display: inline-block;
  background-color: var(--grey-700);
  padding: var(--p-2) var(--p-3);
  border-radius: var(--br-2);
  overflow: hidden;
  transition: all 0.12s ease-out;
}

.button:hover {
  background-color: var(--ui-blue);
  cursor: pointer;
}

.button-label {
  color: var(--primary-text);
  font-size: var(--text-fs-md);
  line-height: var(--text-lh-md);


  white-space: nowrap;
}
</style>