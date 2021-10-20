
Vue.config.devtools = true;

const example_query = "ChildOf(_Planet, Sun), Planet(_Planet), ChildOf(_Moon, _Planet), Satellite(_Moon)"

const example_plecs = `// This example creates a solar system and shows 
// how to use entity hierarchies and relations. 
// Changing the code updates the viewer

// Planet queries must match RockyPlanet/GasGiant
(IsA, Planet) { RockyPlanet, GasGiant }

// Sun entity with Star tag & planets as children
Star(Sun) {
 // Create entities with RockyPlanet tag
 with RockyPlanet { Earth, Mars }

 // Create entities with GasGiant tag
 with GasGiant { Jupiter, Saturn }

 // Create entities with DwarfPlanet tag
 with DwarfPlanet { Pluto, Ceres }
}

// Add child entities to planets
Sun.Earth {
 with Satellite { Moon }
 with Continent {
  Europe, Asia, Africa, Australia, NorthAmerica, 
  SouthAmerica, Antartica
 }
 
 NorthAmerica {
  with Country { Canada, UnitedStates, Mexico }
  UnitedStates {
    with City { SanFrancisco }
  }
 }
}

Sun.Mars {
 with Satellite { Phobos, Deimos }
}

Sun.Jupiter {
 with Satellite { Europa, Io }
}

Sun.Pluto {
 with Satellite { Charon }
}

`

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
      } else {
        this.$refs.plecs.set_code(example_plecs);
      }

      if (selected) {
        this.$refs.tree.select(selected);
      }

      this.$refs.plecs.run();
      this.$refs.tree.update();
    },

    query_on_changed(e) {
      const query = e.query;

      this.$refs.terminal.clear();

      this.$refs.terminal.log({
        text: "Run query \"" + query + "\"",
        kind: "command"
      });

      if (!query || query.length <= 1) {
        this.data = undefined;
        this.error = false;
        if (query.length == 1) {
          this.$refs.terminal.log({
            text: "Query is too short \"" + query + "\"",
            kind: "error"
          });
        }
        return;
      }

      const r = wq_query(query);
      this.data = JSON.parse(r);

      if (this.data.valid == false) {
        this.$refs.terminal.log({text: this.data.error, kind: "error"});
      } else {
        this.$refs.terminal.log({text: "Ok", kind: "ok" });
      }

      this.error = this.data.valid == false;
    },

    run_code(code) {
      this.$refs.terminal.clear();

      const r = wq_run(code);
      const data = JSON.parse(r);

      this.run_ok = data.valid == true;
      this.run_error = data.valid == false;

      if (!this.$refs.query.is_empty()) {
        this.$refs.query.refresh();
      } else {
        this.$refs.terminal.log({
          text: "Run plecs code",
          kind: "command"
        });

        if (!this.run_error) {
          this.$refs.terminal.log({text: "Ok", kind: "ok" });
        } else {
          this.$refs.terminal.log({text: data.error, kind: "error"});
        }
      }

      this.$refs.tree.update_expanded();
      this.select(this.selection);
    },

    show_url() {
      const query = this.$refs.query.get_query();
      const plecs = this.$refs.plecs.get_code();

      const query_encoded = wq_encode(query);
      const plecs_encoded = wq_encode(plecs);
      
      this.url = window.location.href + 
        "?q=" + query_encoded + "&p=" + plecs_encoded;

      if (this.selection) {
        this.url += "&s=" + this.selection.path;
      }

      this.$refs.url.show();
    },

    select(e) {
      this.selection = e;
      if (e) {
        const r = wq_get_entity(e.path);
        this.entity_data = JSON.parse(r);
        
        if (this.entity_data.valid == false) {
          this.entity_data = undefined;
        }
      } else {
        this.entity_data = undefined;
      }
    },

    evt_select(entity) {
      this.$refs.tree.select(entity);
    }
  },

  data: {
    query_ok: "",
    error: false,
    run_ok: false,
    run_error: false,
    data: undefined,
    entity_data: undefined,
    selection: undefined,
    url: undefined
  }
});
