function getMousePosition(e) {
  if ('touches' in e) return e.touches[0].clientX
  return e.clientX
}

function getMouseMovement(e) {
  if ('touches' in e) return e.touches[0].movementX
  return e.movementX
}

const resize_handle = Vue.component('resize-handle', {
  props: {
    left_frame: Object,
    right_frame: Object,
    begin_drag_callback: Function,
    dragging_callback: Function,
    end_drag_callback: Function,
  },
  data() {
    return {
      moving: false,
      direction: null,
      start: undefined,
      width: 0,
      x: 0,
    }
  },
  computed: {
  },
  watch: {
  },
  created() {
  },
  mounted() {
    this.$nextTick(() => {
      this.start = this.$el.offsetLeft;
      this.width = this.$el.offsetWidth;
    })
  },
  methods: {
    recalibrate() {

    },
    begin_drag(e) {
      e.preventDefault();
      this.moving = true;
      this.start = this.$el.offsetLeft;
      this.begin_drag_callback(this);

      document.addEventListener("mousemove", this.dragging);
      document.addEventListener("mouseup", this.end_drag);
      this.$parent.$el.style.cursor = "col-resize";
    },
    dragging(e) {
      e.preventDefault();
      if (!this.moving) return;

      let offset;
      let delta;

      // Calculate offset from start
      offset = getMousePosition(e) - this.start;
      this.x = this.start + offset;

      // Determine current movement direction
      delta = getMouseMovement(e);
      this.direction = delta < 0 ? "left" : delta > 0 ? "right" : null;

      this.dragging_callback(this, offset);
    },
    end_drag(e) {
      e.preventDefault();
      this.moving = false;
      this.end_drag_callback(this);

      document.removeEventListener("mousemove", this.dragging);
      document.removeEventListener("mouseup", this.end_drag);
      this.$parent.$el.style.cursor = "auto";
    }
  },
  template: `
    <div class="handle">
      <div class="handle-grab-box"
        @mousedown="begin_drag"
        @mousemove="dragging"
        @mouseup="end_drag">
      </div>
    </div>
  `
});

const frame = Vue.component('split-pane', {
  props: {
    fixed: { type: Boolean, required: false, default: false },
    initial_width: { type: Number, required: false },
    min_width: { type: Number, required: false, default: 50 },
    max_width: { type: Number, required: false, default: Infinity },
  },
  data() {
    return {
      active: false,
      width: undefined,
      start: 0,
      x: 0,
    }
  },
  methods: {
  },
  computed: {
    slack() {
      return this.width - this.min_width;
    },
    locked() {
      return ( this.slack == 0 ? true : false );
    },
    index() {
      return this.$parent.frames.indexOf(this);
    }
  },
  watch: {
    width: function(new_width) {
      this.$el.style.width = new_width + "px";
      this.x = this.$el.offsetLeft;

      for (var i = 0; i < this.$children.length; i ++) {
        const child = this.$children[i];
        child.$forceUpdate(); // Give child a chance to respond to width change
      }
    }
  },
  created() {
  },
  updated() {
    this.x = this.$el.offsetLeft;
  },
  mounted() {
    // Declare current width
    this.width = this.initial_width ? this.initial_width : this.min_width

    // Declare minimum width
    this.$el.style.minWidth = this.min_width
    if (this.max_width != Infinity) this.$el.style.maxWidth = this.max_width

    this.save()
  },
  methods: {
    save() {
      this.start = this.width;
    }
  },
  template: `
    <div class="split-pane"">
      <slot v-on:close="evt_close"></slot>
    </div>
  `
}) 

