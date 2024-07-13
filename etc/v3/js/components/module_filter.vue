<template>
  <div class="module-filter">
    <template v-for="(v, i) in items" v-if="show_module(i)">
      <span style="white-space: nowrap;">
      <span v-if="v.is_parent" :class="css_expand(i)" :style="'border-color: ' + color(i)"
        v-on:click="toggle_parent(v.module, i)">
        <template v-if="!items[i].visible">+</template>
        <template v-else>-</template>
      </span><span :class="css(i)" :style="'border-color: ' + color(i)" v-on:click="toggle(i)">
        {{ v.module }}
        <template v-if="module_count(i)">({{ module_count(i) }})</template>
      </span>
      </span>
    </template>
    <span class="noselect module-button select-all-button" v-on:click="select_all">Select all</span>
    <span class="noselect module-button select-all-button" v-on:click="deselect_all">Deselect all</span>
  </div>
</template>

<script>
  module.exports = {
    name: "module-filter",
    props: {
      modules: {
        type: Array,
        required: true
      }
    },
    watch: {
      modules: function() {
        let all_modules = {};
        for (let m of this.items) {
          all_modules[m.module] = m;
          m.total_count = 0;
        }

        for (let i = 0; i < this.modules.length; i ++) {
          let input = this.modules[i];
          let m = input.name;
          let count = input.count;
          let is_parent = false;
          do {
            let item = all_modules[m];
            let parent = this.get_parent(m);
            if (item === undefined) {
              item = all_modules[m] = {module: m};
              item.enabled = true;
              item.parent = parent;
              item.visible = parent === undefined;
              item.total_count = 0;
            }
            item.is_parent = is_parent;
            m = parent;
            if (is_parent) {
              item.total_count += count;
            } else {
              item.count = count;
            }
            is_parent = true;
          } while (m);
        }

        let items = [];
        for (let m in all_modules) {
          items.push(all_modules[m]);
        }

        this.items = items.sort(function(a, b) {
          return a.module.localeCompare(b.module);
        });
      }
    },
    data: function() {
      return {
        items: []
      }
    },
    methods: {
      color: function(index) {
        return COLORS[index % COLORS.length];
      },
      toggle: function(index) {
        let item = this.items[index];
        let value = item.enabled = !item.enabled;
        this.$emit("toggle", {module: this.items[index].module, enabled: value});
        if (item.is_parent) {
          this.toggle_children(index, value);
        }
      },
      toggle_children: function(index, value) {
        let parent = this.items[index].module;
        for (let i = index + 1; i < this.items.length; i++) {
          let item = this.items[i];
          if (item.parent === parent) {
            if (item.enabled != value) {
              item.enabled = value;
              this.$emit("toggle", {module: item.module, enabled: value});
            }
            if (item.is_parent) {
              this.toggle_children(i, value);
            }
          }
        }
      },
      select_all: function() {
        this.toggle_all(true);
      },
      deselect_all: function() {
        this.toggle_all(false);
      },
      toggle_all: function(value) {
        for (let i = 0; i < this.items.length; i++) {
          if (this.items[i].enabled != value) {
            this.items[i].enabled = value;
            this.$emit("toggle", {module: this.items[i].module, enabled: value});
          }
        }
      },
      toggle_parent: function(parent, index) {
        this.items[index].visible = !this.items[index].visible;
      },
      css_expand: function(index) {
        let result = "noselect module-button module-button-expand";
        if (!this.items[index].enabled) {
          result += " module-button-disabled";
        }
        return result;
      },
      css: function(index) {
        let result = "noselect module-button";
        if (!this.items[index].enabled) {
          result += " module-button-disabled";
        }
        if (this.items[index].is_parent) {
          result += " module-button-parent";
        }
        return result;
      },
      get_parent(module) {
        return module.split(".").slice(0, -1).join(".");
      },
      show_module(index) {        
        return this.module_visibility[this.items[index].module];
      },
      module_count(index) {
        let item = this.items[index];
        if (item.visible || !item.is_parent) {
          return item.count;
        } else {
          let count = 0;
          if (item.count !== undefined) {
            count = item.count;
          }
          return item.total_count + count;
        }
      }
    },
    computed: {
      module_visibility: function() {
        let visibility = {};
        for (let i = 0; i < this.items.length; i++) {
          let item = this.items[i];
          visibility[item.module] = {visible: item.visible, index: i};
        }

        let result = {};
        for (let i = 0; i < this.items.length; i++) {
          let item = this.items[i];
          let parent = item.parent;
          let visible = true;
          while (parent) {
            let parent_elem = visibility[parent];
            if (!parent_elem.visible) {
              visible = false;
              break;
            }

            let parent_item = this.items[parent_elem.index];
            parent = parent_item.parent;
          }
          result[item.module] = visible;
        }

        return result;
      }
    }
  }
</script>

<style>
  div.module-filter {
    margin-bottom: 12px;
  }

  span.module-button {
    background-color: var(--panel-bg);
    border-radius: 6px;
    border-style: solid;
    border-width: 1px;
    border-bottom-width: 3px;
    border-color: var(--steel-600);

    padding: 10px;
    padding-top: 7px;
    padding-bottom: 7px;
    margin-right: 8px;
    margin-bottom: 8px;
    color: var(--secondary-text);
    cursor: pointer;
    transition: color 0.1s ease-in-out;
  }

  span.module-button-parent {
    border-left-width: 0px;
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
    margin-left: 0px;
    padding-left: 0px;
  }

  span.module-button-expand {
    border-right-width: 0px;
    border-top-right-radius: 0px;
    border-bottom-right-radius: 0px;
    margin-right: 0px;
    padding-right: 8px;
    width: 8px;
  }

  span.module-button-disabled {
    color: var(--tertiary-text);
    opacity: 0.5;
  }

  span.select-all-button:hover {
    color: var(--primary-text);
  }
  span.module-button-expand:hover {
    color: var(--primary-text);
  }
</style>
