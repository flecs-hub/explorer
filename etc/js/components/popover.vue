<template>
  <div class="popover" :class="show_state ? 'popover-visible' : ''">
    <div class="arrow"></div>
    <slot></slot>
  </div>
</template>

<script>
module.exports = {
  name: "popover",
  props: {
    element: HTMLElement,
  },
  data() {
    return {
      show_state: false,
    }
  },
  methods: {
    show() {
      this.position();
      this.show_state = true;
      setTimeout(() => {
        document.addEventListener("click", this.outside_click); 
        // close this popover when clicked outside
        window.addEventListener("resize", this.position)
        // relocate this popover when window is resized
      }, 100);
    },
    hide() {
      this.show_state = false;
      setTimeout(() => {
        // clean up listeners so they don't accumulate over time
        document.removeEventListener("click", this.outside_click);
        window.removeEventListener("resize", this.position)
      }, 100);
    },
    position() {
      let target = this.element;
      let popover = this.$el;
      const arrow_el = this.$el.querySelector('.arrow');
      
      FloatingUIDOM.computePosition(target, popover, {
        placement: "bottom-start",
        middleware: [
          FloatingUIDOM.arrow({element: arrow_el}),
          FloatingUIDOM.shift({padding: 4}),
          FloatingUIDOM.offset(8),
        ],
      }).then(
        ({x,y, placement, middlewareData}) => {
          const {x: arrowX, y: arrowY} = middlewareData.arrow;

          // position popover
          Object.assign(this.$el.style, {
            left: `${x}px`,
            top: `${y}px`,
          });

          const staticSide = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right',
          }[placement.split('-')[0]];
        
          // position popover arrow
          Object.assign(arrow_el.style, {
            left: arrowX != null ? `${arrowX - middlewareData.shift.x}px` : '', // account for shifting
            top: arrowY != null ? `${arrowY}px` : '',
            right: '',
            bottom: '',
            [staticSide]: '-5px',
          });
        }
      );
    },
    outside_click(event) {
      let target = event.target;
      let target_hit = (target == this.element || this.element.contains(target));
      // clicking on popover itself will not dismiss it
      if (target == this.$el || this.$el.contains(target)) {
        return
      };
      // clicking outside the target
      if (!target_hit) {
        this.hide();
      }
      // clicking on original trigger button when popover is already open
      if (target_hit && this.show_state) {
        this.hide();
      }
    }
  },
  created() {
  },
  mounted() {

  }

}
</script>

<style>
  .popover {
    position: absolute;
    top: 0;
    left: 0;
    /* starting position at top left corner prevents accidental invisible page expansion */

    max-width: calc(100vw - 10px); /* technical maximum; realistically should not approach */
    width: 300px;

    background-color: var(--panel-bg-secondary);
    color: var(--grey-200);
    font-size: var(--text-fs-md);
    line-height: var(--text-lh-md);
    font-weight: 400;

    padding: var(--p-4);
    border-radius: var(--br-3);
    border: 1px solid var(--grey-700);
    white-space: nowrap;
    box-shadow: 0 8px 24px rgba(0,0,0,0);

    z-index: 5;
    visibility: hidden;

    opacity: 0;
    transition: height 0.2s ease-in-out;
  }

  .popover-visible {
    box-shadow: 0 8px 24px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.3);
    visibility: visible;
    opacity: 1;

    transition: height 0.2s ease-in-out;
  }

  .arrow {
    position: absolute;
    background-color: inherit;
    width: 8px;
    height: 8px;
    transform: rotate(45deg);
    border-top: 1px solid var(--grey-700);
    border-left: 1px solid var(--grey-700);
  }

</style>