const appFrameHandle = Vue.component('app-frame-handle', {
  props: {
    leftNode: Object,
    rightNode: Object,
  },
  mounted: function() {
    const el = this.$el;

    // Find px pos, then convert to vw pos
    let left_vw = parseFloat((this.rightNode.$el.getBoundingClientRect().x - 3) / window.innerWidth * 100);

    this.element_originX_px = left_vw;
    el.style.left = left_vw + "vw";
    this.set_left_vw(left_vw);

    // When layout shifts, recalibrate self
    emitter.on("layout_changed", () => {
      this.resnapHandle();
    });
  },
  data() {  
    return {
      moving: false,
      element_originX_px: 0,
      cursor_originX_px: 0,
      cursor_previousX_px: 0,
      deltaX_px: 0,
      margin: 2,
      frameOriginWidths: {left: 0, right: 0},
      DEBUG_OBJS: {},
    }
  },
  methods: {
    get_left_vw: function() {
      return parseFloat(this.$el.getBoundingClientRect().x / window.innerWidth * 100);
    },
    set_left_vw: function(val) {
      this.$el.style.left = val + "vw";
    },
    resnapHandle: function() {
      let left_vw = parseFloat((this.rightNode.$el.getBoundingClientRect().x - 3) / window.innerWidth * 100);

      this.element_originX_px = left_vw;
      this.set_left_vw(left_vw);
    },
    is_cursor_in_bounds: function(event) {
      const margin = this.margin;
      let cursor_pos_vw = event.pageX / window.innerWidth * 100;

      let left_bound_vw = this.leftNode.get_left("vw");
      let right_bound_vw = this.rightNode.get_right("vw");

      if (cursor_pos_vw >= left_bound_vw + margin &&
          cursor_pos_vw <= right_bound_vw - margin) {
        return "IN";
      } else if (cursor_pos_vw < left_bound_vw + margin) {
        return "LEFT";
      } else if (cursor_pos_vw > right_bound_vw - margin) {
        return "RIGHT";
      } else {
        throw new Error("Invalid cursor position value.");
      }
    },
    mousedown: function(event) {
      event.preventDefault();
      this.moving = true;

      // Set handle origin
      this.cursor_originX_px = event.pageX;


      this.frameOriginWidths.left = this.leftNode.get_width("vw");
      this.frameOriginWidths.right = this.rightNode.get_width("vw");

      // Add event listeners to entire application frame so the handle can move anywhere
      app.$refs.app.addEventListener("mousemove", this.mousemove);
      app.$refs.app.addEventListener("mouseup", this.mouseup);
      app.$refs.app.style.cursor = "col-resize";

      // Shared debug coords
      let cursor_originX_vw = this.cursor_originX_px / window.innerWidth * 100;

      if (DEBUG_MODE && DEBUG_OPTIONS.ui) {
        // Create gridlines
        this.DEBUG_OBJS.leftBoundary = debug.createVerticalGridline(this.leftNode.get_left("vw") + 2, "vw", "left @ " + (this.leftNode.get_left("vw") + 2));
        this.DEBUG_OBJS.rightBoundary = debug.createVerticalGridline(this.rightNode.get_right("vw") - 2, "vw", "right @ " + (this.rightNode.get_right("vw") - 2));
        this.DEBUG_OBJS.cursorOrigin = debug.createVerticalGridline(cursor_originX_vw, "vw", "origin @ " + cursor_originX_vw);
        
        // Create dimensions
        this.DEBUG_OBJS.leftDimension = debug.annotateDimension(this.leftNode.get_left("vw") + 2, cursor_originX_vw, "vw");
        this.DEBUG_OBJS.rightDimension = debug.annotateDimension(this.rightNode.get_right("vw") - 2, cursor_originX_vw, "vw");
      }
    },
    mousemove: function(event) {
      event.preventDefault();
      
      if (this.moving 
          && this.cursor_previousX_px != event.pageX 
          && event.pageX != 0) {

        let cursor_x_pos_vw = event.pageX / window.innerWidth * 100;
        let element_originX_vw = (this.cursor_originX_px / window.innerWidth * 100);

        let cursor_boundary_status = this.is_cursor_in_bounds(event);

        if (cursor_boundary_status == "IN") {
          // Cursor is in valid bounds

          // // Calculate delta X by px
          // this.deltaX_px = this.cursor_originX_px - event.pageX;
          // let deltaX_vw = (this.deltaX_px / window.innerWidth) * 100;
          
          // Resize panels
            // Old way of resizing -> archived
          // this.leftNode.set_width_vw(this.frameOriginWidths.left - deltaX_vw);
          // this.rightNode.set_width(this.frameOriginWidths.right + deltaX_vw, "vw");
            // New way of resizing
          this.rightNode.set_left_dimension_vw(cursor_x_pos_vw);
          this.leftNode.set_right_dimension_vw(cursor_x_pos_vw);
        } else if (cursor_boundary_status == "LEFT") {
          // Cursor is left of bounds
          let left_boundary_vw = this.leftNode.get_left("vw") + this.margin;

          this.rightNode.set_left_dimension_vw(left_boundary_vw);
          this.leftNode.set_right_dimension_vw(left_boundary_vw);
        } else {
          // Cursor is right of bounds
          let right_boundary_vw = this.rightNode.get_right("vw") - this.margin;

          this.rightNode.set_left_dimension_vw(right_boundary_vw);
          this.leftNode.set_right_dimension_vw(right_boundary_vw);
        }

        // Move handle
        setTimeout(() => {
          this.set_left(parseFloat((this.rightNode.$el.getBoundingClientRect().x - 3)/ window.innerWidth * 100), "vw");
        }, 10);

        // Chrome will fire an erroneous 0-data mousemove event, so cursor_previousX_px captures and ignores it.
        this.cursor_previousX_px = event.pageX;
      };
    },
    mouseup: function(event) {
      event.preventDefault();
      this.moving = false;

      // When interaction finishes, ensure that handle is positioned correctly
      this.resnapHandle();

      // Naturally due to rounding, successive computations will cause float drift.

      let float_entropy = app.$refs.appFrameContainer.calculate_layout_float_entropy();

      if (this.leftNode.get_width("vw") > this.frameOriginWidths.left) {
        this.leftNode.set_width(this.leftNode.get_width("vw") + float_entropy, "vw");
        this.rightNode.set_width(this.rightNode.get_width("vw"), "vw");
      } else {
        this.leftNode.set_width(this.leftNode.get_width("vw"), "vw");
        this.rightNode.set_width(this.rightNode.get_width("vw") + float_entropy, "vw");
      }

      // Save to localStorage
      try {
        localStorage.setItem(this.leftNode.frameName + "_width_vw", this.leftNode.get_width("vw"));
        localStorage.setItem(this.rightNode.frameName + "_width_vw", this.rightNode.get_width("vw"));
      } catch (exception) {
        // User has localStorage disabled
        console.warn(exception);
      }

      app.$refs.app.removeEventListener("mousemove", this.mousemove);
      app.$refs.app.removeEventListener("mouseup", this.mouseup);
      app.$refs.app.style.cursor = "auto";


      if (DEBUG_MODE && DEBUG_OPTIONS.ui) {
        /// Delete all annotative objects
        for (const [key, value] of Object.entries(this.DEBUG_OBJS)) {
          this.DEBUG_OBJS[key].delete();
        }
      }
    }
  },
  template: `
  <template>
  <div class="app-frame-handle"
    v-bind:class="{ 'app-frame-handle-active' : moving }"
    @mousedown="mousedown"
    @mousemove="mousemove"
    @mouseup="mouseup"
    @drag.stop
    draggable="false"> </div>
  </template>
  `
})
