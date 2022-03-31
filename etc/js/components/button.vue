<template>
  <div class="icon-button noselect clickable" :title="tooltip" v-on="$listeners">
    <icon :icon="icon" :size="size / 1.2"></icon>
  </div>
</template>

<script>

/*
  CONTEXT
  Parent, Self

  STATES
  Unfocused -> Parent:hover -> Self:hover -> Self:active
*/

module.exports = {
  name: "icon-button",
  props: {
    size: { type: Number, required: false, default: 16 },
    icon: { type: String, required: true },
    tooltip: { type: String, required: false }
  },
  computed: {
    children() {
      return this.$children;
    }
  },
  mounted() {
    let dim_val = Math.round(this.size);
    this.$el.style.height = `${dim_val}px`;

    this.$el.style.width = `${dim_val}px`;
  }
}
</script>

<style>
.icon-button {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  border-radius: 4px;
  z-index: 1;
}

.icon-button {
  background-color: rgba(255, 255, 255, 0);
  opacity: 0.6;
  transition: all 0.2s ease;
}

.icon-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  opacity: 0.9;
}

.icon-button:active,
.icon-button:focus {
  background-color: rgba(255, 255, 255, 0.2);
  opacity: 1.0;
}
</style>