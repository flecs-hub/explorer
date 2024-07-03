
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
  loadModule('js/components/widgets/title-bar/title-bar.vue', options),
  loadModule('js/components/widgets/title-bar/refresh-control.vue', options),
  loadModule('js/components/widgets/title-bar/play-control.vue', options),
  loadModule('js/components/widgets/title-bar/url-bar.vue', options),
  loadModule('js/components/widgets/title-bar/connecting-indicator.vue', options),
  loadModule('js/components/widgets/info-bar/info-bar.vue', options),
  loadModule('js/components/widgets/info-bar/info-connected.vue', options),
  loadModule('js/components/widgets/info-bar/info-build-version.vue', options),
  loadModule('js/components/widgets/info-bar/info-build-config.vue', options),
  loadModule('js/components/widgets/menu-bar/menu-bar.vue', options),
  loadModule('js/components/widgets/menu-bar/menu-button.vue', options),
  loadModule('js/components/widgets/stat-chart.vue', options),
  loadModule('js/components/widgets/dropdown.vue', options),
  loadModule('js/components/widgets/detail-toggle.vue', options),
  loadModule('js/components/widgets/scene-canvas.vue', options),
  loadModule('js/components/widgets/terminal-color-pre.vue', options),
  loadModule('js/components/icon.vue', options),
  loadModule('js/components/toggle.vue', options),
  loadModule('js/components/search-box.vue', options),
  loadModule('js/components/widgets/tabs.vue', options),
  loadModule('js/components/app-menu.vue', options),
  loadModule('js/components/code-editor.vue', options),
  loadModule('js/components/prop-browser.vue', options),
  loadModule('js/components/entity-path.vue', options),
  loadModule('js/components/entity-parent.vue', options),
  loadModule('js/components/entity-name.vue', options),
  loadModule('js/components/color-preview.vue', options),

  // Widgets
  loadModule('js/components/widgets/icon-button.vue', options),
  loadModule('js/components/widgets/expand-button.vue', options),

  // Entities page
  loadModule('js/components/pages/entities/page.vue', options),
  loadModule('js/components/pages/entities/pane-tree.vue', options),
  loadModule('js/components/pages/entities/pane-inspector.vue', options),
  loadModule('js/components/pages/entities/pane-scripts.vue', options),
  loadModule('js/components/pages/entities/flecs-script.vue', options),

  // Tree widget
  loadModule('js/components/widgets/tree/entity-tree.vue', options),
  loadModule('js/components/widgets/tree/entity-subtree.vue', options),
  loadModule('js/components/widgets/tree/entity-tree-item.vue', options),
  loadModule('js/components/widgets/tree/entity-tree-icon.vue', options),

  // Inspector widget
  loadModule('js/components/widgets/inspector/entity-inspector.vue', options),
  loadModule('js/components/widgets/inspector/entity-inspector-module.vue', options),
  loadModule('js/components/widgets/inspector/entity-inspector-components.vue', options),
  loadModule('js/components/widgets/inspector/entity-inspector-matched-by.vue', options),
  loadModule('js/components/widgets/inspector/entity-inspector-refs.vue', options),
  loadModule('js/components/widgets/inspector/entity-inspector-alerts.vue', options),
  loadModule('js/components/widgets/inspector/entity-inspector-component.vue', options),
  loadModule('js/components/widgets/inspector/entity-inspector-value.vue', options),
  loadModule('js/components/widgets/inspector/entity-inspector-kv.vue', options),
  loadModule('js/components/widgets/inspector/entity-inspector-field.vue', options),
  loadModule('js/components/widgets/inspector/entity-inspector-preview.vue', options),
  loadModule('js/components/widgets/inspector/entity-inspector-add-component.vue', options),
  loadModule('js/components/widgets/inspector/entity-inspector-script-ast.vue', options),

  // Table widget
  loadModule('js/components/widgets/table/entity-table.vue', options),

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

  // Stats page
  loadModule('js/components/pages/stats/page.vue', options),
  loadModule('js/components/pages/stats/world-stats.vue', options),
  loadModule('js/components/pages/stats/world-stat.vue', options),

  // Pipeline page
  loadModule('js/components/pages/pipeline/page.vue', options),
  loadModule('js/components/pages/pipeline/pipeline.vue', options),
  loadModule('js/components/pages/pipeline/pipeline-system.vue', options),
  loadModule('js/components/pages/pipeline/pipeline-segment.vue', options),

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

