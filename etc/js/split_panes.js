function getMousePosition(e, axis = "x") {
  if (axis == "x") {
    if ('touches' in e) return e.touches[0].clientX
    return e.clientX
  } else if (axis == "y") {
    if ('touches' in e) return e.touches[0].clientY
    return e.clientY
  }
}

function getMouseMovement(e, axis = "x") {
  if (axis == "x") {
    if ('touches' in e) return e.touches[0].movementX
    return e.movementX
  } else if (axis == "y") {
    if ('touches' in e) return e.touches[0].movementY
    return e.movementY
  }
}

const resize_handle = Vue.component('resize-handle', {
  /*
    Resize-handle is used for both split-pane and vertical panels.
    Provides Orientation prop:
      Split-pane : "vertical"
      Panel : "horizontal"

    Value assignments is determined by orientation
  */
  props: {
    orientation: String, // vertical | horizontal
    prev_frame: Object, // split-pane | panel
    next_frame: Object, // split-pane | panel
    begin_drag_callback: Function,
    dragging_callback: Function,
    end_drag_callback: Function,
  },
  data() {
    return {
      moving: false,
      direction: null,
      start: undefined,
      height: 0,
      width: 0,
      x: 0,
      y: 0,
    }
  },
  computed: {
    locked() { 
      return this.prev_frame.locked || this.next_frame.locked;
    }
  },
  watch: {
  },
  created() {
  },
  mounted() {
    this.$nextTick(() => {
      this.start = this.orientation == "vertical" ? this.$el.offsetLeft : this.$el.offsetTop;
      this.width = this.$el.offsetWidth;
      this.height = this.$el.offsetHeight;
    })
  },
  methods: {
    recalibrate() {
      // Planned method to recalibrate internal position with actual position
    },
    begin_drag(e) {
      e.preventDefault();
      this.moving = true;
      this.start = this.orientation == "vertical" ? this.$el.offsetLeft : this.$el.offsetTop;
      this.begin_drag_callback(this);

      document.addEventListener("mousemove", this.dragging);
      document.addEventListener("mouseup", this.end_drag);
      this.prev_frame.$parent.$el.style.cursor = "col-resize";
    },
    dragging(e) {
      e.preventDefault();
      if (!this.moving) return;

      if (this.prev_frame.collapsed || this.next_frame.collapsed) return;

      let axis = this.orientation == "vertical" ? "x" : "y";

      let offset;
      let delta;

      // Calculate offset from start
      offset = getMousePosition(e, axis) - this.start;
      this.x = this.start + offset;

      // Determine current movement direction
      delta = getMouseMovement(e, axis);
      if (this.orientation == "vertical") {
        this.direction = delta < 0 ? "left" : delta > 0 ? "right" : null;
      }
      if (this.orientation == "horizontal") {
        this.direction = delta < 0 ? "up" : delta > 0 ? "down" : null;
      }

      this.dragging_callback(this, offset);
    },
    end_drag(e) {
      e.preventDefault();
      this.moving = false;
      this.end_drag_callback(this);

      document.removeEventListener("mousemove", this.dragging);
      document.removeEventListener("mouseup", this.end_drag);
      this.prev_frame.$parent.$el.style.cursor = "auto";
    }
  },
  template: `
    <div class="handle" 
      :class="[orientation === 'vertical' ? 'handle-vertical' : 'handle-horizontal',
              locked ? 'locked' : '']">
      <div class="handle-grab-box"
        @mousedown="begin_drag"
        @mousemove="dragging"
        @mouseup="end_drag">
      </div>
    </div>
  `
});



