<template>

    <div class="tooltip noselect" :class="show_state ? 'tooltip-visible' : ''">
      {{ label }}
    </div>

</template>

<script>
/* 

  WARNING: Tooltip will persist after its trigger element is mounted.
*/
module.exports = {
  name: "tooltip",
  props: {
    element: { type: HTMLElement },
    label: { type: String }
  },
  data() {
    return {
      show_state: false,
    }
  },
  methods: {
    show() {
      let target = this.element;
      let tooltip = this.$el;
      FloatingUIDOM.computePosition(target, tooltip, {
        placement: "bottom-start",
        middleware: [
          FloatingUIDOM.shift(),
          FloatingUIDOM.offset(4),
        ],
      }).then(
        ({x,y}) => {
          Object.assign(this.$el.style, {
            left: `${x}px`,
            top: `${y}px`,
          });
        }
      )

      this.show_state = true;

    },
    hide() {
      this.show_state = false;
    },
  },
  mounted() {
    this.element.addEventListener("mouseenter", () => { this.show() });
    this.element.addEventListener("mouseleave", () => { this.hide() });
    
    this.$el.addEventListener("mouseenter", () => { this.hide() });
  }
}
</script>

<style>
  .tooltip {
    position: absolute;
    z-index: 100;

    max-width: calc(100vw - 10px); /* technical maximum; realistically should not approach */

    background-color: var(--grey-950);
    color: var(--grey-200);
    font-size: var(--text-fs-sm);
    line-height: var(--text-lh-sm);
    font-weight: 400;

    padding: var(--p-2) var(--p-3);
    border-radius: var(--br-3);
    white-space: nowrap;
    box-shadow: 0px 0px 0px rgba(0,0,0,0);

    visibility: hidden;
    opacity: 0;
    transform: translateY(2px);
    transition: all 0.15s ease-out;

  }

  .tooltip-visible {
    box-shadow: 0px 2px 4px rgba(0,0,0,0.3);

    visibility: visible;
    opacity: 1;
    transform: translateY(0px);
    transition: all 0.15s 1s ease-in;
  }

</style>