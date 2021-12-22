Vue.component('collapsible-panel', {
props: {
  // Unique name needed for saving panel state to localStorage
  name: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  closable: { type: Boolean, default: false },
},
mounted: function() {
  const saved_state = localStorage.getItem(this.name + "_toggle_state");
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

  if (DEBUG_MODE && DEBUG_OPTIONS.mounting) { console.log(this.$options.name, this.anme, "mounted"); };
},
data: function() {
  return {
    // Panel state: true = expanded, false = collapsed
    state: true,
  }
},
methods: {
  toggle_panel: function(event) {
    event.preventDefault();

    this.state = !this.state;

    // Remember panel state in local storage
    localStorage.setItem(this.name + "_toggle_state", this.state ? "expanded" : "collapsed");
  },
  force_expand: function() {
    this.state = true;
  },
  force_collapse: function() {
    this.state = false;
  },
  evt_close: function() {
    // This feature will be refactored out
    this.$emit('close');
    this.force_collapse();
  }
},
template: `
<template>
  <div class="collapsible-panel" :class="[ state ? 'panel-state-expanded' : 'panel-state-collapsed' ]">

    <div class="collapsible-panel-title" @click.stop="toggle_panel">
      <div class="collapsible-panel-title-inner">
      
        <icon src="nav" :rotate="state"/>

        <slot name="title"></slot>

        <icon src="close" v-if="closable" 
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