flecs = {
    params: {
        host: "http://localhost:27750",
        timeout: 1000,
        retry_interval: 200,
        max_retry_count: 5
    },

    _: {
      paramStr: function(params) {
        let count = 0;
        let url_params = "";
        if (params) {
          for (var k in params) {
            if (k === "raw") {
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

      request: function(method, path, params, recv, err, state) {
        const Request = new XMLHttpRequest();
        let url = flecs.params.host + "/" + path + flecs._.paramStr(params);

        if (state === undefined) {
          state = {
            timeout: flecs.params.timeout,
            retry_interval: flecs.params.retry_interval,
            retry_count: 0
          }
        }

        Request.open(method, url);
        Request.timeout = state.timeout;

        Request.onreadystatechange = (reply) => {
          if (Request.readyState == 4) {
            if (Request.status == 0) {
              state.retry_count ++;
              if (state.retry_count > flecs.params.max_retry_count) {
                if (err) {
                  console.error("request to " + flecs.params.host + " failed");
                  err('{"error": "request failed: max retry count exceeded"}');
                  return;
                }
              }

              // Retry if the server did not respond to request
              if (state.retry_interval) {
                state.retry_interval *= 1.3;
                if (state.retry_interval > 1000) {
                  state.retry_interval = 1000;
                }

                // No point in timing out sooner than retry interval
                if (state.timeout < state.retry_interval) {
                  state.timeout = state.retry_interval;
                }

                console.error("retrying request to " + flecs.params.host +
                  ", ensure app is running and REST is enabled " +
                  "(retried " + state.retry_count + " times)");

                window.setTimeout(() => {
                  flecs._.request(method, flecs.params.host, path, recv, err, state);
                }, state.retry_interval);
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

      entity_params: function(params) {
        if (!params) {
          params = {};
        }

        const raw = params.raw === true;
        if (!raw) {
          let type_info = params.type_info;
          let alerts = params.alerts;
          params = {
            values: true,
            type_info: type_info,
            alerts: alerts
          };
        }

        return params;
      },

      query_params: function(params) {
        if (!params) {
          params = {};
        }
  
        const raw = params.raw === true;
        if (!raw) {
          let type_info = params.type_info;
          params = {
            term_ids: true,
            values: true,
            variables: true,
            entities: true,
            type_info: type_info
          };
        }

        return params;
      },

      format_entity_result: function(msg) {
        let result = {};
        result.parent = msg.path.split(".").slice(0, -1).join(".");
        result.name = msg.path.split(".").slice(-1)[0];
        result.tags = [];
        result.components = {};
        if (msg.type_info) {
          result.type_info = {};
          for (let i = 0; i < msg.type_info.length; i ++) {
            if (msg.type_info[i] !== 0) {
              result.type_info[msg.ids[i]] = msg.type_info[i];
            }
          }
        }
        if (msg.alerts) {
          result.alerts = msg.alerts;
        }

        for (let i = 0; i < msg.ids.length; i ++) {
          let id = msg.ids[i].join(",");
          if (msg.ids[i].length === 2) {
            id = "(" + id + ")";
          }
          if (msg.values[i] === 0) {
            result.tags.push(id);
          } else {
            result.components[id] = msg.values[i];
          }
        }

        return result;
      },

      format_query_result: function(msg) {
        const term_ids = msg.ids;
        const vars = msg.vars;
        let entities = [];
        let out = {};
        if (msg.type_info) {
          out.type_info = msg.type_info;
        }
        out.entities = entities;

        for (let result of msg.results) {
          for (let i = 0; i < result.entities.length; i ++) {
            let obj = {};
            obj.parent = result.parent;
            obj.name = result.entities[i];
            obj.tags = [];
            obj.components = {};

            let ids = term_ids;
            if (ids === undefined) {
              ids = result.ids;
            }

            for (let j = 0; j < ids.length; j ++) {
              let id = ids[j].join(",");
              if (ids[j].length === 2) {
                id = "(" + id + ")";
              }
              if (!result.values || result.values[j] === 0) {
                obj.tags.push(id);
              } else {
                obj.components[id] = result.values[j][i];
              }
            }

            if (vars) {
              obj.vars = {};
              for (let j = 0; j < vars.length; j ++) {
                obj.vars[vars[j]] = result.vars[j];
              }
            }

            entities.push(obj);
          }
        }

        return out;
      },

      request_query: function(params, recv, err) {
        return flecs._.request("GET", "query", params, (msg) => {
          msg = JSON.parse(msg);
          if (!params.raw)  {
            recv(flecs._.format_query_result(msg));
          } else {
            recv(msg);
          }
        }, err);
      }
    },

    connect: function(host) {
      flecs.params.host = host;
    },

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
      }, err);
    },

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

    query_name: function(query, params, recv, err) {
      params = flecs._.query_params(params);
      params.name = encodeURIComponent(query);
      return flecs._.request_query(params, recv, err);
    }
};
