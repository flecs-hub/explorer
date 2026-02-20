
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

// Default explorer parameters
const defaultAppParams = {
  page: "entities",
  host: undefined,
  queries: {
    path: undefined,
    inspector_tab: "Inspect",
    expr: "(ChildOf, flecs)",
    name: undefined,
    use_name: false,
    query_tab: "editor",
    inspect_tab: "table"
  },
  entities: {
    path: undefined,
    tab: "Overview",
    inspector_tab: "Inspect",
    tree_mode: "Entities",
  },
  internals: {
    path: undefined,
    tab: "tables",
  },
  sidebar: true,
  pipeline: "All systems",
  scripts: [],
  script: undefined,
  code: undefined,
  code_url: undefined,
  refresh: "auto"
}

const defaultCodeScript = "etc.assets.scene\\.flecs";

function newAppParams() {
  let result = structuredClone(defaultAppParams);

  result.run_playground = function() { 
    this.entities.tab = "Scene";
    this.entities.inspector_tab = "Script";
    this.entities.path = "etc.assets.scene\\.flecs";
    this.host = "flecs_explorer.wasm";
  }

  return result;
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

const BASE_COMPONENTS = [
  // Common components
  'js/components/widgets/title-bar/title-bar.vue',
  'js/components/widgets/title-bar/layout-control.vue',
  'js/components/widgets/title-bar/play-control.vue',
  'js/components/widgets/title-bar/url-bar.vue',
  'js/components/widgets/title-bar/connecting-indicator.vue',
  'js/components/widgets/info-bar/info-bar.vue',
  'js/components/widgets/info-bar/info-connected.vue',
  'js/components/widgets/info-bar/info-build-version.vue',
  'js/components/widgets/info-bar/info-build-config.vue',
  'js/components/widgets/menu-bar/menu-bar.vue',
  'js/components/widgets/menu-bar/menu-button.vue',
  'js/components/widgets/stat-chart.vue',
  'js/components/widgets/dropdown.vue',
  'js/components/widgets/detail-toggle.vue',
  'js/components/widgets/scene-canvas.vue',
  'js/components/widgets/splitter.vue',
  'js/components/widgets/pane-container.vue',
  'js/components/widgets/terminal-color-pre.vue',
  'js/components/widgets/edit-tabs.vue',
  'js/components/widgets/edit-tabs-close-button.vue',
  'js/components/widgets/histogram.vue',
  'js/components/widgets/data-table.vue',
  'js/components/icon.vue',
  'js/components/toggle.vue',
  'js/components/search-box.vue',
  'js/components/widgets/tabs.vue',
  'js/components/app-menu.vue',
  'js/components/code-editor.vue',
  'js/components/prop-browser.vue',
  'js/components/entity-path.vue',
  'js/components/entity-parent.vue',
  'js/components/entity-name.vue',
  'js/components/color-preview.vue',

  // Shared widgets
  'js/components/widgets/icon-button.vue',
  'js/components/widgets/expand-button.vue',
  'js/components/widgets/flecs-script.vue',

  // Shared tree widget
  'js/components/widgets/tree/entity-tree.vue',
  'js/components/widgets/tree/entity-subtree.vue',
  'js/components/widgets/tree/entity-tree-item.vue',
  'js/components/widgets/tree/entity-tree-icon.vue',

  // Shared inspector widget
  'js/components/widgets/inspector/entity-inspector.vue',
  'js/components/widgets/inspector/entity-inspector-container.vue',
  'js/components/widgets/inspector/entity-inspector-module.vue',
  'js/components/widgets/inspector/entity-inspector-components.vue',
  'js/components/widgets/inspector/entity-inspector-matched-by.vue',
  'js/components/widgets/inspector/entity-inspector-refs.vue',
  'js/components/widgets/inspector/entity-inspector-alerts.vue',
  'js/components/widgets/inspector/entity-inspector-component.vue',
  'js/components/widgets/inspector/entity-inspector-value.vue',
  'js/components/widgets/inspector/entity-inspector-kv.vue',
  'js/components/widgets/inspector/entity-inspector-field.vue',
  'js/components/widgets/inspector/entity-inspector-preview.vue',
  'js/components/widgets/inspector/entity-inspector-add-component.vue',
  'js/components/widgets/inspector/entity-inspector-script-ast.vue',
  'js/components/widgets/inspector/entity-link.vue',

  // Shared entity list widget
  'js/components/widgets/entity-list/entity-list.vue',
  'js/components/widgets/entity-list/entity-list-item.vue',

  // Shared table widget
  'js/components/widgets/table/entity-table.vue',
];

const PAGE_COMPONENTS = {
  entities: [
    'js/components/pages/entities/page.vue',
    'js/components/pages/entities/pane-tree.vue',
    'js/components/pages/entities/pane-content.vue',
    'js/components/pages/entities/entities-overview.vue',
  ],
  queries: [
    'js/components/pages/queries/page.vue',
    'js/components/pages/queries/pane-query.vue',
    'js/components/pages/queries/pane-inspect.vue',
    'js/components/pages/queries/query-editor.vue',
    'js/components/pages/queries/query-browser.vue',
    'js/components/pages/queries/query-json.vue',
    'js/components/pages/queries/query-status.vue',
    'js/components/pages/queries/query-plan.vue',
    'js/components/pages/queries/query-profile.vue',
    'js/components/pages/queries/query-expr.vue',
    'js/components/pages/queries/query-schema.vue',
    'js/components/pages/queries/query-inspect.vue',
    'js/components/pages/queries/query-c.vue',
    'js/components/pages/queries/query-cpp.vue',
    'js/components/pages/queries/query-js.vue',
    'js/components/pages/queries/query-rest.vue',
    'js/components/pages/queries/query-api.vue',
    'js/components/pages/queries/query-error.vue',
    'js/components/pages/queries/query-list-item.vue',
  ],
  stats: [
    'js/components/pages/stats/page.vue',
    'js/components/pages/stats/world-stats.vue',
    'js/components/pages/stats/world-stat.vue',
    'js/components/pages/stats/pipeline-stats.vue',
    'js/components/pages/stats/pipeline.vue',
    'js/components/pages/stats/pipeline-system.vue',
    'js/components/pages/stats/pipeline-segment.vue',
  ],
  commands: [
    'js/components/pages/commands/page.vue',
    'js/components/pages/commands/pane-header.vue',
    'js/components/pages/commands/pane-inspect.vue',
    'js/components/pages/commands/inspect-sync.vue',
    'js/components/pages/commands/inspect-cmd-header.vue',
    'js/components/pages/commands/inspect-cmd-history.vue',
    'js/components/pages/commands/inspect-cmd.vue',
  ],
  internals: [
    'js/components/pages/internals/page.vue',
    'js/components/pages/internals/tables.vue',
    'js/components/pages/internals/components.vue',
    'js/components/pages/internals/queries.vue',
    'js/components/pages/internals/build.vue',
    'js/components/pages/internals/connection.vue',
    'js/components/pages/internals/natvis.vue',
  ]
};

const pageNames = Object.keys(PAGE_COMPONENTS);
const loadedComponentModules = new Map();
const registeredComponents = new Set();

function normalizePage(page) {
  if (PAGE_COMPONENTS[page]) {
    return page;
  }
  return undefined;
}

function loadComponents(paths, app) {
  const uniquePaths = [...new Set(paths)];

  return Promise.all(uniquePaths.map((path) => {
    let component = loadedComponentModules.get(path);
    if (!component) {
      component = loadModule(path, options);
      loadedComponentModules.set(path, component);
    }
    return component;
  })).then((values) => {
    if (app) {
      for (const component of values) {
        if (!component || !component.name || registeredComponents.has(component.name)) {
          continue;
        }
        app.component(component.name, component);
        registeredComponents.add(component.name);
      }
    }

    return values;
  });
}

const startupPage = normalizePage(getParameterByName("page")) || defaultAppParams.page;
const startupComponents = BASE_COMPONENTS.concat(PAGE_COMPONENTS[startupPage]);

loadComponents(startupComponents).then(() => {
  let app = Vue.createApp({
    created() {
      // Load URL parameters
      const keys = this.fromUrlParams() || [];

      // If code is provided, open the script inspector for it.
      if (this.getStartupCode()) {
        this.app_params.host = "flecs_explorer.wasm";

        if (keys.indexOf("entities.path") == -1) {
          this.app_params.entities.path = this.getCodeScriptPath();
          this.app_params.entities.inspector_tab = "Script";
        }
      }

      this.loadCodeFromUrl();

      let explicitHost = true;
      if (!this.app_params.host) {
        this.app_params.host = "localhost";
        explicitHost = false;
      }

      this.conn = flecs.connect({
        host: this.app_params.host,
        poll_interval_ms: this.app_params.refresh === "auto" ? 1000 : 0,

        // Copy host to reactive property
        on_host: function(host) {
          this.app_params.host = host;
        }.bind(this),

        // If connection fails, fallback to playground
        on_fallback: explicitHost ? undefined : function() {
          this.app_params.run_playground();
        }.bind(this),

        // Copy connection status to reactive property
        on_status: function(status) {
          this.app_state.mode = this.conn.mode;
          this.app_state.status = status;

          if (status == flecs.ConnectionStatus.Connected) {
            this.applyStartupCode();
          }
        }.bind(this),

        // Copy heartbeat to reactive properties
        on_heartbeat: function(msg) {
          if (msg.components) {
            let lbl = msg.components["(flecs.doc.Description,flecs.core.Name)"];
            if (lbl) {
              this.app_state.app_name = lbl.value;
            }
          }

          this.app_state.heartbeat = msg;
          this.app_state.heartbeats_received ++;
          this.app_state.requests.received = this.conn.requests.received;
          this.app_state.requests.sent = this.conn.requests.sent;
          this.app_state.requests.error = this.conn.requests.error;
          this.app_state.bytes.received = this.conn.bytes.received;
          this.app_state.has3DCanvas = flecs.has3DCanvas;

          if (msg.components) {
            if (msg.components["flecs.stats.WorldSummary"]) {
              const summary = msg.components["flecs.stats.WorldSummary"];
              this.app_state.world_info = summary;
              this.app_state.build_info = summary.build_info;
            }

            const buildInfo = msg.components["flecs.core.BuildInfo"];
            if (buildInfo) {
              this.app_state.build_info = buildInfo;
            }
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
      pageReady(page) {
        const normalized = normalizePage(page);
        if (!normalized) {
          return true;
        }
        return this.page_components_ready[normalized];
      },
      ensurePageComponents(page) {
        const normalized = normalizePage(page);
        if (!normalized) {
          return Promise.resolve();
        }
        if (this.page_components_ready[normalized]) {
          return Promise.resolve();
        }

        return loadComponents(PAGE_COMPONENTS[normalized], app)
          .then(() => {
            this.page_components_ready[normalized] = true;
          })
          .catch((err) => {
            console.error(`failed to load components for page '${normalized}':`, err);
          });
      },
      getStartupCode() {
        if (this.app_params.code !== undefined) {
          return this.app_params.code;
        }
        return this.code_from_url;
      },
      applyStartupCode() {
        if (!this.conn || this.conn.mode != flecs.ConnectionMode.Wasm) {
          return;
        }
        if (this.app_state.status != flecs.ConnectionStatus.Connected) {
          return;
        }

        const startupCode = this.getStartupCode();
        if (startupCode === undefined) {
          return;
        }

        const scriptPath = this.getCodeScriptPath();
        this.conn.scriptUpdate(scriptPath, startupCode, {
          try: true
        }, () => {});
      },
      loadCodeFromUrl() {
        if (this.app_params.code_url === undefined) {
          return;
        }
        if (this.app_params.code !== undefined) {
          return; // explicit code parameter takes precedence
        }

        fetch(this.app_params.code_url)
          .then((reply) => {
            if (!reply.ok) {
              throw new Error(`HTTP ${reply.status}`);
            }
            return reply.text();
          })
          .then((text) => {
            this.code_from_url = text;
            this.applyStartupCode();
          })
          .catch((err) => {
            console.error(`failed to load code_url '${this.app_params.code_url}': ${err}`);
          });
      },
      getCodeScriptPath() {
        if (this.app_params.entities && this.app_params.entities.path) {
          return this.app_params.entities.path;
        }
        if (this.app_params.script) {
          return this.app_params.script;
        }
        return defaultCodeScript;
      },
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

        const hideCodeDrivenEntitiesParams =
          this.app_params.code !== undefined &&
          this.app_params.entities.inspector_tab === "Script";
        const hideHostParam = this.getStartupCode() !== undefined;

        for (let key in obj) {
          if (key == "run_playground") {
            continue;
          }

          if (key == "host" && hideHostParam) {
            continue;
          }

          const value = obj[key];
          if (typeof value === "object") {
            if (!Array.isArray(value)) {
              if (key === obj.page) { // only add params for current page
                for (let value_key in value) { // max 1 lvl of nesting
                  if (hideCodeDrivenEntitiesParams &&
                    key === "entities" &&
                    (value_key === "path" || value_key === "inspector_tab"))
                  {
                    continue;
                  }

                  const nested = value[value_key];
                  if (nested !== defaultAppParams[key][value_key]) {
                    result += `${first ? "?" : "&"}${key + '.' + value_key}=${encodeURIComponent(nested)}`;
                    first = false;
                  }
                }
              }
            } else {
                for (let value_key in value) { // max 1 lvl of nesting
                  const nested = value[value_key];
                  result += `${first ? "?" : "&"}${key + '.' + value_key}=${encodeURIComponent(nested)}`;
                  first = false;
                }
            }
          } else if (value !== defaultAppParams[key]) {
            result += `${first ? "?" : "&"}${key}=${encodeURIComponent(value)}`;
            first = false;
          }
        }

        return result;
      },
      fromUrlParams(url = window.location.search) {
        let keys = [];

        if (window.location.search === undefined) {
          return;
        }

        let first = true;
        let paramNamePos = -1;
        while ((paramNamePos = url.indexOf(first ? "?" : "&", paramNamePos + 1)) !== -1) {
          let paramValuePos = url.indexOf("=", paramNamePos);
          let paramValueEnd = url.indexOf("&", paramValuePos);
          let key = url.slice(paramNamePos + 1, paramValuePos);
          keys.push(key);
          key = key.split(".");

          let value;
          if (paramValueEnd !== -1) {
            value = url.slice(paramValuePos + 1, paramValueEnd);
          } else {
            value = url.slice(paramValuePos + 1);
          }

          // medium links encode spaces as +
          value = value.replaceAll("+", "%20");

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

        return keys;
      }
    },

    watch: {
      "app_params.page": {
        handler(value) {
          const normalized = normalizePage(value);
          if (!normalized) {
            return;
          }
          this.ensurePageComponents(normalized);
        },
        immediate: true
      },
      app_params: {
        handler(value) {
          let reload = false;
          if (!this.conn || value.host != this.conn.params.host) {
            reload = true;
          }
          
          history.pushState({}, document.title,
              window.location.origin + 
              window.location.pathname +
              this.toUrlParams(this.app_params));

          if (reload) {
            this.conn.connect(value.host);
            location.reload();
          }
        },
        deep: true
      },
      app_state: {
        handler(value) {
          document.title = value.pretty_app_name();
        },
        deep: true
      }
    },

    data() {
      return {
        app_state: { // Populated by code
          app_name: undefined,
          pretty_app_name: function() {
            let str = this.app_name;
            if (str) {
              str = str.replaceAll("_", " ");
              str = str.charAt(0).toUpperCase() + str.slice(1);
              return str;
            } else {
              return "Flecs Explorer";
            }
          },
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
        app_params: newAppParams(), // Populated by user
        page_components_ready: pageNames.reduce((result, page) => {
          result[page] = (page === startupPage);
          return result;
        }, {}),
        code_from_url: undefined,
        conn: undefined,
        lastWord: "",
        prev_command_count: -1,
        prev_heartbeats_received: -1
      };
    }
  });

  loadComponents(startupComponents, app).then(() => {
    app.mount("#app");
  });
});
