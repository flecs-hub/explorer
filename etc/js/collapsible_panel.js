/*
Collapsible-panel is a collapsible container component with a title bar and a collapsible/expandable content area.
*/

Vue.component('collapsible-panel', {
props: {
  disabled: { type: Boolean, default: false },
  closable: { type: Boolean, default: false },
},
// app.store, not store, used because this is a module
inject: ['panelid'],
mounted: function() {
  const saved_state = localStorage.getItem(this.panelid + "_toggle_state");
  const VALID_STATES = ["expanded", "collapsed"];

  if (saved_state && VALID_STATES.includes(saved_state)) {
    if (saved_state == "expanded") {
      this.state = true;
    } else {
      this.state = false;
    }
  } else {
    // If no past valid state found, then expand by default.
    this.state = true;
  }

  this.emit_event_helper();
  this.resizeObserver = new ResizeObserver(this.emit_resize).observe(this.$el);

  if (DEBUG_MODE && DEBUG_OPTIONS.mounting) { console.log(this.$options.name, this.name, "mounted"); };
},
data: function() {
  return {
    // Panel state: true = expanded, false = collapsed
    componentName: this.$options.name,
    state: true,
    resizeObserver: undefined,
  }
},
methods: {
  toggle_panel: function(event) {
    event.preventDefault();

    this.state = !this.state;
    this.emit_event_helper();

    // Remember panel state in local storage
    localStorage.setItem(this.panelid + "_toggle_state", this.state ? "expanded" : "collapsed");
  },
  force_expand: function() {
    this.state = true;
    this.emit_event_helper();
  },
  force_collapse: function() {
    this.state = false;
    this.emit_event_helper();
  },
  emit_event_helper: function() {
    // Emits event using Mitt.js emitter
    // Call only after done setting new state. Never before.
    emitter.emit(this.panelid + "_event", this.state);
  },
  evt_close: function() {
    // This feature will be refactored out
    this.$emit('close');
    this.force_collapse();
  }
},
template: `
<template :ref="this.componentName">
  <div class="collapsible-panel" 
    :class="[ state ? 'panel-state-expanded' : 'panel-state-collapsed' ]">

    <div class="collapsible-panel-title" @click.stop="toggle_panel">
      <div class="collapsible-panel-title-inner">
      
        <icon src="nav" :rotate="state"/>

        <slot name="title"></slot>

        <icon class="btn_close" src="close" v-if="closable" 
          :rotate="disabled" 
          :hide="disabled"
          v-on:click.stop="evt_close">
        </icon>
      </div>
    </div>

    <div ref="panel_content" class="collapsible-panel-content"">
      <div class="collapsible-panel-content-inner">
        <slot name="content"></slot>
      </div>
    </div>

  </div>
</template>
`
});