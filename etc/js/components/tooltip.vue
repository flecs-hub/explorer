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
  data() {
    return {
      element: undefined,
      label: undefined,
      show_state: false,
    }
  },
  methods: {
    show() {
      this.position();
      this.show_state = true;
    },
    hide() {
      this.show_state = false;
    },
    position() {
      let target = this.element;
      let tooltip = this.$el;
      FloatingUIDOM.computePosition(target, tooltip, {
        placement: "bottom-start",
        middleware: [
          FloatingUIDOM.shift({padding: 4}),
          FloatingUIDOM.offset(4),
        ],
      }).then(
        ({x,y, middlewareData}) => {
          Object.assign(this.$el.style, {
            left: `${x}px`,
            top: `${y}px`,
          });
        }
      );
    }
  },
  created() {
  },
  mounted() {
  }
}
</script>

<style>
  .tooltip {
    position: absolute;

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

    z-index: 100;

    opacity: 0;
    transform: translateY(-2px);

    transition: opacity 0.20s ease-in-out, transform 0.20s ease-in-out;
  }

  .tooltip-visible {
    box-shadow: 0px 2px 4px rgba(0,0,0,0.3);

    opacity: 1;
    transform: translateY(0px);
    transition: opacity 0.20s 0.8s ease-in-out, transform 0.20s 0.8s ease-in-out;
  }


</style>