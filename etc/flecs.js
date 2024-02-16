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
//       To poll for changes, set the "poll_interval" parameter to the number of
//       milliseconds between requests. To abort polling, call abort() on the
//       object returned by the function.
//    
//    Return:
//      Object with the following members:
//        - abort() : function
//            Aborts the request.
//        - url : string
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
//      To poll for changes, set the "poll_interval" parameter to the number of
//      milliseconds between requests. To abort polling, call abort() on the
//      object returned by the function.
//
//    Return:
//      Object with the following members:
//        - abort() : function
//            Aborts the request.
//        - url : string
//
//      Example:
//        flecs.query("Position, Velocity", {}, (response) => {
//          console.log(response);
//        });
//
//  - flecs.query_name(query_name, params, recv, err)
//      Same as flecs.query but for a named query.
//
//    Return:
//      Object with the following members:
//        - abort() : function
//            Aborts the request.
//        - url : string
//
//      Example:
//        flecs.query_name("queries.my_query", {}, (response) => {
//          console.log(response);
//        });
//

// If the environment is Node.js import XMLHttpRequest
if (typeof process === "object" && typeof require === "function") {
  var XMLHttpRequest = require("xhr2");
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
            // Ignore client-side only parameters
            if (k === "raw" || k === "full_paths" || k === "poll_interval" || k === "host") {
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
      request: function(host, method, path, params, recv, err, poll_interval, state) {
        const Request = new XMLHttpRequest();
        if (host === undefined) {
          host = flecs.params.host;
        }
        let url = host + "/" + path + flecs._.paramStr(params);

        if (state === undefined) {
          state = {
            timeout_ms: flecs.params.timeout_ms,
            retry_interval_ms: flecs.params.retry_interval_ms,
            retry_count: 0,
            request_cancelled: false,
            request: Request,
            url: url,
            abort: function() {
              state.request_cancelled = true;
              state.request.abort();
            },
            reset: function() {
              state.retry_count = 0;
            }
          }
        }

        Request.open(method, url);

        Request.onreadystatechange = (reply) => {
          if (Request.readyState == 4) {
            if (Request.status == 0) {
              state.retry_count ++;
              if (state.retry_count > flecs.params.max_retry_count) {
                const err_str = "request to " + host + " failed: max retry count exceeded";
                console.error(err_str);
                if (err) {
                  err('{"error": \"' + err_str + '\"}');
                }
                if (poll_interval) {
                  setTimeout(() => {
                    state.reset();
                    flecs._.request(host, method, path, params, recv, 
                        err, poll_interval, state);
                  }, poll_interval);
                }
                return;
              }

              if (state.request_cancelled) {
                console.log("request to " + host + " cancelled");
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

                console.error("retrying request to " + host +
                  ", ensure app is running and REST is enabled " +
                  "(retried " + state.retry_count + " times)");

                setTimeout(() => {
                  flecs._.request(host, method, path, params, recv, 
                      err, poll_interval, state);
                }, state.retry_interval_ms);
              } else {
                if (err) err(Request.responseText);
              }
            } else {    
              if (Request.status < 200 || Request.status >= 300) {
                if (err) {
                  err(Request.responseText);
                }
              } else {
                if (recv) {
                  recv(Request.responseText, url);

                  if (poll_interval && !state.request_cancelled) {
                    setTimeout(() => {
                      state.reset();
                      flecs._.request(host, method, path, params, recv, 
                          err, poll_interval, state);
                    }, poll_interval);
                  }
                }
              }
            }
          }
        }

        Request.send();

        return state;
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
            id_labels: params.full_paths != true,
            poll_interval: params.poll_interval,
            host: params.host
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
            type_info: params.type_info,
            field_info: params.field_info,
            table: params.table,
            poll_interval: params.poll_interval,
            host: params.host
          };

          if (!params.rows) {
            new_params.values = true;
            new_params.entities = true;
            new_params.is_set = true;
            if (params.full_paths != true) {
              new_params.id_labels = true;
              new_params.variable_labels = true;
              new_params.variables = false;
            } else {
              new_params.ids = true;
              new_params.variables = true;
            }
          }

          new_params.offset = params.offset;
          new_params.limit = params.limit;
          new_params.plan = params.plan;
          new_params.rows = params.rows;
          new_params.results = params.results;
          new_params.try = params.try;

          params = new_params;
        }

        return params;
      },

      format_entity_contents: function(parent, name, ids, values, row, is_set) {
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
              let add = !is_set || is_set[i];
              if (add) {
                tags.push(id);
              }
            }
          }

          if (values && values[i] !== 0) {
            let value = values[i];
            if (row !== undefined) {
              value = value[row];
            }
            components[id] = value;
          }
        }

        result.tags = tags;
        result.pairs = pairs;
        result.components = components;

        return result;
      },

      // Format result of entity endpoint
      format_entity_result: function(msg) {
        if (!msg || !msg.path) {
          return {
            tags: [],
            pairs: {},
            components: {}
          };
        }

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
        if (msg.error) {
          return {error: msg.error};
        }

        let term_ids = msg.ids;

        if (!term_ids) {
          term_ids = msg.id_labels;
        }

        let vars = msg.vars;
        let results = [];
        let out = {};

        if (msg.type_info) {
          out.type_info = msg.type_info;
        }

        out.entities = results; /* Backwards compatibility */
        out.content = msg.content;
        out.field_info = msg.field_info;
        out.vars = msg.vars;

        if (!msg.results) {
          return out;
        }

        for (let result of msg.results) {
          const entities = result.entities;
          let len = entities ? entities.length : 1

          for (let i = 0; i < len; i ++) {
            let ids = term_ids;
            if (ids === undefined) {
              ids = result.ids;
            }
            if (ids === undefined) {
              ids = result.id_labels;
            }

            let entity = entities ? entities[i] : undefined;
            let obj = flecs._.format_entity_contents(
              result.parent, entity, ids, result.values, i,
              result.is_set);

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

            obj.is_set = result.is_set;

            out.entities.push(obj);
          }
        }

        return out;
      },

      // Do query request
      request_query: function(host, params, recv, err, poll_interval) {
        let endpoint = "query";
        if (params.plan) {
          params = {q: params.q, try: params.try};
          endpoint = "query_plan";
        }

        let on_recv, on_err;
        if (recv) {
          on_recv = (msg) => {
            if (msg[0] == '{' || msg[0] == '[') {
              msg = JSON.parse(msg);
              if (!params.raw && !params.rows)  {
                recv(flecs._.format_query_result(msg));
              } else {
                recv(msg);
              }
            } else {
              if (err) {
                err({error: msg});
              }
            }
          }
        }

        if (err) {
          on_err = (msg) => {
            if (err) {
              if (msg[0] == '{' || msg[0] == '[') {
                err(JSON.parse(msg));
              } else {
                err({error: msg});
              }
            }
          }
        }

        return flecs._.request(host, "GET", endpoint, params, on_recv, on_err, 
          poll_interval);
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
      return flecs._.request(params.host, "GET", "entity/" + path, params, (msg) => {
        if (msg[0] == '{' || msg[0] == '[') {
          msg = JSON.parse(msg);
          if (params.raw) {
            recv(msg);
          } else {
            recv(flecs._.format_entity_result(msg));
          }
        } else {
          if (err) {
            err(JSON.parse(msg));
          }
        }
      }, (msg) => {
        if (err) {
          if (msg[0] == '{' || msg[0] == '[') {
            err(JSON.parse(msg));
          } else {
            err({error: msg});
          }
        }
      }, params.poll_interval);
    },

    // Remove whitespaces from query string
    query_trim: function(query) {
      query = query.replaceAll("\n", " ");
      do {
        let len = query.length;
        query = query.replaceAll("  ", " ");
        if (len == query.length) {
          break;
        }
      } while (true);
      return query;
    },

    // Request query
    query: function(query, params, recv, err) {
      if (query === undefined) {
        console.error("flecs.query: invalid query parameter");
        return;
      }
      params = flecs._.query_params(params);

      // Normalize query string
      query = flecs.query_trim(query);
      query = query.replaceAll(", ", ",");

      params.q = encodeURIComponent(query);
      return flecs._.request_query(params.host, params, recv, err, params.poll_interval);
    },

    // Request named query
    query_name: function(query, params, recv, err) {
      params = flecs._.query_params(params);
      params.name = encodeURIComponent(query);
      return flecs._.request_query(params.host, params, recv, err, params.poll_interval);
    },

    // Create world object
    world: function(poll_interval = 1000, host = undefined) {
      return {
        // Add query to world
        query: function(query, params) {
          if (!params) {
            params = {};
          }
          params.raw = false;
          params.poll_interval = poll_interval;
          params.host = host;
          this.queries.push(
            flecs.query(query, params, 
              this._recv.bind(this),
              this._err.bind(this)));
          return this;
        },

        // Lookup entity in world
        lookup: function(path) {
          if (!path) {
            return undefined;
          }

          if (typeof path !== "string") {
            path = "" + path;
          }

          let cur = this;
          let elems = path.split(".");
          for (let elem of elems) {
            if (!cur.entities) {
              return undefined;
            }
            let next = cur.entities[elem];
            if (!next) {
              return undefined;
            }
            cur = next;
          }

          return cur;
        },

        // Callback when update happens (useful for reactivity)
        on_update: function(callback) {
          this._on_update = callback;
          return this;
        },

        // Receive function
        _recv: function(reply) {
          let now = Date.now();
          if ((now - this.last_update) > this.poll_interval * 2) {
            // If requests are taking longer than expected don't garbage 
            // collect. Garbage collection should only kick in to clean up
            // entities that are no longer alive/returned by queries. While the 
            // client has no connection with the server, no assumptions should 
            // be made about the state & liveliness of entities.
            this._keep_alive_scope(this.entities, Date.now());
          }

          let results = reply.results;
          if (!results || !results.length) {
            results = reply.entities;
            if (!results) {
              results = [];
            }
          }

          for (let entity of results) {
            const parent = this._ensure(entity.parent, now);
            if (!parent.entities) {
              parent.entities = {};
            }
            let name = entity.name;
            if (typeof name !== "string") {
              name = "" + name;
            }

            const prev = parent.entities[name];
            if (prev) {
              entity.timestamp = prev.timestamp;
              entity.entities = prev.entities;
            }

            this._keep_alive(entity, now);

            parent.entities[name] = entity;
          }

          // Garbage collect entities that are no longer alive
          this._gc(now);

          // Clear error
          this.error = undefined;

          this.recv_count ++;

          if (this._on_update) {
            if (this.recv_count >= this.queries.length) {
              // Only call on_update when all queries have been received at
              // least once. This can simplify application logic / reactivity.
              this._on_update();
            }
          }
        },

        _err: function(reply) {
          this.error = reply;
        },

        // Recursively keep alive all entities
        _keep_alive_scope(entities, now) {
          for (let path in entities) {
            let entity = entities[path];
            this._keep_alive(entity, now);
            if (entity.entities) {
              this._keep_alive_scope(entity.entities, now);
            }
          }
        },

        // If entity was received by query, keep it alive for the next epoch
        _keep_alive(entity, now) {
          let path = entity.name;
          if (entity.parent) {
            path = entity.parent + "." + path;
          }
          if (entity.timestamp) {
            // Remove entity from old timestamp
            let entities = this.entity_timestamps[entity.timestamp];
            if (entities) {
              delete entities[path];
              if (Object.keys(entities).length === 0) {
                delete this.entity_timestamps[entity.timestamp];
              }
            }
          }

          // Add to current timestamp
          let entities = this.entity_timestamps[now];
          if (!entities) {
            entities = this.entity_timestamps[now] = {};
          }
          entities[path] = 0;
          entity.timestamp = now;
        },

        // Garbage collect entities that are no longer alive
        _gc: function(now) {
          let timestamps = Object.keys(this.entity_timestamps);
          for (let time of timestamps) {
            if (now - time > this.poll_interval * 2) {
              let entities = Object.keys(this.entity_timestamps[time]);
              for (let path of entities) {
                this._collect(path);
              }

              delete this.entity_timestamps[time];
            } else {
              break;
            }
          }
        },

        // Garbage collect entity
        _collect: function(path) {
          let cur = this, prev = undefined;

          if (typeof path !== "string") {
            path = "" + path;
          }

          let elems = path.split(".");
          for (let elem of elems) {
            if (!cur.entities) {
              break;
            }
            let next = cur.entities[elem];
            if (!next) {
              break;
            }
            prev = cur;
            cur = next;
          }

          if (prev) {
            delete prev.entities[elems[elems.length - 1]];
          } else {
            delete this.entities[path];
          }
        },

        // Ensure entity exists
        _ensure: function(path, now) {
          let cur = this;
          let parent = [];

          if (typeof path !== "string") {
            path = "" + path;
          }

          let elems = path.split(".");
          for (let elem of elems) {
            if (!cur.entities) {
              cur.entities = {};
            }
            let next = cur.entities[elem];
            if (!next) {
              next = cur.entities[elem] = {
                name: elem,
                tags: [],
                pairs: {},
                components: {}
              };
              if (parent.length) {
                next.parent = parent.join(".")
              }
            }
            cur = next;
            this._keep_alive(cur, now);
            parent.push(elem);
          }

          return cur;
        },
        
        _on_update: undefined,

        queries: [],
        entities: {},
        entity_timestamps: {},
        poll_interval: poll_interval,
        last_update: 0,
        recv_count: 0
      }
    }
};