const split_pane = Vue.component('split-pane', {
  props: {
    fixed: { type: Boolean, required: false, default: false },
    initial_width: { type: Number, required: false },
    min_width: { type: Number, required: false, default: 100 },
  },
  data() {
    return {
      active: false,
      locked: false,
      width: undefined,
      start: 0,
      x: 0,
    }
  },
  computed: {
    slack() {
      return this.width - this.min_width;
    },
    index() {
      return this.$parent.frames.indexOf(this);
    }
  },
  watch: {
    width: function(new_width) {
      this.$el.style.width = new_width + "px"
      this.x = this.$el.offsetLeft
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

    this.save()
  },
  methods: {
    save() {
      this.start = this.width;
    }
  },
  template: `
    <div class="split-pane"
      :class="[
      ]">
      <slot></slot>
      
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
          orientation: "vertical",
          prev_frame: this.frames[i],
          next_frame: this.frames[i + 1],
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
      handle.prev_frame.active = handle.next_frame.active = true;
    },

    adjust(handle, offset) {
      lfr = handle.prev_frame;
      rfr = handle.next_frame;

      current_step = {
        left: lfr.width,
        right: rfr.width
      }

      next_step = {
        left: lfr.start + offset,
        right: rfr.start - offset
      }


      if (handle.direction == "left") {
        if (next_step.left >= lfr.min_width && next_step.right >= rfr.min_width) {
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
        if (next_step.left >= lfr.min_width && next_step.right >= rfr.min_width) {
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
      handle.prev_frame.active = handle.next_frame.active = false;
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
          orientation: "vertical",
          prev_frame: this.frames[index],
          next_frame: this.frames[index + 1],
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
      this.handles[index].prev_frame = this.frames[index + 1];
      this.handles[index].next_frame = this.frames[index + 2];

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




/*
  VERTICAL PANELS
*/


const panel = Vue.component('panel', {
  props: {
    fixed: { type: Boolean, required: false, default: false },
    initial_height: { type: Number, required: false },
    min_height: { type: Number, required: false, default: 60 },
  },
  data() {
    return {
      collapsed: false,
      active: false,
      height: undefined,
      past_heights: [],
      start: 0,
      y: 0,
    }
  },
  computed: {
    slack() {
      return this.height - this.min_height;
    },
    locked() {
      return ( this.collapsed ? true : false );
    },
    index() {
      return this.$parent.panels.indexOf(this);
    }
  },
  watch: {
    height(new_height) {
      this.$el.style.height = new_height + "px"
      this.y = this.$el.offsetTop
    },
  },
  updated() {
    this.x = this.$el.offsetTop;
  },
  mounted() {
    // Declare current height
    this.height = this.initial_height ? this.initial_height : this.min_height

    // Declare minimum height
    this.$el.style.minHeight = this.min_height

    this.save()
  },
  methods: {
    save() {
      this.start = this.height;
    },
    collapse() {
      this.$el.style.minHeight = 35
      this.past_heights.push(this.height)
      console.log(this.height);
      this.height = 35
      this.save()
      this.collapsed = true;
      this.$parent.resize();
    },
    expand() {
      let re_height = this.past_heights.shift();
      this.height = re_height;
      this.save()
      this.$parent.resize();
      this.collapsed = false;
      
      setTimeout(
        () => {
          this.$el.style.minHeight = this.min_height
        }, 150
      )
      // min height setting is delayed so it won't interfere with expand animation

    }
  },
  template: `
    <div class="panel" 
      :class="active ? 'panel-active' : ''"
      >
      <slot @collapsible_panel_toggled="toggle"></slot>
      
    </div>
  `
}) 

const panel_container = Vue.component('panel-container', {
  data() {
    return {
    }
  },
  computed: {
    panels() {
      return this.$children.filter(child => child.$options.name === "panel");
    },
    handles() {
      return this.$children.filter(child => child.$options.name === "resize-handle");
    },
    layout() {
      const layout = {
        fixed_pn_count: this.panels.filter(panel => panel.fixed || panel.collapsed).length,
        fluid_pn_count: this.panels.filter(panel => !panel.fixed && !panel.collapsed).length,
        handle_space: this.handles.reduce((acc, handle) => acc + handle.height, 0),
        fixed_pn_space: this.panels.filter(panel => panel.fixed || panel.collapsed ).reduce((acc, panel) => acc + panel.height, 0),
        fluid_pn_space: this.panels.filter(panel => !panel.fixed && !panel.collapsed).reduce((acc, panel) => acc + panel.height, 0),
      }
      return layout;
    }
  },
  mounted() {

    // Initialize panel dimensions
    this.resize()

    // When window resizes, resize panels.
    window.addEventListener("resize", () => {
      this.resize()
    });

    // Instantiate handles
    for (let i = 0; i < this.panels.length - 1; i++) {
      let panel = this.panels[i];

      let handle_class = Vue.extend(resize_handle)
      let handle_instance = new handle_class({
        propsData: {
          orientation: "horizontal",
          prev_frame: this.panels[i],
          next_frame: this.panels[i + 1],
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
      panel.$el.after(handle_instance.$el);
    }
  },
  
  methods: {

    resize() {
      // Capture available and demanded space at moment
      let application_height = this.$el.offsetHeight;
      let free_sp = application_height - (this.layout.fixed_pn_space + this.layout.handle_space);
      let demanded_sp = this.layout.fluid_pn_space;

      for (const panel of this.panels) {
        if (!panel.fixed && !panel.collapsed) {
          let r = panel.height / demanded_sp;
          let resized_height = r * free_sp;
          panel.height = resized_height >= panel.min_height ? resized_height : panel.min_height;
        }
        panel.save();
      }
    },

    begin_adjust(handle) {
      handle.prev_frame.active = handle.next_frame.active = true;
    },

    adjust(handle, offset) {
      lfr = handle.prev_frame;
      rfr = handle.next_frame;

      current_step = {
        left: lfr.height,
        right: rfr.height
      }

      next_step = {
        left: lfr.start + offset,
        right: rfr.start - offset
      }

      if (handle.direction == "up") {
        if (next_step.left >= lfr.min_height && next_step.right >= rfr.min_height) {
          lfr.height = next_step.left;
          rfr.height = next_step.right;
        } else {
          if (next_step.left < lfr.min_height) {
            let diff = lfr.start - lfr.min_height;
            lfr.height = lfr.min_height;
            rfr.height = rfr.start + diff;
          }
        }
      }

      if (handle.direction == "down") {
        if (next_step.left >= lfr.min_height && next_step.right >= rfr.min_height) {
          lfr.height = next_step.left;
          rfr.height = next_step.right;
        } else {
          if (next_step.right < rfr.min_height) {
            let diff = rfr.start - rfr.min_height;
            rfr.height = rfr.min_height;
            lfr.height = lfr.start + diff;
          }
        }
      }

    },

    end_adjust(handle) {
      handle.prev_frame.active = handle.next_frame.active = false;
      for (const panel of this.panels) {
        panel.save();
      }
    },

    insert_panel(index) {
      // Insertion index must be within range
      if (index >= this.panels.length) return;

      // If no insertion index, then point to end
      if (!index) index = this.panels.length - 1;

      // Create panel
      let panel_class = Vue.extend(panel)
      let panel_instance = new panel_class()
      this.$children.push(panel_instance);
      this.panels.push(panel_instance);
      panel_instance.$parent = this;
      panel_instance.$mount();
      this.panels[index].$el.after(panel_instance.$el);

      // Create handle
      let handle_class = Vue.extend(resize_handle)
      let handle_instance = new handle_class({
        propsData: {
          orientation: "vertical",
          prev_frame: this.panels[index],
          next_frame: this.panels[index + 1],
          begin_drag_callback: this.begin_adjust,
          dragging_callback: this.adjust,
          end_drag_callback: this.end_adjust,
        }
      })
      this.$children.push(handle_instance);
      this.handles.push(handle_instance);
      handle_instance.$parent = this;
      handle_instance.$mount();
      this.panels[index].$el.after(handle_instance.$el);

      // Modify previous handle
      this.handles[index].prev_frame = this.panels[index + 1];
      this.handles[index].next_frame = this.panels[index + 2];

      // Fit everything together
      this.resize();
      console.log("new panel created");
    }

  },
  template: `
  <div class="panel-container">
    <slot></slot>
  </div>
  `
});