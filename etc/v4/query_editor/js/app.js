
function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return undefined;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
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

function nameQueryFromExpr(expr, oneof) {
  if (!expr) {
    return {
      parent: undefined,
      expr: undefined,
      query: undefined
    };
  }

  let parent;
  let last_sep = expr.lastIndexOf(".");
  if (last_sep != -1) {
    parent = expr.slice(0, last_sep);
    expr = expr.slice(last_sep + 1, expr.length);
  } else {
    parent = oneof;
  }

  let query;
  if (parent) {
    query = `(ChildOf, ${parent})`
    if (expr.length) {
      query += `, $this ~= "${expr}"`;
    }
  } else {
    query = `$this ~= "${expr}"`;
  }

  return {
    parent: parent,
    expr: expr,
    query: query
  };
}

function fmtDuration(seconds) {
  let result = "";

  if (seconds === 0) {
    return "0s";
  }

  let days = Math.floor(seconds / (24 * 60 * 60));
  seconds -= days * (24 * 60 * 60);

  let hours = Math.floor(seconds / (60 * 60));
  seconds -= hours * (60 * 60);

  let minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  
  if (days) {
    result += days + "d\xa0";
  }
  if (hours || (result.length && minutes && seconds)) {
    result += hours + "h\xa0";
  }
  if (minutes || (result.length && seconds)) {
    result += minutes + "min\xa0";
  }
  if (seconds) {
    if (seconds < 1.0 && (!days && !hours && !minutes)) {
      // Small duration, multiply until we have something that's > 1
      let multiplied = 0;
      if (seconds > 0) {
        do {
          multiplied ++;
          seconds *= 1000;
        } while (seconds < 1.0);
      }

      result += seconds.toFixed(2);
      result += ['s', 'ms', 'us', 'ns', 'ps'][multiplied];
    } else {
      // don't bother with decimals of seconds when the duration is longer than
      // a minute.
      result += Math.round(seconds);
      result += "s";
    }
  }

  return result;
}

let components = [
  // Common components
  loadModule('js/components/title-bar.vue', options),
  loadModule('js/components/menu-bar.vue', options),
  loadModule('js/components/menu-button.vue', options),
  loadModule('js/components/icon.vue', options),
  loadModule('js/components/toggle.vue', options),
  loadModule('js/components/search-box.vue', options),
  loadModule('js/components/tabs.vue', options),
  loadModule('js/components/app-menu.vue', options),
  loadModule('js/components/code-editor.vue', options),
  loadModule('js/components/prop-browser.vue', options),
  loadModule('js/components/url-bar.vue', options),
  loadModule('js/components/entity-path.vue', options),
  loadModule('js/components/entity-parent.vue', options),
  loadModule('js/components/entity-name.vue', options),

  // Entities page
  loadModule('js/components/pages/entities/page.vue', options),
  loadModule('js/components/pages/entities/pane-tree.vue', options),
  loadModule('js/components/pages/entities/pane-inspector.vue', options),
  loadModule('js/components/pages/entities/entity-tree.vue', options),
  loadModule('js/components/pages/entities/entity-subtree.vue', options),
  loadModule('js/components/pages/entities/entity-tree-item.vue', options),
  loadModule('js/components/pages/entities/entity-tree-icon.vue', options),
  loadModule('js/components/pages/entities/entity-inspector.vue', options),
  loadModule('js/components/pages/entities/entity-inspector-module.vue', options),
  loadModule('js/components/pages/entities/entity-inspector-component.vue', options),
  loadModule('js/components/pages/entities/entity-inspector-value.vue', options),
  loadModule('js/components/pages/entities/entity-inspector-kv.vue', options),
  loadModule('js/components/pages/entities/entity-inspector-field.vue', options),

  // Queries page
  loadModule('js/components/pages/queries/page.vue', options),
  loadModule('js/components/pages/queries/pane-query.vue', options),
  loadModule('js/components/pages/queries/pane-inspect.vue', options),
  loadModule('js/components/pages/queries/query-editor.vue', options),
  loadModule('js/components/pages/queries/query-browser.vue', options),
  loadModule('js/components/pages/queries/query-json.vue', options),
  loadModule('js/components/pages/queries/query-status.vue', options),
  loadModule('js/components/pages/queries/query-plan.vue', options),
  loadModule('js/components/pages/queries/query-profile.vue', options),
  loadModule('js/components/pages/queries/query-expr.vue', options),
  loadModule('js/components/pages/queries/query-schema.vue', options),
  loadModule('js/components/pages/queries/query-inspect.vue', options),
  loadModule('js/components/pages/queries/query-c.vue', options),
  loadModule('js/components/pages/queries/query-cpp.vue', options),
  loadModule('js/components/pages/queries/query-js.vue', options),
  loadModule('js/components/pages/queries/query-rest.vue', options),
  loadModule('js/components/pages/queries/query-api.vue', options),
  loadModule('js/components/pages/queries/query-error.vue', options),
  loadModule('js/components/pages/queries/query-list-item.vue', options),

  // Commands page
  loadModule('js/components/pages/commands/page.vue', options),
  loadModule('js/components/pages/commands/pane-header.vue', options),
  loadModule('js/components/pages/commands/pane-inspect.vue', options),
  loadModule('js/components/pages/commands/inspect-sync.vue', options),
  loadModule('js/components/pages/commands/inspect-cmd-header.vue', options),
  loadModule('js/components/pages/commands/inspect-cmd-history.vue', options),
  loadModule('js/components/pages/commands/inspect-cmd.vue', options),

  // Info page
  loadModule('js/components/pages/info/page.vue', options),
  loadModule('js/components/pages/info/pane-info.vue', options),
];

