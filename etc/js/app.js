
Vue.config.devtools = true;

const example_query = "Position, Velocity"

const example_plecs = `using flecs.meta

Struct(Vec2) {
  x = {f32}
  y = {f32}
}

Position : Vec2
Velocity : Vec2

with Position {
  Bob   = {1, 1}
  Alice = {2, 3}
  John  = {5, 8}
  Jane  = {13, 21}
}

with Velocity {
  Bob   = {3, 1}
  Alice = {4, 1}
  John  = {5, 9}
  Jane  = {2, 6}
}
`

const example_selected = "Bob";

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
    request(method, url, recv, err) {
      const Request = new XMLHttpRequest();
      
      Request.open(method, window.location.protocol + "//" + url);
      Request.send();
      Request.onreadystatechange = (reply) => {
        if (Request.readyState == 4) {
          if (Request.status == 0) {
            if (err) {
              err();
            }
          } else if (Request.status < 200 || Request.status >= 300) {
            if (err) {
              err();
            }
          } else if (Request.responseText && Request.responseText.length) {
            if (recv) {
              recv(Request.responseText);
            }
          }
        }
      }
    },

    remote_request(method, path, recv, err) {
      const url = window.location.hostname + ":27750/" + path;
      this.request(method, url, (r) => {
        const reply = JSON.parse(r);
        recv(reply);
      }, err);
    },

    // Data access
    request_entity: function(path, recv, err) {
      if (!this.remote) {
          const r = wq_get_entity(path);
          const reply = JSON.parse(r);
          recv(reply);
      } else {
        this.remote_request("GET", "entity/" + path.replaceAll('.', '/'), recv, err);
      }
    },

    request_query: function(q, recv, err) {
      if (!this.remote) {
          const r = wq_query(q);
          const reply = JSON.parse(r);
          recv(reply);
      } else {
        this.remote_request("GET", "query?q=" + encodeURIComponent(q), 
          recv, err);
      }
    },

    insert_code: function(code, recv) {
      if (!this.remote) {
        const r = wq_run(code);
        const reply = JSON.parse(r);
        recv(reply);
      }
    },

    // Called when app is ready
    ready() {
      app.remote_request("GET", "entity/flecs/core/World", (reply) => {
        for (var i = 0; i < reply.type.length; i ++) {
          const elem = reply.type[i];
          if (elem.pred == "flecs.doc.Description" && elem.obj == "Name") {
            this.title = elem.value.value;
            break;
          }
        }

        this.remote = true;
        this.$refs.tree.update();

        this.refresh_timer = window.setInterval(() => {
          this.refresh_query();
          this.refresh_entity();
          this.refresh_tree();
        }, 500);
      }, () => {
        console.warn("flecs: unable to connect to remote, running explorer in local mode");

        const q_encoded = getParameterByName("q");
        const p_encoded = getParameterByName("p");
        var selected = getParameterByName("s");
        var p, q;

        if (p_encoded) {
          p = wq_decode(p_encoded);
        }
        if (q_encoded) {
          q = wq_decode(q_encoded);
        }
        if (selected === undefined && !p_encoded && !q_encoded) {
          selected = example_selected;
        }

        if (!p && !p_encoded) {
          p = example_plecs;
        }
        if (!q && !q_encoded) {
          q = example_query;
        }

        if (p) {
          this.$refs.plecs.set_code(p);
          this.$refs.plecs.run();
        }
        if (selected) {
          this.$refs.tree.select(selected);
        }
        if (q) {
          this.$refs.query.set_query(q);
        }

        this.$refs.tree.update();
      });
    },

    refresh_terminal() {
      this.$refs.terminal.clear();

      if (this.code_error) {
        this.$refs.terminal.log({text: "Code error: " + this.code_error, kind: "command-error" });
      }

      const q_err = this.$refs.query.get_error();
      if (q_err) {
        this.$refs.terminal.log({text: "Query error: " + q_err, kind: "command-error" });
      }
    },

    refresh_query() {
      this.$refs.query.refresh();
    },

    refresh_entity() {
      this.evt_entity_changed(this.selected_tree_item);
    },

    refresh_tree() {
      this.$refs.tree.update();
    },

    // Query changed event
    evt_query_changed(query) {
      this.refresh_terminal();
    },

    // Code changed event
    evt_code_changed(code) {
      this.insert_code(code, (reply) => {
        this.code_error = reply.error;
        if (reply.error === undefined) {
          this.refresh_query();
          this.$refs.tree.update();
          this.refresh_entity();
        }
      });
      this.refresh_terminal();
    },

    // Entity selected
    evt_entity_changed(e) {
      this.selected_tree_item = e;
      if (e) {
        this.request_entity(e.path, (reply) => {
          this.entity_error = reply.error;
          if (this.entity_error === undefined) {
            this.entity_result = reply;
            this.$refs.inspector.expand();
          }
        }, () => {
          this.entity_result = undefined;
          this.entity_error = "request for entity '" + e.path + "' failed";
        });
      }
      this.refresh_terminal();
    },

    // Follow entity reference
    evt_follow_ref(entity) {
      this.$refs.tree.select(entity);
    },

    evt_select_query(query) {
      this.$refs.query.set_query(query);
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
    title: "Flecs Explorer",
    query_error: undefined,
    entity_error: undefined,
    code_error: undefined,
    query_result: undefined,
    entity_result: undefined,
    selected_tree_item: undefined,
    url: undefined,
    remote: false,

    refresh_timer: undefined
  }
});