const frame_container = Vue.component('split-pane-container', {
  data() {
    return {
    }
  },
  computed: {
    children() {
      return this.$children
    },
    frames() {
      return this.$children.filter(child => child.$options.name === "split-pane");
    },
    handles() {
      return this.$children.filter(child => child.$options.name === "resize-handle");
    },
    layout() {
      const layout = {
        fixed_fr_count: this.frames.filter(frame => frame.fixed).length,
        fluid_fr_count: this.frames.filter(frame => !frame.fixed).length,
        handle_space: this.handles.reduce((acc, handle) => acc + handle.width, 0),
        fixed_fr_space: this.frames.filter(frame => frame.fixed).reduce((acc, frame) => acc + frame.width, 0),
        fluid_fr_space: this.frames.filter(frame => !frame.fixed).reduce((acc, frame) => acc + frame.width, 0),
      }
      return layout;
    }
  },
  mounted() {

    window.controller = this;

    // Initialize frame dimensions
    this.resize()

    // When window resizes, resize frames.
    window.addEventListener("resize", () => {
      this.resize()
    });

    // Instantiate handles
    for (let i = 0; i < this.frames.length - 1; i++) {
      let frame = this.frames[i];

      let handle_class = Vue.extend(resize_handle)
      let handle_instance = new handle_class({
        propsData: {
          left_frame: this.frames[i],
          right_frame: this.frames[i + 1],
          begin_drag_callback: this.begin_adjust,
          dragging_callback: this.adjust,
          end_drag_callback: this.end_adjust,
        }
      })

      // Set ancestry
      this.$children.push(handle_instance);
      this.handles.push(handle_instance);
      handle_instance.$parent = this;
      
      handle_instance.$mount();
      frame.$el.after(handle_instance.$el);
    }
  },
  
  methods: {

    resize() {
      // Capture available and demanded space at moment
      let application_width = this.$el.offsetWidth;
      let free_sp = application_width - (this.layout.fixed_fr_space + this.layout.handle_space);
      let demanded_sp = this.layout.fluid_fr_space;

      for (const frame of this.frames) {
        if (!frame.fixed) {
          let r = frame.width / demanded_sp;
          let resized_width = r * free_sp;
          frame.width = resized_width >= frame.min_width ? resized_width : frame.min_width;
        }
        frame.save();
      }
    },

    begin_adjust(handle) {
      handle.left_frame.active = handle.right_frame.active = true;
    },

    adjust(handle, offset) {
      lfr = handle.left_frame;
      rfr = handle.right_frame;

      let current_step = {
        left: lfr.width,
        right: rfr.width
      }

      let next_step = {
        left: lfr.start + offset,
        right: rfr.start - offset
      }

      let valid_step = next_step.left >= lfr.min_width && next_step.left < lfr.max_width && next_step.right >= rfr.min_width && next_step.right < rfr.max_width;

      if (handle.direction == "left") {
        if (valid_step) {
          lfr.width = next_step.left;
          rfr.width = next_step.right;
        } else {
          if (next_step.left < lfr.min_width) {
            let diff = lfr.start - lfr.min_width;
            lfr.width = lfr.min_width;
            rfr.width = rfr.start + diff;
          }
        }
      }

      if (handle.direction == "right") {
        if (valid_step) {
          lfr.width = next_step.left;
          rfr.width = next_step.right;
        } else {
          if (next_step.right < rfr.min_width) {
            let diff = rfr.start - rfr.min_width;
            rfr.width = rfr.min_width;
            lfr.width = lfr.start + diff;
          }
        }
      }

    },

    end_adjust(handle) {
      handle.left_frame.active = handle.right_frame.active = false;
      for (const frame of this.frames) {
        frame.save();
      }
    },

    insert_frame(index) {
      // Insertion index must be within range
      if (index >= this.frames.length) return;

      // If no insertion index, then point to end
      if (!index) index = this.frames.length - 1;

      // Create frame
      let frame_class = Vue.extend(frame)
      let frame_instance = new frame_class()
      this.$children.push(frame_instance);
      this.frames.push(frame_instance);
      frame_instance.$parent = this;
      frame_instance.$mount();
      this.frames[index].$el.after(frame_instance.$el);

      // Create handle
      let handle_class = Vue.extend(resize_handle)
      let handle_instance = new handle_class({
        propsData: {
          left_frame: this.frames[index],
          right_frame: this.frames[index + 1],
          begin_drag_callback: this.begin_adjust,
          dragging_callback: this.adjust,
          end_drag_callback: this.end_adjust,
        }
      })
      this.$children.push(handle_instance);
      this.handles.push(handle_instance);
      handle_instance.$parent = this;
      handle_instance.$mount();
      this.frames[index].$el.after(handle_instance.$el);

      // Modify previous handle
      this.handles[index].left_frame = this.frames[index + 1];
      this.handles[index].right_frame = this.frames[index + 2];

      // Fit everything together
      this.resize();
    }

  },
  template: `
  <div class="split-pane-container">
    <slot></slot>
  </div>
  `
});