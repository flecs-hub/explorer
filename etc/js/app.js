
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

// Longer interval when we're sure the app is in remote mode.
const INITIAL_REMOTE_REQUEST_TIMEOUT = 10000;

// App will only retry connection when in explicit remote mode.
const INITIAL_REQUEST_RETRY_INTERVAL = 200;

// Interval at which the UI will poll the remote app.
const REFRESH_INTERVAL = 1000;

// Default port for the REST interface
const DEFAULT_PORT = "27750";
const DEFAULT_HOST = "127.0.0.1:" + DEFAULT_PORT;

// Example content for local demo
const example_selected = "Earth";
const example_query = "Planet, Mass"
const example_plecs = `// For C/C++ examples, go to:
//  https://github.com/SanderMertens/flecs
using flecs.meta
using flecs.units.Mass

@brief Mass component
Struct Mass {
  value :- {f64, unit: KiloGrams}
}

with Planet {
@color #8c8c94
Mercury :- Mass{0.33e24}

@color #e39e1c
Venus :- Mass{4.87e24}

@color #6b93d6
Earth :- Mass{5.9722e24}

@color #c1440e
Mars :- Mass{0.642e24}

@color #e3dccb
Jupiter :- Mass{1898e24}
 
@color #e3e0c0
Saturn :- Mass{568e24}
  
@color #3d5ef9
Neptune :- Mass{102e24}

@color #93cdf1
Uranus :- Mass{86.8e24}
}

Earth {
  @color #dcdcdc
  Moon :- Mass{7.34767309e22}
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

function paramStr(params) {
  let url_params = "";
  if (params) {
    for (var k in params) {
      url_params += "&" + k + "=" + params[k];
    }
  }
  return url_params;
}

/*
  GLOBAL COMPONENT REGISTRATIONS
*/
Vue.component('collapsible-panel', httpVueLoader('js/collapsible_panel.vue'));
Vue.component('detail-toggle-alt', httpVueLoader('js/detail_toggle_alt.vue'));
var tooltip_component = Vue.component('tooltip', httpVueLoader('js/components/tooltip.vue'));
var popover_component = Vue.component('popover', httpVueLoader('js/components/popover.vue'));
Vue.component('url-popover', httpVueLoader('js/overlays/popovers/url-popover.vue'));
Vue.component('panel-menu', httpVueLoader('js/components/panel_menu.vue'));
Vue.component('panel-button', httpVueLoader('js/components/panel_button.vue'));
Vue.component('stat', httpVueLoader('js/components/stat.vue'));
Vue.component('stats-period', httpVueLoader('js/components/stats_period.vue'));
Vue.component('stat-chart', httpVueLoader('js/components/stat_chart.vue'));
Vue.component('stats-world', httpVueLoader('js/components/stats_world.vue'));
Vue.component('stats-pipeline', httpVueLoader('js/components/stats_pipeline.vue'));

Vue.directive('tooltip', {
  bind: function (el, binding, vnode) {
    el.addEventListener("mouseenter", () => {
      app.$refs.tooltip.element = el;
      app.$refs.tooltip.label = binding.value;
      app.$refs.tooltip.show();
    })

    // Dismiss tooltip after mouse leave or interaction
    el.addEventListener("mouseleave", () => {
      app.$refs.tooltip.hide();
    })
    el.addEventListener("click", () => {
      app.$refs.tooltip.hide();
    })
  }
})

/*
  VUE MAIN APP
*/
var app = new Vue({
  el: '#app',

  mounted: function() {
    this.$nextTick(() => {
      flecs_explorer.then(() => {
        this.ready();
      });
    });
  },

  methods: {
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

      Request.request_aborted = false;

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

              // No point in timing out sooner than retry interval
              if (timeout < retry_interval) {
                timeout = retry_interval;
              }

              console.error("request to " + host + " failed, " +
                "ensure app is running and REST is enabled " +
                "(retried " + this.retry_count + " times)");

              window.setTimeout(() => {
                this.http_request(method, host, path, recv, err, 
                  timeout, retry_interval);
              }, retry_interval);
            } else {
              if (err) err(Request.responseText);

              // If error callback did not set the connection state back to
              // local, treat this as a loss of connection event.
              if (this.connection != ConnectionState.Local) {
                if (!Request.request_aborted) {
                  this.connect();
                }
              }
            }
          } else {
            this.retry_count = 0;

            if (Request.status < 200 || Request.status >= 300) {
              if (err) {
                err(Request.responseText);
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

      return Request;
    },

    // Utility for sending HTTP requests that have a JSON reply
    json_request(method, host, path, recv, err, timeout, retry_interval) {
      return this.http_request(method, host, path, (r) => {
        const reply = JSON.parse(r);
        recv(reply);
      }, (r) => {
        if (err) {
          if (r != undefined && r.length) {
            const reply = JSON.parse(r);
            err(reply);
          } else {
            err();
          }
        }
      }, timeout, retry_interval);
    },

    // Abort request
    request_abort(id) {
      let r = this.requests[id];
      if (r) {
        r.request_aborted = true;
        r.abort();
      }
      this.requests[id] = undefined;
    },

    // Utility for sending HTTP requests to a remote app
    request(id, method, path, recv, err) {
      let existing = this.requests[id];
      if (existing) {
        if (existing.readyState == 4) {
          this.requests[id] = undefined;
        } else {
          // Request is still in progress
          return;
        }
      }
      this.requests[id] = this.json_request(
        method, this.host, path, recv, err);
    },

    // Data access
    request_entity: function(id, path, recv, err, params) {
      if (this.is_local()) {
          const r = wq_get_entity(path);
          const reply = JSON.parse(r);
          recv(reply);
      } else if (this.is_remote()) {
        this.request(id, "GET",
          "entity/" + path.replaceAll('.', '/') + paramStr(params), recv, err);
      }
    },

    request_query: function(id, q, recv, err, params) {
      if (this.is_local()) {
          const r = wq_query(q);
          const reply = JSON.parse(r);
          recv(reply);
      } else if (this.is_remote()) {
        if (q.slice(0, 2) == "?-") {
          const query_name = q.slice(2).trim();
          this.request(id,
            "GET", "query?name=" + encodeURIComponent(query_name) + paramStr(params),
            recv, err);
        } else {
          this.request(id,
            "GET", "query?q=" + encodeURIComponent(q) + paramStr(params),
            recv, err);
        }
      } else {
        err({error: "no connection"});
      }
    },

    request_stats: function(id, category, recv, err, params) {
      if (this.is_local()) {
          return "{}";
      } else if (this.is_remote()) {
        this.request(id, "GET",
          "stats/" + category + paramStr(params), recv, err);
      }
    },

    enable_entity(path) {
      if (this.is_local()) {
        wq_enable_entity(path, true);
      } else {
        this.request("enable", "PUT", "enable/" + path.replaceAll('.', '/'));
      }
    },

    disable_entity(path) {
      if (this.is_local()) {
        wq_enable_entity(path, false);
      } else {
        this.request("disable", "PUT", "disable/" + path.replaceAll('.', '/'));
      }
    },

    insert_code: function(code, recv, timeout) {
      if (this.is_local()) {
        if (this.parse_timer) {
          clearTimeout(this.parse_timer);
        }

        const func = () => {
          const r = wq_run(code);
          const reply = JSON.parse(r);
          recv(reply);
          this.parse_timer = undefined;
        };

        if (timeout) {
          this.parse_timer = setTimeout(func, timeout);
        } else {
          func();
        }
      }
    },

    get_query_from_params() {
      const q_encoded = getParameterByName("q");
      const q_string = getParameterByName("query");
      const q_name = getParameterByName("query_name");

      if (q_encoded) {
        return wq_decode(q_encoded);
      } else if (q_string) {
        return decodeURIComponent(q_string);
      } else if (q_name) {
        return "?- " + decodeURIComponent(q_name);
      }

      return undefined;
    },

    init_remote() {
      const show_tree = getParameterByName("show_tree");
      const q = this.get_query_from_params();
      var selected = getParameterByName("s");

      if (selected) {
        this.set_entity(selected);
      }

      if (q) {
        this.$refs.query.set_query(q);
      }

      if (show_tree === "false") {
        this.$refs.tree.close();
      }
    },

    ready_remote(reply) {
      // Get application name from reply
      if (reply.label && reply.label != "World") {
        this.app_name = reply.label;
        this.title = this.app_name;
      }

      this.parse_interval = 150;

      this.refresh_query();
      this.refresh_entity();
      this.refresh_tree();
      this.refresh_stats();

      // Refresh UI periodically
      this.refresh_timer = window.setInterval(() => {
        this.refresh_query();
        this.refresh_entity();
        this.refresh_tree();
        this.refresh_stats();
      }, REFRESH_INTERVAL);

      this.evt_panel_update();
    },

    ready_local() {
      this.set_entity();

      const p_encoded = getParameterByName("p");
      var q = this.get_query_from_params();
      var selected = getParameterByName("s");
      var p;

      if (p_encoded) {
        p = wq_decode(p_encoded);
      }
      if (selected === undefined && !p_encoded && !q) {
        selected = example_selected;
      }

      if (!p && !p_encoded) {
        p = example_plecs;
      }
      if (!q) {
        q = example_query;
      }

      if (p && !this.remote_mode) {
        this.$refs.plecs.set_code(p);
        this.$refs.plecs.run();
      }

      if (selected) {
        this.$refs.tree.select(selected);
      }
      if (q) {
        this.$refs.query.set_query(q);
      }

      this.$refs.tree.update_expanded();

      this.parse_interval = 150;

      this.evt_panel_update();
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

      // remote_self is the same as remote, but will always connect to the URL
      // of the explorer, instead of defaulting to localhost
      let remote_self = getParameterByName("remote_self");

      // If local param is provided, don't connect to remote
      let local = getParameterByName("local");

      // If a code snippet is provided, run in local mode
      if (getParameterByName("p")) {
        local = true;
      }

      // Store URL parameters so they can be added to shared URL
      this.params.host = host;
      this.params.port = port;
      this.params.remote = remote;
      this.params.remote_self = remote_self;
      this.params.local = local;

      // Make sure that if both remote_self and host are specified they match
      if (remote_self) {
        if (host != undefined && host != window.location.hostname) {
          console.err("remote_self conflicts with value of host param, starting in local mode");
          this.ready_local();
        }
        remote = true;
        host = window.location.hostname;
      }

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

        if (this.connection != ConnectionState.RetryConnecting) {
          /* When not reconnecting initialize app from URL arguments */
          this.init_remote();
        }

        let timeout = INITIAL_REQUEST_TIMEOUT;
        if (remote) {
          /* Tolerate a larger timeout when we're guaranteed in remote mode */
          timeout = INITIAL_REMOTE_REQUEST_TIMEOUT;
        }

        this.json_request("GET", host, "entity/flecs/core/World?label=true", (reply) => {
          this.host = host;
          this.connection = ConnectionState.Remote;
          this.ready_remote(reply);
        }, () => {
          if (!remote) {
            this.connection = ConnectionState.Local;
            this.ready_local();
          } else {
            console.warn("remote connection failed, running explorer in local mode");
            this.connection = ConnectionState.ConnectionFailed;
          }
        }, timeout, retry_interval);
      } else {
        this.connection = ConnectionState.Local;
        this.ready_local();
      }
    },

    ready() {
      this.connect();
    },

    // Set subtitle for browser tab
    set_subtitle(subtitle) {
      this.subtitle = subtitle;
    },

    // Set inspector to entity by pathname
    set_entity(path) {
      this.$refs.inspector.set_entity(path);
      this.$refs.tree.set_selected_entity(path);
    },

    set_entity_by_tree_item(item) {
      if (item) {
        this.set_entity(item.path);
      } else {
        this.set_entity();
      }
    },

    refresh_query() {
      this.$refs.query.refresh();
    },

    refresh_entity() {
      this.$refs.inspector.refresh();
    },

    refresh_tree() {
      this.$refs.tree.update_expanded();
    },

    refresh_stats() {
      if (this.$refs.stats_world) {
        this.$refs.stats_world.refresh();
        this.$refs.stats_pipeline.refresh();
      }
    },

    // Code changed event
    run_code(code, recv) {
      this.insert_code(code, (reply) => {
        this.refresh_query();
        this.$refs.tree.update_expanded();
        this.refresh_entity();
        recv(reply);
      }, this.parse_interval);
    },

    // Entity selected
    evt_entity_changed(e) {
      this.set_entity_by_tree_item(e);
    },

    // Follow entity reference
    evt_follow_ref(entity) {
      this.set_entity(entity);
    },

    evt_select_query(query) {
      this.$refs.query.set_query(query);
      this.$refs.query.open();
    },

    evt_append_query(query) {
      let q = this.$refs.query.get_query();
      if (q.length) {
        q += ", " + query;
      } else {
        q = query;
      }
      this.$refs.query.set_query(q);
      this.$refs.query.open();
    },

    evt_panel_update() {
      this.$nextTick(() => {
        if (this.$refs.panes) {
          this.$refs.panes.resize();
        }
        if (this.$refs.panel_menu) {
          this.$refs.panel_menu.refresh();
        }
      });
    },

    show_url_modal() {
      const tree_component = this.$refs.tree;
      const show_tree = !tree_component.$el.classList.contains("disable");
      const query = this.$refs.query.get_query();
      
      let plecs;
      let plecs_encoded;
      if (!this.remote_mode) {
        plecs = this.$refs.plecs.get_code();
        plecs_encoded = wq_encode(plecs);
      }

      let entity = this.$refs.inspector.get_entity();
      let sep = "?";
    
      this.url = window.location.protocol + '//' + 
                 window.location.host + 
                 window.location.pathname;

      if (this.params.host) {
        this.url += sep + "host=" + this.params.host;
        sep = "&";
      }

      if (this.params.port) {
        this.url += sep + "port=" + this.params.port;
        sep = "&";
      }

      if (this.params.remote) {
        this.url += sep + "remote=true";
        sep = "&";
      }

      if (this.params.remote_self) {
        this.url += sep + "remote_self=true";
        sep = "&";
      }

      if (this.params.local) {
        this.url += sep + "local=true";
        sep = "&";
      }

      if (query) {
        if (query.slice(0, 2) == "?-") {
          const query_encoded = encodeURIComponent(query.slice(2).trim());
          this.url += sep + "query_name=" + query_encoded;
        } else {
          const query_encoded = encodeURIComponent(query);
          this.url += sep + "query=" + query_encoded;
        }
        sep = "&";
      }

      if (!show_tree) {
        this.url += sep + "show_tree=false";
        sep = "&";
      }

      if (plecs_encoded) {
        this.url += sep + "p=" + plecs_encoded;
        sep = "&";
      }

      if (entity) {
        this.url += sep + "s=" + entity;
        sep = "&";
      }

      this.$refs.share_url_popover.show();
    },
  },

  computed: {
    valid: function() {
      return !this.code_error &&
        (this.connection == ConnectionState.Local ||
          this.connection == ConnectionState.Remote ||
            this.retry_count < 10);
    },
    remote_mode: function() {
      return (this.connection == ConnectionState.Remote) || 
        (this.connection == ConnectionState.RetryConnecting) ||
        this.params.remote || this.params.remote_self || this.params.host;
    }
  },

  data: {
    app_name: "Flecs",
    subtitle: "Flecs",
    query_error: undefined,
    code_error: undefined,
    query_result: undefined,
    selected_tree_item: undefined,
    url: undefined,
    params: {},

    connection: ConnectionState.Initializing,
    host: undefined,
    retry_count: 0,
    request_count: 0,

    requests: {},
    refresh_timer: undefined,
    parse_timer: undefined,
    parse_interval: 0
  }
});
