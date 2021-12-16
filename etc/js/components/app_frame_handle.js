export default {
  name: 'app-frame-handle',
  props: {
    leftNode: Object,
    rightNode: Object,
  },
  mounted: function() {
    const el = this.$el;


    // Find px pos, then convert to vw pos
    let left_vw = parseFloat((this.rightNode.$el.getBoundingClientRect().x - 3) / window.innerWidth * 100);

    this.originLeft = el.style.left = left_vw;
    this.set_left_vw(left_vw);

    window.addEventListener("resize", this.resnapHandle());
  },
  data() {
    return {
      moving: false,
      originLeft: 0,
      startX: 0,
      lastX: 0,
      deltaX_px: 0,
      frameOriginWidths: {left: 0, right: 0},
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

      this.originLeft = left_vw;
      this.set_left_vw(left_vw);
    },
    checkHandleCollision: function() {
      const otherHandles = app.$refs.appFrameContainer.handleInstances.filter(handle => handle != this);
      const margin = 1;

      // Check collision with other handles
      for (const handle of otherHandles) {
        if (Math.abs(this.get_left_vw() - handle.get_left_vw()) <= margin) {
          return false;
        }
      }

      // Check collision with inner window
      if (this.get_left_vw() <= margin ||
          this.get_left_vw() >= (100 - margin)) {
            return false;
      }
      return true;
    },
    is_cursor_in_bounds: function(cursor_x_pos_vw) {
      const margin = 1;
      let cursor_pos_vw = event.pageX / window.innerWidth * 100;

      let left_bound = this.leftNode.get_left_boundary_vw();
      let right_bound = this.rightNode.get_right_boundary_vw();

      if (cursor_pos_vw > left_bound + margin &&
        cursor_pos_vw < right_bound - margin) {
          return true;
        } else {
          return false;
        }
    },
    mousedown: function(event) {
      event.preventDefault();
      this.moving = true;

      // Set handle origin
      this.startX = event.pageX;

      this.frameOriginWidths.left = this.leftNode.get_width_vw();
      this.frameOriginWidths.right = this.rightNode.get_width_vw();

      app.$refs.app.addEventListener("mousemove", this.mousemove);
      app.$refs.app.addEventListener("mouseup", this.mouseup);
      app.$refs.app.style.cursor = "col-resize";
    },
    mousemove: function(event) {
      event.preventDefault();
      
      if (this.moving 
          && this.lastX != event.pageX 
          && event.pageX != 0) {

        let cursor_x_pos_vw = event.pageX / window.innerWidth * 100;

        if (this.is_cursor_in_bounds(cursor_x_pos_vw)) {

          // Calculate delta X by px
          this.deltaX_px = this.startX - event.pageX;
          let deltaX_vw = (this.deltaX_px / window.innerWidth) * 100;

          // Move handle
          setTimeout(() => {
            this.set_left_vw(parseFloat((this.rightNode.$el.getBoundingClientRect().x - 3)/ window.innerWidth * 100));
          }, 1);
          
          // Resize panels
          this.leftNode.set_width_vw(this.frameOriginWidths.left - deltaX_vw);
          this.rightNode.set_width_vw(this.frameOriginWidths.right + deltaX_vw);

          // Chrome will fire an erroneous 0-data mousemove event, so lastX captures and ignores it.
          this.lastX = event.pageX;

        }
      }
    },
    mouseup: function(event) {
      event.preventDefault();
      this.moving = false;

      this.resnapHandle();

      let float_entropy = app.$refs.appFrameContainer.calculate_layout_float_entropy();

      if (this.leftNode.get_width_vw() > this.frameOriginWidths.left) {
        this.leftNode.set_width_vw(this.leftNode.get_width_vw() + float_entropy);
        this.rightNode.set_width_vw(this.rightNode.get_width_vw());
      } else {
        this.leftNode.set_width_vw(this.leftNode.get_width_vw());
        this.rightNode.set_width_vw(this.rightNode.get_width_vw() + float_entropy);
      }

      // Save to localStorage
      try {
        localStorage.setItem(this.leftNode.frameName, this.leftNode.get_width_vw());
        localStorage.setItem(this.rightNode.frameName, this.rightNode.get_width_vw());
      } catch (exception) {
        // User has localStorage disabled
        console.warn(exception);
      }

      app.$refs.app.removeEventListener("mousemove", this.mousemove);
      app.$refs.app.removeEventListener("mouseup", this.mouseup);
      app.$refs.app.style.cursor = "auto";

      console.log(app.$refs.appFrameContainer.validate_current_layout());
    }
  },
  template: `
  <template>
  <div class="app-frame-handle"
    @mousedown="mousedown"
    @mousemove="mousemove"
    @mouseup="mouseup"
    @drag.stop
    draggable="false"> </div>
  </template>
  `
}
