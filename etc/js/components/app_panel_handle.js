import { debug } from "../utils.js";

export default {
  name: 'app-panel-handle',
  props: {
    topNode: Object,
    bottomNode: Object,
  },
  mounted: function() {
    const el = this.$el;

    // Initialize position and width relative to panels
    this.resnapHandle();

    // When layout shifts, recalibrate self
    emitter.on("layout_changed", () => {
      this.resnapHandle();
    });
  },
  data() {
    return {
      moving: false,
      element_originY_px: 0,
      cursor_originY_px: 0,
      cursor_previousY_px: 0,
      panelOriginHeights: {top: 0, bottom: 0},
      DEBUG_OBJS: {},
    }
  },
  computed: {
    both_nodes_expanded: function() {
      // Controls visibility of handle to show only when both top and bottom nodes are expanded
      return this.topNode.panel_state && this.bottomNode.panel_state;
    }
  },
  methods: {
    resnapHandle: function() {
      let top_px = this.topNode.get_bottom("px");
      this.$el.style.top = top_px - 2 + "px";
      this.set_width(this.topNode.get_width("vw"), "vw");

      this.element_originY_px = top_px;
    },
    is_cursor_in_bounds: function(event) {
      const margin = 40;
      let cursor_pos_px = event.pageY;
      // console.log("cursor pos", cursor_pos_px);

      let top_bound_px = this.topNode.get_top("px");
      let bottom_bound_px = this.bottomNode.get_bottom("px");

      if (cursor_pos_px >= top_bound_px + margin &&
          cursor_pos_px <= bottom_bound_px - margin) {
        return "IN";
      } else if (cursor_pos_px < bottom_bound_px + margin) {
        return "BOTTOM";
      } else if (cursor_pos_px > top_bound_px - margin) {
        return "TOP";
      } else {
        throw new Error("Invalid cursor position value.");
      }
    },
    mousedown: function(event) {
      event.preventDefault();
      this.moving = true;

      // Set handle origin
      this.cursor_originY_px = event.pageY;

      // Add event listeners to entire application frame so the handle can move anywhere
      app.$refs.app.addEventListener("mousemove", this.mousemove);
      app.$refs.app.addEventListener("mouseup", this.mouseup);
      app.$refs.app.style.cursor = "row-resize";

      if (DEBUG_MODE && DEBUG_OPTIONS.ui) {
        this.DEBUG_OBJS.topBoundary = debug.createHorizontalGridline(
          this.topNode.get_top("vw"),
          "vw", 
          "top @ " + (this.topNode.get_top("vw"))
        );
        this.DEBUG_OBJS.originBoundary = debug.createHorizontalGridline(
          event.pageY / window.innerWidth * 100,
          "vw", 
          "origin @ " + (event.pageY / window.innerHeight * 100)
        );
        this.DEBUG_OBJS.bottomBoundary = debug.createHorizontalGridline(
          this.bottomNode.get_bottom("vw"),
          "vw", 
          "bottom @ " + (this.bottomNode.get_bottom("vw"))
        );
      }
    },
    mousemove: function(event) {
      event.preventDefault();

      if (this.moving 
          && this.cursor_previousY_px != event.pageY 
          && event.pageY != 0) {
        let delta_y_px = this.element_originY_px - event.pageY;
        let cursor_boundary_status = this.is_cursor_in_bounds(event);
        
        if (cursor_boundary_status == "IN") {
          this.topNode.shrink_by(delta_y_px);
          this.bottomNode.grow_by(delta_y_px);
        } else if (cursor_boundary_status == "TOP") {
          // Future feature
        } else {
          // Future feature
        }
      };
      
      // Move handle
      setTimeout(() => {
        this.set_top(this.topNode.get_bottom("px") - 2, "px");
      }, 10);

      // Chrome will fire an erroneous 0-data mousemove event, so cursor_previousX_px captures and ignores it.
      this.cursor_previousY_px = event.pageY;
    },
    mouseup: function(event) {
      event.preventDefault();
      this.moving = false;

      // When interaction finishes, ensure that handle is positioned correctly
      this.resnapHandle();

      // Save to localStorage
      try {
        localStorage.setItem(this.topNode.panelid + "_height_pc", this.topNode.get_height_pc());
        localStorage.setItem(this.bottomNode.panelid + "_height_pc", this.bottomNode.get_height_pc());
      } catch (exception) {
        // User has localStorage disabled
        console.warn(exception);
      }

      app.$refs.app.removeEventListener("mousemove", this.mousemove);
      app.$refs.app.removeEventListener("mouseup", this.mouseup);
      app.$refs.app.style.cursor = "auto";

      if (DEBUG_MODE && DEBUG_OPTIONS.ui) {
        // Delete all annotative objects
        for (const [key, value] of Object.entries(this.DEBUG_OBJS)) {
          this.DEBUG_OBJS[key].delete();
        }
      };
    },
  },
  template: `
  <template>
    <div class="app-panel-handle"
    v-bind:class="{ 'app-panel-handle-active' : moving }"
      v-show="both_nodes_expanded"
      @mousedown="mousedown"
      @mousemove="mousemove"
      @mouseup="mouseup"
      draggable="false"> </div>
  </template>
  `
}