
const item_height = 24;
const indent_width = 12;

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
  data: function() {
    return {
      expand: false
    }
  },
  methods: {
    toggle: function() {
      this.$emit('toggle', this.entity_data);
      this.expand = this.entity_data.expand;
    }
  },
  template: `
    <svg>
      <rect :x="x" :y="y - 5" :width="10" height="1" fill="#44464D"></rect>
      <rect :x="8" :y="y - 14" width="calc(100% - 10px)" height="20px" class="entity-tree-select"></rect>
      <image v-if="!expand"
        class="entity-tree-expand" 
        href="nav-right.png" 
        :x="x + 7" :y="y - 12" 
        v-on:click="toggle">
      </image>
      <image v-else
        class="entity-tree-expand" 
        href="nav-down.png" 
        :x="x + 7" 
        :y="y - 12" 
        v-on:click="toggle">
      </image>

      <rect :x="x + 22" :y="y - 8" width="8px" height="8px" fill="#47B576"></rect>
      <text class="entity-tree-text noselect" :x="x + 37" :y="y">{{entity}}</text>
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
      return subtree_height(this.entity_data) - item_height - 9;
    }
  },
  template: `
    <svg>
      <rect :x="x" :y="y + 5" :width="1" :height="height()" fill="#44464D"></rect>
    </svg>`
});

Vue.component('entity-tree-list', {
  props: ['entities', 'x', 'y'],
  data: function() {
    return {
      expand: false
    }
  },
  methods: {
    toggle: function(entity) {
      this.$emit('toggle', entity);
    },
    item_y: function(item) {
      return this.y + (item * item_height);
    },
    entities_to_elems: function(h, entities) {
      let children = [];
      let height = this.y;
  
      for (const entity in entities) {
        const entity_data = entities[entity];
        let elem = h('entity-tree-item', {
          props: {
            x: this.x,
            y: height,
            entity: entity,
            entity_data: entity_data
          },
  
          on: {
            toggle: this.toggle
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
              toggle: this.toggle
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
    return h('svg', this.entities_to_elems(h, this.entities));
  }
});

Vue.component('entity-tree', {
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
                path: path,
                entities: {}
              };
            }

            Vue.set(result, name, entity);
          }
        }
      }

      return result;
    },
    update: function(container) {
      if (!container) {
        container = this.root;
      }

      const q = "(ChildOf, " + container.path + ")";
      const r = wq_query(q);
      data = JSON.parse(r);
      container.entities = this.update_scope(container.entities, data);
    },
    update_expanded: function(container) {
      if (!container) {
        container = this.root;
      }

      this.update(container);

      for (const entity in container.entities) {
        const entity_data = container.entities[entity];
        if (entity_data.expand) {
          this.update_expanded(entity_data);
        }
      }
    },
    toggle: function(entity) {
      entity.expand = !entity.expand;
      if (entity.expand) {
        this.update(entity);
      }
    }
  },
  data: function() {
    return {
      root: {
        path: "0",
        entities: {},
        expand: true
      }
    }
  },
  computed: {
    entity_count: function() {
      return this.root.entities.length;
    },
    tree_height: function() {
      return subtree_height(this.root);
    }
  },
  template: `
    <div class="entity-tree">
      <svg :height="tree_height" width="100%">
        <entity-tree-list :entities="root.entities" :x="0" :y="30" v-on:toggle="toggle">
        </entity-tree-list>
      </svg>
    </div>
    `
});