Promise.all(components).then((values) => {
  let app = Vue.createApp({
    created() {
      // Load URL parameters
      this.fromUrlParams();

      if (!this.app_params.host) {
        this.app_params.host = "localhost";
      }

      this.conn = flecs.connect({
        host: this.app_params.host,

        poll_interval_ms: this.app_params.refresh === "auto" ? 1000 : 0,

        // Copy host to reactive property
        on_host: function(host) {
          this.app_params.host = host;
        }.bind(this),
        
        // Copy connection status to reactive property
        on_status: function(status) {
          this.app_state.mode = this.conn.mode;
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
          this.app_state.has3DCanvas = flecs.has3DCanvas;

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

    methods: {
      convertTo(type, value) {
        if (type === "undefined") {
          return value;
        }

        switch(type) {
          case 'string':
            return String(value);
          case 'number':
            return Number(value);
          case 'boolean':
            return value === "true" ? true : false;
          default:
            console.error(`unsupported type: ${type}`);
        }
      },
      toUrlParams(obj) {
        let result = "";
        let first = true;
        for (let key in obj) {
          const value = obj[key];
          if (typeof value === "object") {
            for (let value_key in value) { // max 1 lvl of nesting
              const nested = value[value_key];
              if (nested !== undefined) {
                result += `${first ? "?" : "&"}${key + '.' + value_key}=${encodeURIComponent(nested)}`;
                first = false;
              }
            }
          } else if (value !== undefined) {
            result += `${first ? "?" : "&"}${key}=${encodeURIComponent(value)}`;
            first = false;
          }
        }
        return result;
      },
      fromUrlParams(url = window.location.search) {
        if (window.location.search === undefined) {
          return;
        }

        let first = true;
        let paramNamePos = -1;
        while ((paramNamePos = url.indexOf(first ? "?" : "&", paramNamePos + 1)) !== -1) {
          let paramValuePos = url.indexOf("=", paramNamePos);
          let paramValueEnd = url.indexOf("&", paramValuePos);
          const key = url.slice(paramNamePos + 1, paramValuePos).split(".");
          let value;
          if (paramValueEnd !== -1) {
            value = url.slice(paramValuePos + 1, paramValueEnd);
          } else {
            value = url.slice(paramValuePos + 1);
          }

          if (key.length == 1) {
            const type = typeof this.app_params[key[0]];
            this.app_params[key[0]] = 
              this.convertTo(type, decodeURIComponent(value));
          } else if (key.length == 2) {
            let type = 'string';
            if (this.app_params[key[0]]) {
              type = typeof this.app_params[key[0]][key[1]];
            }
            this.app_params[key[0]][key[1]] = 
              this.convertTo(type, decodeURIComponent(value));
          }
          
          first = false;
        }
      }
    },

    watch: {
      app_params: {
        handler(value) {
          let reload = false;
          if (!this.conn || value.host != this.conn.params.host) {
            this.conn.connect(value.host);
            reload = true;
          }
          
          history.pushState({}, document.title,
              window.location.origin + 
              window.location.pathname +
              this.toUrlParams(this.app_params));

          if (reload) {
            location.reload();
          }
        },
        deep: true
      }
    },

    data() {
      return {
        app_state: { // Populated by code
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
        },
        app_params: { // Populated by user
          page: "entities",
          host: undefined,
          query: {
            expr: "(ChildOf, flecs)",
            name: undefined,
            use_name: false,
            query_tab: "editor",
            inspect_tab: "table"
          },
          entity: {
            path: undefined
          },
          inspector_mode: undefined,
          tree_mode: undefined,
          pipeline: "All systems",
          scripts: [],
          active_script: undefined,
          refresh: "auto"
        },
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
