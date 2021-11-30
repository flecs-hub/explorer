
Vue.config.devtools = true;

// Track state of connection to remote app
const ConnectionState = {
  Initializing:     Symbol('Initializing'),
  Local:            Symbol('Local'),
  Connecting:       Symbol('Connecting'),
  RetryConnecting:  Symbol('RetryConnecting'),
  Remote:           Symbol('Remote'),
  ConnectionFailed: Symbol('ConnectionFailed')
};

// Short initial timeout to detect remote app. Should be long enough for
// an app to respond, but not too long to delay page load time.
const INITIAL_REQUEST_TIMEOUT = 300;

// App will only retry connection when in explicit remote mode.
const INITIAL_REQUEST_RETRY_INTERVAL = 200;

// Interval at which the UI will poll the remote app.
const REFRESH_INTERVAL = 1000;

// Default port for the REST interface
const DEFAULT_PORT = "27750";
const DEFAULT_HOST = "127.0.0.1:" + DEFAULT_PORT;

// Example content for local demo
const example_selected = "Bob";
const example_query = "Position, Velocity"
const example_plecs = `using flecs.meta

Struct(Position) {
  x = {f32}
  y = {f32}
}

Struct(Velocity) {
  x = {f32}
  y = {f32}
}

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

  mounted: function() {
    this.is_mounted = true;
    if (this.is_initialized) {
      this.ready();
    }
  },

  methods: {
    initialized() {
      this.is_initialized = true;
      if (this.is_mounted) {
        this.ready();
      }
    },

    is_local() {
      return this.connection == ConnectionState.Local;
    },
    is_remote() {
      return this.connection == ConnectionState.Remote;
    },

    // Utility for sending HTTP requests
    http_request(method, host, path, recv, err, timeout, retry_interval) {
      const Request = new XMLHttpRequest();
      const url = host + "/" + path;

      Request.open(method, "http://" + url);
    
      if (timeout) {
        Request.timeout = timeout;
      }

      Request.onreadystatechange = (reply) => {
        if (Request.readyState == 4) {
          if (Request.status == 0) {
            this.retry_count ++;

            // Retry if the server did not respond to request
            if (retry_interval) {
              retry_interval *= 1.3;
              if (retry_interval > 1000) {
                retry_interval = 1000;
              }

              this.$refs.terminal.clear();

              // No point in timing out sooner than retry interval
              if (timeout < retry_interval) {
                timeout = retry_interval;
              }

              this.$refs.terminal.err("request to " + host + " failed, " +
                "ensure app is running and REST is enabled " +
                "(retried " + this.retry_count + " times)");

              window.setTimeout(() => {
                this.http_request(method, host, path, recv, err, 
                  timeout, retry_interval);
              }, retry_interval);
            } else {
              if (err) err();

              // If error callback did not set the connection state back to
              // local, treat this as a loss of connection event.
              if (this.connection != ConnectionState.Local) {
                this.connect();
              }
            }
          } else {
            this.retry_count = 0;

            if (Request.status < 200 || Request.status >= 300) {
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
      }

      Request.send();
    },

    // Utility for sending HTTP requests that have a JSON reply
    json_request(method, host, path, recv, err, timeout, retry_interval) {
      this.http_request(method, host, path, (r) => {
        const reply = JSON.parse(r);
        recv(reply);
      }, err, timeout, retry_interval);
    },

    // Utility for sending HTTP requests to a remote app
    request(method, path, recv, err) {
      this.json_request(method, this.host, path, recv, err);
    },

    // Data access
    request_entity: function(path, recv, err) {
      if (this.is_local()) {
          const r = wq_get_entity(path);
          const reply = JSON.parse(r);
          recv(reply);
      } else if (this.is_remote()) {
        this.request("GET", "entity/" + path.replaceAll('.', '/'), recv, err);
      }
    },

    request_query: function(q, recv, err) {
      if (this.is_local()) {
          const r = wq_query(q);
          const reply = JSON.parse(r);
          recv(reply);
      } else if (this.is_remote()) {
        this.request("GET", "query?q=" + encodeURIComponent(q), 
          recv, err);
      }
    },

    insert_code: function(code, recv) {
      if (this.is_local()) {
        const r = wq_run(code);
        const reply = JSON.parse(r);
        recv(reply);
      }
    },

    ready_remote(reply) {
      // Get application name from reply
      for (var i = 0; i < reply.type.length; i ++) {
        const elem = reply.type[i];
        if (elem.pred == "flecs.doc.Description" && elem.obj == "Name") {
          this.title = elem.value.value;
          break;
        }
      }

      this.$refs.tree.update();

      // Refresh UI periodically
      this.refresh_timer = window.setInterval(() => {
        this.refresh_query();
        this.refresh_entity();
        this.refresh_tree();
      }, REFRESH_INTERVAL);
    },

    ready_local() {
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
    },

    // Connect to a remote host
    connect() {
      if (this.connection == ConnectionState.Remote) {
        this.connection = ConnectionState.RetryConnecting;
      } else if (this.connection != ConnectionState.Connecting &&
          this.connection != ConnectionState.RetryConnecting) {
        this.connection = ConnectionState.Connecting;
      } else {
        // Already connecting
        return;
      }

      // Reset application connection status
      this.retry_count = 0;

      if (this.refresh_timer) {
        window.clearInterval(this.refresh_timer);
      }

      // Retry interval (only when forcing remote mode)
      let retry_interval = 0;

      // Optional parameters for selecting host & port.
      let host = getParameterByName("host");
      let port = getParameterByName("port");

      // If remote param is provided, don't go to local mode
      let remote = getParameterByName("remote");

      // If local param is provided, don't connect to remote
      let local = getParameterByName("local");

      // Can't set both local and remote
      if (remote && local || host && local) {
        console.err("invalid combination of URL params, starting in local mode");
        this.ready_local();
      }

      // If we are reconnecting, use same paramaters. This also ensures that
      // once connected, the UI stays in remote mode.
      if (this.connection == ConnectionState.RetryConnecting) {
        host = this.host;
        remote = true;
      }

      // Check if a host is provided as parameter
      if (!local) {
        if (!host) {
          host = DEFAULT_HOST;
        } else {
          remote = true;
        }
      } else {
        remote = false;
      }

      if (host) {
        if (host.indexOf(':') == -1) {
          if (!port) {
            port = DEFAULT_PORT;
          }
          host += ":" + port;
        }

        if (remote) {
          retry_interval = INITIAL_REQUEST_RETRY_INTERVAL;
        }

        app.json_request("GET", host, "entity/flecs/core/World", (reply) => {
          this.host = host;
          this.connection = ConnectionState.Remote;
          this.ready_remote(reply);
        }, () => {
          if (!remote) {
            this.connection = ConnectionState.Local;
            this.ready_local();
          } else {
            console.warn("flecs: unable to connect to remote, running explorer in local mode");
            this.connection = ConnectionState.ConnectionFailed;
          }
        }, INITIAL_REQUEST_TIMEOUT, retry_interval);
      } else {
        this.connection = ConnectionState.Local;
        this.ready_local();
      }
    },

    ready() {
      this.connect();
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

  computed: {
    valid: function() {
      return !this.code_error &&
        (this.connection == ConnectionState.Local ||
          this.connection == ConnectionState.Remote ||
            this.retry_count < 10);
    }
  },

  data: {
    is_initialized: false,
    is_mounted: false,

    title: "Flecs",
    query_error: undefined,
    entity_error: undefined,
    code_error: undefined,
    query_result: undefined,
    entity_result: undefined,
    selected_tree_item: undefined,
    url: undefined,

    connection: ConnectionState.Initializing,
    retry_count: 0,

    refresh_timer: undefined
  }
});
