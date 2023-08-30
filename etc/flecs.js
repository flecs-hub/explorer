// Flecs JavaScript client library (c) 2023, Sander Mertens, MIT license
//   Thin wrapper around the Flecs REST API.
//
// Resources:
//   Flecs repository: https://github.com/SanderMertens/flecs
//   API manual: https://www.flecs.dev/flecs/md_docs_RestApi.html
//   API console: https://www.flecs.dev/explorer/console
//
// Functions:
//  - flecs.connect(host : string)
//      Initializes the client library with the host address of the server.
//      Example:
//        flecs.connect("http://localhost:27750");
//
//  - flecs.entity(path : string, params : object, recv : function, err : function)
//      Retrieves an entity from the server. By default the response is formatted
//      as a JavaScript object with the following properties:
//        - parent : string
//        - name : string
//        - tags : array
//        - pairs : object
//        - components : object
//        - type_info : object (optional)
//        - alerts : array (optional)
//
//       When the "raw" parameter is set to true, the response format is as 
//       described in the REST API manual. When the "raw" parameter is set to
//       false or omitted the response will return labels instead of full paths
//       for tags and components. To retrieve full paths, set the "full_paths"
//       parameter to true.
//    
//    Example:
//      flecs.entity("flecs.core.World", {}, (response) => {
//        console.log(response);
//      });
//        
//  - flecs.query(query, params, recv, err)
//      Retrieves entities from the server that match the provided query. By
//      default the response is formatted as a JavaScript object with the
//      following properties:
//        - type_info : object (optional)
//        - entities : array
//          - parent : string
//          - name : string
//          - tags : array
//          - pairs : object
//          - components : object
//          - vars : object (optional)
//
//      When the "raw" parameter is set to true, the response format is as
//      described in the REST API manual. When the "raw" parameter is set to
//      false or omitted the response will return labels instead of full paths
//      for tags and components. To retrieve full paths, set the "full_paths"
//      parameter to true.
//
//      Example:
//        flecs.query("Position, Velocity", {}, (response) => {
//          console.log(response);
//        });
//
//  - flecs.query_name(query_name, params, recv, err)
//      Same as flecs.query but for a named query.
//
//      Example:
//        flecs.query_name("queries.my_query", {}, (response) => {
//          console.log(response);
//        });
//

// If the environment is Node.js import XMLHttpRequest
if (typeof process === "object" && typeof require === "function") {
  XMLHttpRequest = require("xhr2");
}

