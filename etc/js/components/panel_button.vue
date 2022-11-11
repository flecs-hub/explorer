<template>
  <div :class="css">
    <div :class="dot_css"></div>
    <icon-button 
        :icon="'codicons:' + icon"
        :size="25"
        :active="active"
        v-on:click.stop="evt_select_panel"/>
  </div>
</template>

<script>
  module.exports = {
    name: "panel-button",
    props: {
      icon: String,
      panel: String
    },
    data: function() {
      return {
        active: true,
        hidden: false
      }
    },
    methods: {
      get_panel() {
        return this.$root.$refs[this.panel];
      },
      evt_select_panel() {
        const p = this.get_panel(); 
        if (p) {
          if (this.active) {
            p.close();
          } else {
            p.open();
          }
        }
      },
      refresh() {
        const p = this.get_panel();
        if (!p) {
          this.hidden = true;
          return;
        } else {
          this.hidden = false;
        }

        this.active = !p.$el.classList.contains("disable");
      }
    },
    computed: {
      css: function() {
        let result = "panel-button";
        if (this.hidden) {
          result += " panel-button-hidden";
        }
        return result;
      },
      dot_css: function() {
        let result = "panel-button-dot";
        if (this.active) {
          result += " panel-button-dot-active";
        }
        return result;
      }
    }
  }
</script>

<style>

div.panel-button {
  position: relative;
  margin-top: 10px;
}

div.panel-button-hidden {
  display: none
}

div.panel-button-dot {
  position: absolute;
  background-color: #A2D8B4;
  top: 4px;
  left: -15px;
  height: 14px;
  width: 4px;
  border-radius: 0px 2px 2px 0px;
  transition: left 0.1s, height 0.3ms, top 0.3ms;
}

div.panel-button-dot-active {
  left: -10px;
}

</style>