let HostParam = getParameterByName("host");
if (HostParam) {
  if (HostParam.indexOf(":") == -1) {
    HostParam += ":27750";
  }
} else {
  HostParam = "localhost:27750";
}

let QueryParam = getParameterByName("query");
if (!QueryParam) {
  QueryParam = "(ChildOf, flecs)";
}

Promise.all(components).then((values) => {
  let app = Vue.createApp({
    created() {
      this.conn = flecs.connect({
        host: "http://" + HostParam,

        // Copy host to reactive property
        on_host: function(host) {
          this.app_state.host = host;
        }.bind(this),
        
        // Copy connection status to reactive property
        on_status: function(status) {
          this.app_state.status = status;
        }.bind(this),

        // Copy heartbeat to reactive properties
        on_heartbeat: function(msg) {
          this.app_state.heartbeat = msg;
          this.app_state.heartbeats_received ++;
          this.app_state.app_name = msg.label;
          this.app_state.requests.received = this.conn.requests.received;
          this.app_state.requests.sent = this.conn.requests.sent;
          this.app_state.requests.error = this.conn.requests.error;
          this.app_state.bytes.received = this.conn.bytes.received;

          if (msg.components && msg.components.WorldSummary) {
            this.app_state.world_info = msg.components.WorldSummary;
            this.app_state.build_info = msg.components.WorldSummary.build_info;
          }
        }.bind(this)
      });

      // Start timer to track command counts. Run timer separately from 
      // heartbeats so we still populate the array even if the connection is
      // gone.
      setInterval(function() {
        if (this.app_state.world_info && 
            this.app_state.status == flecs.ConnectionStatus.Connected) 
        {
          if (this.prev_command_count == -1) {
            // First received heartbeat. To ensure we don't insert a very large
            // value, just set the prev count. 
          } else {
            this.app_state.command_counts.unshift(
              this.app_state.world_info.command_count - this.prev_command_count);
          }
          this.prev_command_count = this.app_state.world_info.command_count;
        } else {
          this.app_state.command_counts.unshift(-1);
          this.prev_command_count = -1;
        }
        if (this.app_state.command_counts.length > 120) {
          this.app_state.command_counts.pop();
        }
      }.bind(this), 1000);
    },
    data() {
      return {
        app_state: {
          // Populated by code
          app_name: "Flecs app",
          status: undefined,
          heartbeat: undefined,
          heartbeats_received: 0,
          requests: {
            sent: 0,
            received: 0,
            error: 0
          },
          bytes: {
            received: 0
          },
          world_info: undefined,
          build_info: undefined,
          command_counts: new Array(120).fill(0),

          // Populated by user
          host: undefined,
          query: {
            expr: QueryParam,
            name: undefined,
            use_name: false
          },
          entity: {
            path: undefined
          }
        },
        page: "queries",
        conn: undefined,
        lastWord: "",
        prev_command_count: -1,
        prev_heartbeats_received: -1
      };
    }
  });

  for (let c of values) {
    app.component(c.name, c);
  }
  
  app.mount("#app");
});
