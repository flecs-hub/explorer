
const top_margin = 20;
const item_height = 24;
const indent_width = 9;

function subtree_height(entity_data) {
  let result = item_height;

  if (entity_data.expand) {
    for (let e in entity_data.entities) {
      const nested = entity_data.entities[e];
      result += this.subtree_height(nested);
    }
  }

  return result;
}

Vue.component('entity-tree-item', {
  props: ['x', 'y', 'entity', 'entity_data'],
  mounted: function() {
    this.expand = this.entity_data.expand;
  },
  data: function() {
    return {
      expand: false,
      text_elem: undefined
    }
  },
  methods: {
    toggle: function() {
      this.$emit('toggle', this.entity_data);
      this.expand = this.entity_data.expand;
    },
    search: function() {
      this.$emit('select_query', this.entity_data.path);
    },
    select: function() {
      this.$emit('select', this.entity_data);
    },
    search_x: function() {
      console.log(this.$refs.item_text);
      return 50;
    }
  },
  computed: {
    css_select_box: function() {
      if (this.entity_data.selected) {
        return "entity-tree-select entity-tree-selected";
      } else {
        return "entity-tree-select";
      }
    },
    width_select_box: function() {
      return 195 - this.x - 30;
    },
    css_text: function() {
      if (this.entity_data.selected) {
        return "entity-tree-text entity-tree-text-select noselect";
      } else {
        return "entity-tree-text noselect";
      }
    }
  },
  template: `
    <svg>
      <rect :x="x + 28" :y="y - 16" :width="width_select_box" height="23px" :class="css_select_box"
        v-on:click="select">
      </rect>

      <template v-if="entity_data.has_children">
        <rect :x="x" :y="y - 5" :width="5" height="1" fill="#44464D"></rect>
        <image v-if="!expand"
          class="entity-tree-icon" 
          href="img/nav-right.png" 
          :x="x + 2" :y="y - 12" 
          v-on:click="toggle">
        </image>
        <image v-else
          class="entity-tree-icon" 
          href="img/nav-down.png" 
          :x="x + 2" 
          :y="y - 12" 
          v-on:click="toggle">
        </image>
      </template>
      <template v-else>
        <rect :x="x" :y="y - 5" :width="15" height="1" fill="#44464D"></rect>
      </template>

      <entity-icon :x="x + 17" :y="y - 8" :entity_data="entity_data"></entity-icon>

      <text :class="css_text" :x="x + 30" :y="y" v-on:click="select" ref="item_text">{{entity}}</text>
      <rect :x="165" :y="y - 12" :width="30" height="15" :class="css_select_box"></rect>

      <image v-if="entity_data.is_component && !entity_data.is_module"
        href="img/search.png" 
        :x="170" :y="y - 12" height="13px"
        v-on:click="search" class="entity-tree-icon">
      </image>
    </svg>`
});

Vue.component('entity-tree-outline', {
  props: ['x', 'y', 'entity_data'],
  data: function() {
    return {
      expand: false
    }
  },
  methods: {
    height: function() {
      let result = subtree_height(this.entity_data) - item_height - 7;
      if (result < 0) {
        result = 0;
      }
      return result;
    }
  },
  template: `
    <svg>
      <rect :x="x" :y="y + 2" :width="1" :height="height()" fill="#44464D"></rect>
    </svg>`
});

Vue.component('entity-tree-list', {
  props: ['entities', 'x', 'y'],
  data: function() {
    return {
      expand: false
    }
  },
  computed: {
    sorted_entities: function() {
      let result = [];
      for (const entity in this.entities) {
        result.push(this.entities[entity]);
      }

      result.sort((e1, e2) => {
        if (e1.is_module == e2.is_module) {
          if (e1.is_prefab == e2.is_prefab) {
            if (e1.has_children == e2.has_children) {
              if (e1.is_component == e2.is_component) {
                return e1.name.localeCompare(e2.name);
              } else {
                if (e1.is_component) {
                  return -1;
                } else {
                  return 1;
                }
              }
            } else {
              if (e1.has_children) {
                return -1;
              } else {
                return 1;
              }
            }
          } else {
            if (e1.is_prefab) {
              return -1;
            } else {
              return 1;
            }
          }
        } else {
          if (e1.is_module) {
            return -1;
          } else {
            return 1;
          }
        }
      });

      return result;
    }
  },
  methods: {
    toggle: function(entity) {
      this.$emit('toggle', entity);
    },
    select: function(entity) {
      this.$emit('select', entity);
    },
    select_query: function(entity) {
      this.$emit('select_query', entity);
    },
    item_y: function(item) {
      return this.y + (item * item_height);
    },
    entities_to_elems: function(h, entities) {
      let children = [];
      let height = this.y;
  
      for (let i = 0; i < entities.length; i ++) {
        const entity_data = entities[i];
        let elem = h('entity-tree-item', {
          props: {
            x: this.x,
            y: height,
            entity: entity_data.name,
            entity_data: entity_data
          },
  
          on: {
            toggle: this.toggle,
            select: this.select,
            select_query: this.select_query,
          }
        });
  
        children.push(elem);

        if (entity_data.expand) {
          const nested_entities = entity_data.entities;
          const outline_elem = h('entity-tree-outline', {
            props: {
              x: this.x + indent_width,
              y: height,
              entity_data: entity_data
            }
          });
          children.push(outline_elem);
          
          const list_elem = h('entity-tree-list', {
            props: {
              entities: nested_entities,
              x: this.x + indent_width,
              y: height + item_height
            },
            on: {
              toggle: this.toggle,
              select: this.select,
              select_query: this.select_query
            }
          });
          children.push(list_elem);

          height += subtree_height(entity_data);
        } else {
          height += item_height;
        }
      }

      return children;
    }
  },
  render: function(h) {
    return h('svg', this.entities_to_elems(h, this.sorted_entities));
  }
});

