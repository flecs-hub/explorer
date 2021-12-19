export default {
  name: 'annotative-gridline',
  props: {
    left: Number,
    unit: { type: String, default: "px"},
    label: String,
  },
  data: function() {
    return {
      label: this.label,
    }
  },
  mounted: function() {
    this.$el.style.left = this.left + this.unit;

    // setTimeout(() => {
    //   this.delete();
    // }, 2000);
  },
  methods: {
    delete: function() {
      // destroy the vue listeners, etc
      this.$destroy();

      // remove the element from the DOM
      this.$el.parentNode.removeChild(this.$el);
    }
  },
  template: `
  <template>
    <div class="annotative-gridline-container">
      <div class="annotative-gridline-vertical"></div>
      <div v-if="label" class="annotative-gridline-label">{{ label }}</div>
    </div>
  </template>`
}