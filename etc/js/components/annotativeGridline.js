export default {
  name: 'annotative-gridline',
  props: {
    position: Number,
    unit: { type: String, default: "px"},
    orientation: { type: String, default: "vertical"},
    label: String,
  },
  data: function() {
    return {
      label: this.label,
    }
  },
  mounted: function() {
    const VALID_ORIENTATIONS = ["horizontal", "vertical"];

    if ((typeof(this.position) == "number" && !this.top) &&
        (typeof(this.unit) == "string" && VALID_UNITS.includes(this.unit)) &&
        VALID_ORIENTATIONS.includes(this.orientation)) {
      if (this.orientation == "vertical") {
        this.$el.style.left = this.position + this.unit;
      } else if (this.orientation == "horizontal") {
        this.$el.style.top = this.position + this.unit;
      } else {
        // left XOR top must be set in order to determine whether the gridline is vertical or horizontal.
        throw new Error("both left and top cannot be set");
      }
    } else {
      throw TypeError;
    }

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
  computed: {
    evaluateOrientation: function() {
      let class_response;
      if (this.orientation == "vertical") {
        class_response = "annotative-gridline-vertical";
      } else if (this.orientation == "horizontal") {
        class_response = "annotative-gridline-horizontal";
      } else {
        throw new Error("cannot evaluate");
      }
      return class_response;
    },
  },
  template: `
  <template>
    <div :class="evaluateOrientation">
      <div v-if="label" class="annotative-gridline-label">{{ label }}</div>
      <div class="annotative-gridline-line"></div>
    </div>
  </template>`
}