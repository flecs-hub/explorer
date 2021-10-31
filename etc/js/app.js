
Vue.config.devtools = true;

const example_query = "(ChildOf, my_spaceship)"

const example_plecs = `/// Module for organizing game assets
Module(assets) {
  // flecs.meta enables type creation at runtime
  using flecs.meta

  Struct(Position) {
    x = {f32}
    y = {f32}
  }

  Property : f32
  Health : Property
  Attack : Property

  Prefab(Turret) {
    (Health){15}
  }

  Prefab(SpaceShip) {
    (Health){75}
  }

  Prefab(BattleShip) : SpaceShip {
    (Attack){50}
    
    Prefab(LeftTurret) : Turret
    Prefab(RightTurret) : Turret
  }
}

using assets

/// A spaceship to play around with
my_spaceship : BattleShip {
  (Position){10, 20}
}

`

const example_selected = "my_spaceship";

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return undefined;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


var app = new Vue({
  el: '#app',

  methods: {
    // Called when app is ready
    ready() {
      const q_encoded = getParameterByName("q");
      const p_encoded = getParameterByName("p");
      const selected = getParameterByName("s");

      if (q_encoded != undefined) {
        const q = wq_decode(q_encoded);
        this.$refs.query.set_query(q);
      } else {
        this.$refs.query.set_query(example_query);
      }

      if (p_encoded != undefined) {
        const p = wq_decode(p_encoded);
        this.$refs.plecs.set_code(p);

        if (selected) {
          this.$refs.tree.select(selected);
        }
      } else {
        this.$refs.plecs.set_code(example_plecs);
        this.$refs.tree.select(example_selected);
      }

      this.$refs.plecs.run();
      this.$refs.tree.update();
    },

    // Refresh views
    refresh(new_query, new_code) {
      let has_code = this.$refs.plecs.get_code();
      let has_query = this.$refs.query.get_query();
      let update_code = new_code != undefined;
      let update_query = new_query != undefined;
      let update_inspector = false;
      let update_tree = false;

      this.$refs.terminal.clear();

      // Update code first, as this can impact all other elements
      if (update_code) {
        const reply_json = wq_run(new_code);
        const reply = JSON.parse(reply_json);
        if (!reply) {
          this.code_error = "invalid response from code server";
        } else if (reply.error != undefined) {
          this.code_error = reply.error;
        } else {
          this.code_error = undefined;
          update_tree = true;
          update_query = true;
          update_inspector = true;
        }
      }

      // Handle empty queries, make sure results are cleared
      if (this.$refs.query.is_empty()) {
        update_query = false;
        this.query_result = undefined;
        this.query_error = undefined;
        has_query = false;
      }

      // Update query
      if (update_query) {
        if (!new_query) {
          new_query = this.$refs.query.get_query();
        }

        if (new_query.trim().length == 1) {
          this.query_error = "query is too short";
        } else {
          const reply_json = wq_query(new_query);
          let reply = JSON.parse(reply_json);
          if (!reply) {
            this.query_error = "invalid response from query server";
          } else if (reply.error != undefined) {
            this.query_error = reply.error;
          } else {
            this.query_result = reply;
            this.query_error = false;
          }
        }
      }

      // Mark query result as invalid or out of date if error occurred
      if (this.query_error || this.code_error) {
        if (this.query_result) {
          this.query_result.valid = false;
        }
      }

      // Update entity tree
      if (update_tree) {
        this.$refs.tree.update_expanded();
      }

      if (update_inspector) {
        if (this.selected_tree_item) {
          this.evt_select_tree_item(this.selected_tree_item);
        }
      }

      // Update error logging
      if (has_code) {
        if (this.code_error) {
          this.$refs.terminal.log({text: "Code error: " + this.code_error, kind: "command-error" });
        } else {
          this.$refs.terminal.log({text: "Code OK", kind: "command-ok" });
        }
      }

      if (has_query) {
        if (this.query_error) {
          this.$refs.terminal.log({text: "Query error: " + this.query_error, kind: "command-error" });
        } else {
          let msg = "Query OK";
          if (this.query_result.eval_duration.toFixed(4) != 0) {
            msg += " (completed in " + this.query_result.eval_duration.toFixed(4) + "s)";
          }
          this.$refs.terminal.log({text: msg, kind: "command-ok" });
          this.query_result.valid = true;
        }
      }
    },

    // Query changed event
    evt_query_changed(e) {
      this.refresh(e.query, undefined);
    },

    // Code changed event
    evt_code_changed(code) {
      this.refresh(undefined, code);
    },

    // Entity tree select event
    evt_select_tree_item(e) {
      this.selected_tree_item = e;
      if (e) {
        const r = wq_get_entity(e.path);
        let entity_data = JSON.parse(r);
        this.entity_data = entity_data;
      } else {
        this.entity_data = undefined;
      }

      if (this.entity_data) {
        this.entity_data.valid = this.entity_data.error === undefined;
        this.$refs.inspector.expand();
      }
    },

    // Entity select event
    evt_select(entity) {
      this.$refs.tree.select(entity);
    },

    show_url() {
      const query = this.$refs.query.get_query();
      const plecs = this.$refs.plecs.get_code();

      const query_encoded = wq_encode(query);
      const plecs_encoded = wq_encode(plecs);
      
      this.url = window.location.protocol + '//' + 
                 window.location.host + 
                 window.location.pathname +
                 "?q=" + query_encoded + "&p=" + plecs_encoded;

      if (this.selected_tree_item) {
        this.url += "&s=" + this.selected_tree_item.path;
      }

      this.$refs.url.show();
    },
  },

  data: {
    query_ok: "",
    query_error: undefined,
    code_error: undefined,
    query_result: undefined,
    entity_data: undefined,
    selected_tree_item: undefined,
    url: undefined
  }
});
