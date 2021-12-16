import appFrameHandle from "./components/app_frame_handle.js";
import { browser } from "./utils.js";

Vue.component('app-frame-container', {
  data: function() {
    return {
      frameInstances: [],
      handleInstances: [],
    }
  },
  methods: {
    validate_current_layout: function() {
      let float_entropy = this.calculate_layout_float_entropy();

      if (0.01 > float_entropy > -0.01) {
        return true;
      }
      return false;
    },
    calculate_layout_float_entropy: function() {
      let combined_frame_widths = 0;
      for (const frame of this.frameInstances) {
        combined_frame_widths += frame.get_declared_width_vw();
      }
      let float_entropy = 100 - combined_frame_widths;
      return float_entropy;
    }
  },
  template: `
  <div class="app-frame-container">
    <slot></slot>
  </div>`
});



Vue.component('app-frame', {
  props: {
    width: {type: Number},
  },
  mounted: function() {

    const el = this.$el;
    this.set_frame_index();
    this.$parent.frameInstances.push(this);

    if (localStorage.getItem(this.frameName)) {
      el.style.width = this.set_width_vw(localStorage.getItem(this.frameName));
    } else {
      // not previously defined or localStorage is disabled by user
      this.set_width_vw(this.width);
    }

    // Instantiating resizer handles
    if (el.nextSibling) {
      var appFrameHandleClass = Vue.extend(appFrameHandle);
      var appFrameHandleInstance = new appFrameHandleClass({
        propsData: {
          leftNode: this,
          rightNode: this.$parent.$children[this.frameIndex+1],
        }
      });

      appFrameHandleInstance.$mount();
      this.$parent.handleInstances.push(appFrameHandleInstance);
      el.appendChild(appFrameHandleInstance.$el);
    }

    let real_width = this.get_width_vw();
    this.set_width_vw(real_width);

    // console.log(this.frameName, "mounted:", "declared", this.get_declared_width_vw(), "vw", "actual:", this.get_width_vw(), "vw");
  },
  methods: {
    set_frame_index: function() {
      this.frameIndex = Array.from(this.$el.parentNode.children).indexOf(this.$el);
    },
    set_width_vw: function(val) {
      this.$el.style.width = val + "vw";
    },
    get_width_vw: function() {
      return parseFloat((this.$el.getBoundingClientRect().width / window.innerWidth * 100));
    },
    get_declared_width_vw: function() {
      return parseFloat(this.$el.style.width.replace('vw', ''));
    },
    get_left_boundary_vw: function() {
      return parseFloat(this.$el.getBoundingClientRect().x / window.innerWidth * 100);
    },
    get_right_boundary_vw: function() {
      return parseFloat(this.get_left_boundary_vw() + this.get_width_vw());
    }
  },
  data: function() {
    return {
      frameIndex: undefined,
    }
  },
  computed: {
    frameName: function() {
      return "frame" + this.frameIndex;
    },
  },
  template: `
  <div class="app-frame">
    <slot></slot>
  </div>
  `
});