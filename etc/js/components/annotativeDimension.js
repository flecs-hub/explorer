export default {
  name: 'annotative-dimension',
  props: {
    start_point: Number,
    end_point: Number,
    unit: { type: String, default: "px" },
    label: String,
  },
  data: function() {
    return {
      label: this.label,
    }
  },
  mounted: function() {
    let left_point, right_point;

    if (this.start_point <= this.end_point) {
      left_point = this.start_point;
      right_point = this.end_point;
    } else {
      // Opposite
      left_point = this.end_point;
      right_point = this.start_point;
    }

    if (!this.label) {
      this.label = Math.abs(right_point - left_point) + " " + this.unit;
    }

    this.$el.style.left = left_point + this.unit;
    this.$el.style.width = (right_point - left_point) + this.unit; 

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
    <div class="annotative-dimension-container">
      <div v-if="label" class="annotative-dimension-label">{{ label }}</div>
      <div class="annotative-dimension"></div>
    </div>
  </template>
  `
}