const flecs = {
    params: {
        host: "http://localhost:27750",
        timeout_ms: 1000,
        retry_interval_ms: 200,
        max_retry_count: 5
    },

    _: {
      // Convert JavaScript object to query string
      paramStr: function(params) {
        let count = 0;
        let url_params = "";
        if (params) {
          for (var k in params) {
            if (k === "raw" || k == "full_paths") {
              continue;
            }
            if (params[k] !== undefined) {
              if (count) {
                url_params += "&";
              } else {
                url_params += "?";
              }
              url_params += k + "=" + params[k];
              count ++;
            }
          }
        }
        return url_params;
      },

      // Do HTTP request, automatically retries on failure
      request: function(method, path, params, recv, err, state) {
        const Request = new XMLHttpRequest();
        let url = flecs.params.host + "/" + path + flecs._.paramStr(params);

        if (state === undefined) {
          state = {
            timeout_ms: flecs.params.timeout_ms,
            retry_interval_ms: flecs.params.retry_interval_ms,
            retry_count: 0
          }
        }

        Request.open(method, url);
        Request.timeout_ms = state.timeout_ms;

        Request.onreadystatechange = (reply) => {
          if (Request.readyState == 4) {
            if (Request.status == 0) {
              state.retry_count ++;
              if (state.retry_count > flecs.params.max_retry_count) {
                const err_str = "request to " + flecs.params.host + " failed: max retry count exceeded";
                console.error(err_str);
                if (err) {
                  err('{"error": \"' + err_str + '\"}');
                }
                return;
              }

              // Retry if the server did not respond to request
              if (state.retry_interval_ms) {
                state.retry_interval_ms *= 1.3;
                if (state.retry_interval_ms > 1000) {
                  state.retry_interval_ms = 1000;
                }

                // No point in timing out sooner than retry interval
                if (state.timeout_ms < state.retry_interval_ms) {
                  state.timeout_ms = state.retry_interval_ms;
                }

                console.error("retrying request to " + flecs.params.host +
                  ", ensure app is running and REST is enabled " +
                  "(retried " + state.retry_count + " times)");

                window.setTimeout(() => {
                  flecs._.request(method, flecs.params.host, params, recv, err, state);
                }, state.retry_interval_ms);
              } else {
                if (err) err(Request.responseText);

                // If error callback did not set the connection state back to
                // local, treat this as a loss of connection event.
                if (!Request.request_aborted) {
                  this.connect();
                }
              }
            } else {    
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

      // Parse entity parameters
      entity_params: function(params) {
        if (!params) {
          params = {};
        }

        const raw = params.raw === true;
        if (!raw) {
          let new_params = {
            values: true,
            type_info: params.type_info,
            alerts: params.alerts,
            ids: params.full_paths == true,
            id_labels: params.full_paths != true
          };
          params = new_params;
        }

        return params;
      },

      // Parse query parameters
      query_params: function(params) {
        if (!params) {
          params = {};
        }
  
        const raw = params.raw === true;
        if (!raw) {
          let new_params = {
            values: true,
            entities: true,
            type_info: params.type_info,
            table: params.table
          };

          if (params.full_paths != true) {
            new_params.id_labels = true;
            new_params.variable_labels = true;
            new_params.variables = false;
          } else {
            new_params.ids = true;
            new_params.variables = true;
          }

          params = new_params;
        }

        return params;
      },

      format_entity_contents: function(parent, name, ids, values) {
        let result = {parent: parent, name: name};
        let tags = [];
        let components = {};
        let pairs = {};

        for (let i = 0; i < ids.length; i ++) {
          let id = ids[i];
          if (id.length === 2) {
            const rel = id[0];
            let targets = pairs[rel];
            if (targets === undefined) {
              pairs[rel] = id[1];
            } else if (typeof targets === "string") {
              pairs[rel] = [targets];
              pairs[rel].push(id[1]);
            } else {
              pairs[rel].push(id[1]);
            }

            id = "(" + id.join(",") + ")";
          } else {
            id = id[0];
            if (!values || values[i] === 0) {
              tags.push(id);
            }
          }

          if (values && values[i] !== 0) {
            components[id] = values[i];
          }
        }

        if (tags.length != 0) {
          result.tags = tags;
        }
        if (Object.keys(pairs).length != 0) {
          result.pairs = pairs;
        }
        if (Object.keys(components).length != 0) {
          result.components = components;
        }

        return result;
      },

      // Format result of entity endpoint
      format_entity_result: function(msg) {
        let parent = msg.path.split(".").slice(0, -1).join(".");
        let name = msg.path.split(".").slice(-1)[0];

        let ids = msg.ids;
        if (!ids) {
          ids = msg.id_labels;
        }

        let result = flecs._.format_entity_contents(
          parent, name, ids, msg.values);

        if (msg.type_info) {
          result.type_info = {};
          for (let i = 0; i < msg.type_info.length; i ++) {
            if (msg.type_info[i] !== 0) {
              result.type_info[ids[i]] = msg.type_info[i];
            }
          }
        }
        if (msg.alerts) {
          result.alerts = msg.alerts;
        }

        return result;
      },

      // Format result of query endpoint
      format_query_result: function(msg) {
        let term_ids = msg.ids;
        if (!term_ids) {
          term_ids = msg.id_labels;
        }
        let vars = msg.vars;
        let entities = [];
        let out = {};
        if (msg.type_info) {
          out.type_info = msg.type_info;
        }
        out.entities = entities;

        for (let result of msg.results) {
          for (let i = 0; i < result.entities.length; i ++) {
            let ids = term_ids;
            if (ids === undefined) {
              ids = result.ids;
            }
            if (ids === undefined) {
              ids = result.id_labels;
            }

            let obj = flecs._.format_entity_contents(
              result.parent, result.entities[i], ids, result.values);

            if (vars) {
              let var_values = result.vars;
              if (!var_values) {
                var_values = result.var_labels;
              }
              obj.vars = {};
              for (let j = 0; j < vars.length; j ++) {
                obj.vars[vars[j]] = var_values[j];
              }
            }

            entities.push(obj);
          }
        }

        return out;
      },

      // Do query request
      request_query: function(params, recv, err) {
        return flecs._.request("GET", "query", params, (msg) => {
          msg = JSON.parse(msg);
          if (!params.raw)  {
            recv(flecs._.format_query_result(msg));
          } else {
            recv(msg);
          }
        }, (msg) => {
          if (err) {
            err(JSON.parse(msg));
          }
        });
      }
    },

    // Set host for client library
    connect: function(host) {
      flecs.params.host = host;
    },

    // Request entity
    entity: function(path, params, recv, err) {
      params = flecs._.entity_params(params);
      path = path.replace(/\./g, "/");
      return flecs._.request("GET", "entity/" + path, params, (msg) => {
        msg = JSON.parse(msg);
        if (params.raw) {
          recv(msg);
        } else {
          recv(flecs._.format_entity_result(msg));
        }
      }, (msg) => {
        if (err) {
          err(JSON.parse(msg));
        }
      });
    },

    // Request query
    query: function(query, params, recv, err) {
      params = flecs._.query_params(params);

      // Normalize query string
      query = query.replaceAll("\n", " ");
      do {
        let len = query.length;
        query = query.replaceAll("  ", " ");
        if (len == query.length) {
          break;
        }
      } while (true);
      query = query.replaceAll(", ", ",");

      params.q = encodeURIComponent(query);
      return flecs._.request_query(params, recv, err);
    },

    // Request named query
    query_name: function(query, params, recv, err) {
      params = flecs._.query_params(params);
      params.name = encodeURIComponent(query);
      return flecs._.request_query(params, recv, err);
    }
};
