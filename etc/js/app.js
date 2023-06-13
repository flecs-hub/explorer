
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
const INITIAL_REMOTE_REQUEST_TIMEOUT = 1000;

// App will only retry connection when in explicit remote mode.
const INITIAL_REQUEST_RETRY_INTERVAL = 200;

// Interval at which the UI will poll the remote app.
const REFRESH_INTERVAL = 1000;

// Default port for the REST interface
const DEFAULT_PORT = "27750";
const DEFAULT_HOST = "127.0.0.1:" + DEFAULT_PORT;

// Example content for local demo
const DEFAULT_PARAM_QUERY = "CelestialBody, Mass, ?(ChildOf, $Orbits)"

// Default max number of rows to show in query results
const QUERY_DEFAULT_LIMIT = 25;

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

// Webasm module loading
let native_request;
let capture_keyboard_events;

function wasmModuleLoaded(wasm_url, onReady) {
  const name = wasm_url.slice(wasm_url.lastIndexOf("/") + 1, wasm_url.lastIndexOf("."));

  wasm_module = Function(`return ` + name + `;`)();

  wasm_module().then(function(Module) {
    native_request = Module.cwrap('flecs_explorer_request', 'string', ['string', 'string']);
    capture_keyboard_events = Module.sokol_capture_keyboard_events;
    if (capture_keyboard_events) {
      Module.sokol_capture_keyboard_events(false);
    }
    onReady();
  });
}

function loadWasmModule(wasm_url, onReady) {
  const oldEl = document.getElementById("wasm-module");
  if (oldEl) {
    oldEl.remove();
  }

  const scriptEl = document.createElement("script");
  scriptEl.id = "wasm-module";
  scriptEl.onload = () => {
    wasmModuleLoaded(wasm_url, onReady);
  };
  scriptEl.onerror = () => {
    console.error("failed to load wasm module " + wasm_url);
  };
  scriptEl.src = wasm_url;

  document.head.appendChild(scriptEl);
}

// Vue application
let app;