Vue.component('entity-tree', {
  props: ['valid'],
  methods: {
    update_scope: function(scope, data) {
      // Store entities in new scope, so that deleted entities are automatically
      // cleaned up
      let result = {};

      if (data && data.results) {
        for (var r = 0; r < data.results.length; r ++) {
          const elem = data.results[r];
          for (var e = 0; e < elem.entities.length; e ++) {
            let path = elem.entities[e];
            let name = path.split('.').pop();

            let entity = scope[name];
            if (!entity) {
              entity = {
                expand: false,
                name: name,
                path: path,
                entities: {},
                selected: false,
                type: elem.type
              };
            }

            entity.has_children = elem.is_set[1];
            entity.is_module = elem.is_set[2];
            entity.is_component = elem.is_set[3] || elem.is_set[4];
            entity.is_prefab = elem.is_set[5];

            Vue.set(result, name, entity);
          }
        }
      }

      if (this.selection && scope[this.selection.name] != undefined) {
        if (!result[this.selection.name]) {
          // Selected entity is no longer available, clear it
          this.$emit('select');
        }
      }

      return result;
    },
    update: function(container, onready) {
      if (!container) {
        container = this.root;
      }

      const q = "(ChildOf, " + container.path + "), ?ChildOf(*, This), ?Module, ?Component, ?Tag, ?Prefab";
      app.request_query(q, (reply) => {
        container.entities = this.update_scope(container.entities, reply);
        if (onready) {
          onready();
        }
      });
    },
    update_expanded: function(container) {
      if (!container) {
        container = this.root;
      }

      this.update(container, () => {
        for (const entity in container.entities) {
          const entity_data = container.entities[entity];
          if (entity_data.expand) {
            this.update_expanded(entity_data);
          }
        }
      });
    },
    toggle: function(entity) {
      entity.expand = !entity.expand;
      if (entity.expand) {
        this.update(entity);
      }
    },
    collapse_all: function(cur) {
      if (!cur) {
        cur = this.root;
      }

      for (let k in cur.entities) {
        let ent = cur.entities[k];
        this.collapse_all(ent);
        
        ent.expand = false;
        ent.entities = {};
      }
    },
    select_recursive(entity, cur, elems, i, onready) {
      if (!cur) {
        return;
      }

      cur.expand = true;

      this.update(cur, () => {
        let next = cur.entities[elems[i]];
        if (!next) {
          if (elems[0] != "flecs" && elems[1] != "core") {
            this.select("flecs.core." + entity);
            return;
          } else {
            console.error("entity-tree: cannot navigate to entity " + elems[i]);
            this.collapse_all();
          }
        }

        if (i < (elems.length - 1)) {
          this.select_recursive(entity, next, elems, i + 1, onready);
        } else if (onready) {
          onready(next);
        }
      });
    },
    select: function(entity) {
      if (!entity) {
        if (this.selection) {
          this.selection.selected = false;
        }
        this.$emit('select');
        return;
      }

      const elems = entity.split('.');
      let cur = this.root;

      this.collapse_all();

      this.select_recursive(entity, cur, elems, 0, (item) => {
        this.evt_select(item);
      });
    },
    evt_select: function(entity) {
      if (!entity) {
        console.error("entity-tree: invalid entity selected");
        return;
      }

      if (this.selection != entity) {
        if (this.selection) {
          this.selection.selected = false;
        }
        this.selection = entity;
        entity.selected = true;
      } else {
        entity.selected = !entity.selected;
      }

      if (this.selection.selected) {
        this.$emit('select', entity);
      } else {
        this.$emit('select');
      }
    },
    evt_select_query: function(entity) {
      this.$emit('select_query', entity);
    }
  },
  data: function() {
    return {
      root: {
        path: "0",
        entities: {},
        expand: true,
        selection: undefined
      }
    }
  },
  computed: {
    entity_count: function() {
      return this.root.entities.length;
    },
    tree_height: function() {
      return subtree_height(this.root) + 100;
    },
    tree_top_margin: function() {
      return top_margin;
    },
    css: function() {
      let result = "entity-tree";
      if (!this.valid) {
        result += " invalid";
      }
      return result;
    }
  },
  template: `
    <div :class="css">
      <svg :height="tree_height" width="100%">
        <entity-tree-list :entities="root.entities" :x="0" :y="tree_top_margin" 
          v-on:toggle="toggle"
          v-on:select="evt_select"
          v-on:select_query="evt_select_query">
        </entity-tree-list>
      </svg>
    </div>
    `
});
