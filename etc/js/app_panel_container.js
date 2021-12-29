/*
App-panel is a vertically resizable container component.
It is not a collapsible-panel, though it may contain one.

In the future, app-panel will be movable.
*/

import appPanelHandle from "./components/app_panel_handle.js";
import { debug } from "./utils.js";

Vue.component('app-panel', {
  props: {
    height: Number,
    panelid: String,
  },
  provide: function() {
    return {
      panelid: this.panelid,
    }
  },
  mounted: function() {
    const el = this.$el;
    this.set_panel_index();

    // expects app-frame as parent
    this.$parent.panelInstances.push(this);

    // Retrieve previous configuration if it exists
    let saved_height = parseFloat(localStorage.getItem(this.panelid + "_height_pc"));
    if (saved_height) {
      el.style.height = this.set_height(saved_height, "%");
    } else {
      // not previously defined or localStorage is disabled by user
      this.set_height(this.height, "%");
    }

    // Instantiate and initialize vertical resize handle
    if(el.nextSibling) {
      var appPanelHandleClass = Vue.extend(appPanelHandle);
      var appPanelHandleInstance = new appPanelHandleClass({
        propsData: {
          topNode: this,
          bottomNode: this.$parent.$children[this.panelIndex+1],
        }
      });
      
      appPanelHandleInstance.$mount();
      el.appendChild(appPanelHandleInstance.$el);
    }

    // Get initial panel state
    let initial_panel_state = localStorage.getItem(this.panelid + "_toggle_state");
    if (initial_panel_state) {
      if (initial_panel_state == "expanded") {
        this.panel_state = true;
      } else {
        this.panel_state = false;
      }
    }

    // Listen for subsequent panel state changes
    emitter.on(this.panelid + "_event", e => {
      if (e == true) {
        this.panel_state = true;
      } else {
        this.panel_state = false;
      }
    });

    // Notify rest of app when this element changes size
    this.resizeObserver = new ResizeObserver(this.emit_resize).observe(this.$el);

    if (DEBUG_MODE && DEBUG_OPTIONS.ui) {
      this.$el.style.border = "1px solid rgba(255,0,0,0.5)";
    }
  },
  watch: {
    height: function() {
      this.set_height(this.height, "%");
    }
  },
  methods: {
    set_panel_index: function() {
      this.panelIndex = Array.from(this.$el.parentNode.children).indexOf(this.$el);
    },
    get_parent_frame_height: function() {
      return this.$parent.$el.offsetHeight;
    },
    get_height_pc: function() {
      return this.$el.offsetHeight / this.$parent.$el.offsetHeight * 100;
    },
    grow_by: function(grow_amount_px) {
      let height_px = this.$el.offsetHeight;
      this.height = (height_px + grow_amount_px) / this.get_parent_frame_height() * 100;
    },
    shrink_by: function(shrink_amount_px) {
      let height_px = this.$el.offsetHeight;
      this.height = (height_px - shrink_amount_px) / this.get_parent_frame_height() * 100;
    }
  },
  data: function() {
    return {
      panelIndex: undefined,
      resizeObserver: undefined,
      panel_state: true,
    }
  },
  template: `
  <template>
    <div class="app-panel" v-bind:class="panel_state ? 'app-panel-expanded' : 'app-panel-collapsed'">
      <slot></slot>
    </div>
  </template>
  `
});