// Called after all components are loaded
function create_app() {
  return new Vue({
    el: '#app',

    mounted: function() {
      this.wasm_url = getParameterByName("wasm");

      if (getParameterByName("remote") || getParameterByName("host")) {
        if (this.wasm_url) {
          console.error("invalid wasm url for remote app");
          this.wasm_url = undefined;
        }

        // Don't load module when connected to remote app
        this.ready();
      } else if (!this.wasm_url) {
        // Load default explorer module
        this.wasm_url = window.location.protocol + "//" + window.location.host;
        if (window.location.pathname && window.location.pathname.length > 1) {
          this.wasm_url += window.location.pathname.slice(
            0, window.location.pathname.lastIndexOf("/"));
        }
        this.wasm_url += "/flecs_explorer.js";
      } else {
        // External module was loaded
        this.wasm = true;
      }

      if (this.wasm_url) {
        this.$nextTick(() => {
          loadWasmModule(this.wasm_url, () => {
            this.ready();
          });
        });
      }
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
        const url = "http://" + host + "/" + path;

        Request.open(method, url);
      
        if (timeout) {
          Request.timeout = timeout;
        } else {
          Request.timeout = REFRESH_INTERVAL;
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
              } else {
                if (recv) {
                  recv(Request.responseText, url);
                }
              }
            }
          }
        }

        Request.send();
        Request.url = url;

        return Request;
      },

      // Utility for sending HTTP requests that have a JSON reply
      json_request(method, host, path, recv, err, timeout, retry_interval) {
        return this.http_request(method, host, path, (r, url) => {
          if (recv) {
            if (r) {
              const reply = JSON.parse(r);
              recv(reply, url);
            } else {
              recv(url);
            }
          }
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

        return this.requests[id].url;
      },

      request_get(id, path, recv, err) {
        if (this.is_local()) {
          const r = native_request("GET", "/" + path);
          const reply = JSON.parse(r);
          recv(reply);
        } else if (this.is_remote()) {
          return this.request(id, "GET", path, recv, err);
        } else if (err) {
          err({error: "no connection"});
        }
      },

      request_put(id, path, recv, err) {
        if (this.is_local()) {
          const r = native_request("PUT", "/" + path);
          let reply;
          if (r) {
            reply = JSON.parse(r);
          }
          recv(reply);
        } else if (this.is_remote()) {
          this.request(id, "PUT", path, recv, err);
        } else if (err) {
          err({error: "no connection"});
        }
      },

      request_entity: function(id, path, recv, err, params) {
        const request = "entity/" + path.replaceAll('.', '/') + paramStr(params);
        return this.request_get(id, request, recv, err);
      },

      request_query: function(id, q, recv, err, params) {
        let request;
        if (q.slice(0, 2) == "?-") {
          let query_name = q.slice(2).trim();

          const args_start = query_name.indexOf("(");
          if (args_start != -1) {
            const args_end = query_name.indexOf(")");
            if (args_end != -1) {
              vars = query_name.slice(args_start, args_end + 1);
            } else {
              vars = query_name.slice(args_start);
            }
            query_name = query_name.slice(0, args_start);
            params.vars = vars;
          }

          request = "query?name=" + encodeURIComponent(query_name) + paramStr(params);
        } else {
          request = "query?q=" + encodeURIComponent(q) + paramStr(params);
        }

        return this.request_get(id, request, recv, err);
      },

      request_stats: function(id, category, recv, err, params) {
        this.request_get(id, "stats/" + category + paramStr(params), recv, err);
      },

      enable_entity(path) {
        this.request_put("enable", "enable/" + path.replaceAll('.', '/'), () => {
          this.refresh_entity();
          this.refresh_tree();
        });
      },

      disable_entity(path) {
        this.request_put("disable", "disable/" + path.replaceAll('.', '/'), () => {
          this.refresh_entity();
          this.refresh_tree();
        });
      },

      delete_entity(path) {
        this.request_put("delete", "delete/" + path.replaceAll('.', '/'), () => {
          this.$refs.inspector.close();
          this.refresh_tree();
        });
      },

      set_components(path, data) {
        this.request_put("set", "set/" + path.replaceAll('.', '/') +
          "?data=" + encodeURIComponent(JSON.stringify(data)), 
          () => {
            this.refresh_entity();
          });
      },

      run_code: function(code, recv) {
        this.request_put("script", "script/?data=" + encodeURIComponent(code), (msg) => {
          this.refresh_entity();
          this.refresh_tree();
          this.refresh_query();
          recv(msg);
        }, (msg) => {
          recv(msg)
        });
      },

      get_query_from_params() {
        const q_string = getParameterByName("query");
        const q_name = getParameterByName("query_name");

        if (q_string) {
          return decodeURIComponent(q_string);
        } else if (q_name) {
          return "?- " + decodeURIComponent(q_name);
        }

        return undefined;
      },

      init_from_url(remote) {
        this.$nextTick(() => {
          // Load parameters from URL
          let param_show = getParameterByName("show");
          let param_entity = getParameterByName("entity");
          let param_query = this.get_query_from_params();
          let param_script = getParameterByName("script");

          // If no parameters are provided and we're in local mode, show the
          // demo app
          if (!remote) {
            if (!param_show && !param_query && !this.wasm) {
              param_show = "tree,query,plecs"
              param_query = DEFAULT_PARAM_QUERY;
            }
          }

          if (!param_show && this.wasm) {
            param_show = "tree,explorer_canvas,query,plecs";
          }

          // Determine which panels to show
          let show;
          if (param_show) {
            show = param_show.split(",");
          } else {
            show = ["tree", "query"];
          }

          // Open the configured panels
          this.$refs.panel_menu.close_all();
          for (let i = 0; i < show.length; i++) {
            this.$refs[show[i]].open();
          }

          // Set the inspector to the selected entity
          if (param_entity) {
            this.set_entity(param_entity);
          }

          // Set the query editor to the selected query
          if (param_query) {
            const offset = getParameterByName("offset");
            const limit = getParameterByName("limit");
            this.$refs.query.set_query(param_query, offset, limit);
          }

          if (param_script) {
            this.$refs.plecs.set_code(param_script);
            this.$refs.plecs.run();
          } else {
            this.request_entity("scripts.main", "scripts.main", (msg) => {
              if (msg.values && msg.values[0]) {
                const script = msg.values[0].script;
                if (script) {
                  this.$refs.plecs.set_code(script);
                  this.$refs.plecs.run();
                }
              }
            }, undefined, {
              values: true
            });
          }
        });
      },

      start_periodic_refresh() {
        this.parse_interval = 150;

        this.refresh_query();
        this.refresh_entity();
        this.refresh_tree();
        this.refresh_stats();
        this.refresh_alerts();

        // Refresh UI periodically
        this.refresh_timer = window.setInterval(() => {
          this.refresh_query();
          this.refresh_entity();
          this.refresh_tree();
          this.refresh_stats();
          this.refresh_alerts();
        }, REFRESH_INTERVAL);

        this.evt_panel_update();
      },

      ready_remote(reply) {
        // Get application name from reply
        if (reply.label && reply.label != "World") {
          this.app_name = reply.label;
          this.title = this.app_name;
        }

        this.start_periodic_refresh();
      },

      ready_local() {
        this.init_from_url(false);
        this.start_periodic_refresh();
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
            console.error("remote_self conflicts with value of host param, starting in local mode");
            this.ready_local();
          }
          remote = true;
          host = window.location.hostname;
        }

        // Can't set both local and remote
        if (remote && local || host && local) {
          console.error("invalid combination of URL params, starting in local mode");
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
        
        if (this.wasm) {
          host = undefined;
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
            this.init_from_url(true);
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
        if (this.$refs.query) {
          this.$refs.query.refresh();
        }
      },

      refresh_entity() {
        if (this.$refs.inspector) {
          this.$refs.inspector.refresh();
        }
      },

      refresh_tree() {
        if (this.$refs.tree) {
          this.$refs.tree.update_expanded();
        }
      },

      refresh_stats() {
        if (this.$refs.stats_world) {
          this.$refs.stats_world.refresh();
        }
        if (this.$refs.stats_pipeline) {
          this.$refs.stats_pipeline.refresh();
        }
      },

      refresh_alerts() {
        if (this.$refs.alerts) {
          this.$refs.alerts.refresh();
        }
      },

      // Entity selected
      evt_entity_changed(e) {
        this.set_entity_by_tree_item(e);
      },

      // Follow entity reference
      evt_follow_ref(entity) {
        this.set_entity(entity);
      },

      evt_tree_navigate(entity) {
        if (this.$refs.tree) {
          this.$refs.tree.select(entity);
          this.$refs.tree.open();
        }
      },

      evt_select_query(query) {
        if (this.$refs.query) {
          this.$refs.query.set_query(query);
          this.$refs.query.open();
        }
      },

      evt_append_query(query) {
        let q = this.$refs.query.get_query();
        if (q.slice(0, 2) === "?-") {
          q = "";
        }
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

      evt_request_plecs_focus() {
        if (this.$refs.explorer_canvas) {
          this.$refs.explorer_canvas.blur();
        }
      },

      show_url_modal() {
        const query_params = this.$refs.query.get_query_params();

        let plecs;
        let plecs_encoded;
        if (!this.remote_mode) {
          plecs = this.$refs.plecs.get_code();
          if (plecs && plecs.length) {
            plecs_encoded = encodeURIComponent(plecs);
          }
        }

        let entity = this.$refs.inspector.get_entity();
        let sep = "?";
      
        this.url = window.location.protocol + '//' + 
                  window.location.host + 
                  window.location.pathname;

        this.url += "?show=";
        const refs = ['query', 'tree', 'plecs', 'stats', 'alerts', 'inspector', 
          'explorer_canvas', 'stats_world', 'stats_pipeline'];
        let active_refs = [];

        for (let k in refs) {
          const el = this.$refs[refs[k]];
          if (el && el.$el && !el.$el.classList.contains("disable")) {
            active_refs.push(refs[k]);
          }
        }
        this.url += active_refs.join(",");
        sep = "&";

        if (this.params.host) {
          this.url += sep + "host=" + this.params.host;
        }

        if (this.params.port) {
          this.url += sep + "port=" + this.params.port;
        }

        if (this.params.remote) {
          this.url += sep + "remote=true";
        }

        if (this.params.remote_self) {
          this.url += sep + "remote_self=true";
        }

        if (this.params.local) {
          this.url += sep + "local=true";
        }

        if (this.wasm) {
          this.url += sep + "wasm=" + this.wasm_url;
        }

        if (query_params) {
          this.url += sep + query_params;
        }

        if (plecs_encoded) {
          this.url += sep + "p=" + plecs_encoded;
        }

        if (entity) {
          this.url += sep + "entity=" + entity;
        }

        window.history.pushState({}, "", this.url);
      },

      rest_world_link() {
        window.open("http://" + this.host + "/world", '_blank');
      }
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
      wasm_url: undefined,
      wasm: false,
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
}

// Create tooltip directive
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
});

