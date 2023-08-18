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
                  err({error: "Request failed: max retry count exceeded"});
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
      }
    },

    connect: function(host) {
      flecs.params.host = host;
    },

    entity: function(path, params, recv, err) {
      path = path.replace(/\./g, "/");
      return flecs._.request("GET", "entity/" + path, params, recv, err);
    },

    query: function(query, params, recv, err) {
      if (!params) {
        params = {};
      }
      params.q = encodeURIComponent(query);
      return flecs._.request("GET", "query", params, recv, err);
    },

    query_name: function(query, params, recv, err) {
      if (!params) {
        params = {};
      }
      params.name = encodeURIComponent(query);
      return flecs._.request("GET", "query", params, recv, err);
    }
};