// Load vue components
let components = [
  httpVueLoader('js/overlays/popovers/url-popover.vue')(),
  httpVueLoader('js/components/panel_menu.vue')(),
  httpVueLoader('js/components/panel_button.vue')(),
  httpVueLoader('js/components/content_container.vue')(),
  httpVueLoader('js/components/editor_textarea.vue')(),
  httpVueLoader('js/components/editor.vue')(),
  httpVueLoader('js/components/query_footer.vue')(),
  httpVueLoader('js/components/query_graph.vue')(),
  httpVueLoader('js/components/query_results_table.vue')(),
  httpVueLoader('js/components/query_results.vue')(),
  httpVueLoader('js/components/query_editor.vue')(),
  httpVueLoader('js/components/query.vue')(),
  httpVueLoader('js/components/stat.vue')(),
  httpVueLoader('js/components/stats_period.vue')(),
  httpVueLoader('js/components/stat_chart.vue')(),
  httpVueLoader('js/components/stats_world.vue')(),
  httpVueLoader('js/components/stats_pipeline.vue')(),
  httpVueLoader('js/components/alerts.vue')(),
  httpVueLoader('js/components/inspector_alerts.vue')(),
  httpVueLoader('js/components/tooltip.vue')(),
  httpVueLoader('js/components/popover.vue')()
];

Promise.all(components).then((values) => {
  for (let c of values) {
    Vue.component(c.name, c);
  }

  app = create_app();
});
