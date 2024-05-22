// Flecs JavaScript client library (c) 2024, Sander Mertens, MIT license
//   Wrapper around the Flecs REST API.
//
// Resources:
//   Flecs repository: https://github.com/SanderMertens/flecs
//   API manual: https://www.flecs.dev/flecs/md_docs_RestApi.html
//
// For a backwards-compatible version of the API, use /v1/flecs.js
//

// If the environment is Node.js import XMLHttpRequest
if (typeof process === "object" && typeof require === "function") {
  var XMLHttpRequest = require("xhr2");
}

const flecs = {
  // State of connection
  ConnectionStatus: {
    Connecting:       Symbol('Connecting'),       // Attempting to connect
    RetryConnecting:  Symbol('RetryConnecting'),  // Attempting to restore a lost connection
    Connected:        Symbol('Connected'),        // Connected
    Disconnected:     Symbol('Disconnected'),     // Disconnected (not attempting to connect)
    
    toString(value) {
      if (value == this.Connecting) {
        return "Connecting";
      } else if (value == this.RetryConnecting) {
        return "RetryConnecting";
      } else if (value == this.Connected) {
        return "Connected";
      } else if (value == this.Disconnected) {
        return "Disconnected";
      } else {
        return "UnknownConnectionStatus";
      }
    }
  },

  // State of outstanding request
  RequestStatus: {
    Pending:          Symbol('Pending'),          // Resource is requested but not ready
    Alive:            Symbol('Alive'),            // Polling request is receiving data
    Done:             Symbol('Done'),             // Non-polling request received data
    Aborting:         Symbol('Aborting'),         // Request is being aborted
    Aborted:          Symbol('Aborted'),          // Request was aborted
    Failed:           Symbol('Failed'),           // Request failed
  },

  // Remove whitespaces from query string
  trimQuery(query) {
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

  // Create a new connection to a Flecs application
  connect(params) {
    let conn = this._.createConnection(params);
    conn.connect(params.host);
    return conn;
  },

  // Private methods
  _: {
    createConnection(params) {
      let connParams = {
        host: undefined,
        timeout_ms: 1000,
        retry_interval_ms: 200,
        max_retry_count: 5
      };
  
      if (params) {
        if (params.timeout_ms) connParams.timeout_ms = params.timeout_ms;
        if (params.retry_interval_ms) connParams.retry_interval_ms = params.retry_interval_ms;
        if (params.max_retry_count) connParams.max_retry_count = params.max_retry_count;
        connParams.on_status = params.on_status;
        connParams.on_host = params.on_host;
        connParams.on_heartbeat = params.on_heartbeat;
      }
  
      return {
        status: flecs.ConnectionStatus.Initializing,
        params: connParams,
        worldInfo: undefined,

        requests: {
          sent: 0,
          received: 0,
          error: 0
        },

        bytes: {
          received: 0
        },

        // Connect to (different) host
        connect(host) {
          let newHost = host;
          if (!newHost) {
            newHost = this.params.host;
          }
  
          if (!newHost) {
            console.error("no host specified for flecs.connect()");
            return;
          }
  
          if (newHost == this.params.host) {
            if (this.status == flecs.ConnectionStatus.Connected) {
              /* Already connected */
              console.warning(`already connected to host ${newHost}`);
              return;
            } else if (this.status == flecs.ConnectionStatus.RetryConnecting) {
              /* Already retrying to connect */
              console.warning(`already reconnected to host ${newHost}`);
              return;
            }
          } else if (this.params.on_host) {
            this.params.on_host(newHost);
          }
  
          // If already connected to another host, disconnect first
          if (this.status != flecs.ConnectionStatus.Initializing) {
            this.disconnect();
          }
  
          // Connect to host, start connection manager
          this.params.host = newHost;
          this._.startConnMgr(this);
        },
  
        // Disconnect from host
        disconnect() {
          this._.stopConnMgr(this);
        },
  
        // Request entity
        entity: function(path, params, recv, err) {
          path = path.replace(/\./g, "/");
          return this._.request(this, "GET", "entity/" + path, params, 
            (msg) => {
              if (msg[0] == '{' || msg[0] == '[') {
                msg = JSON.parse(msg);
                recv(msg);
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
  
        // Request query
        query: function(query, params, recv, err) {
          if (query === undefined) {
            console.error("flecs.query: invalid query parameter");
            return;
          }
  
          // Normalize query string
          query = flecs.trimQuery(query);
          query = query.replaceAll(", ", ",");
  
          params.q = encodeURIComponent(query);
          return this._.requestQuery(
            this, params, recv, err, params.poll_interval);
        },
  
        // Request named query
        queryName: function(query, params, recv, err) {
          params.name = encodeURIComponent(query);
          return this._.requestQuery(
            this, params, recv, err, params.poll_interval);
        },

        // Other REST endpoints
        request: function(path, params, recv, err) {
          return this._.request(this, "GET", path, params, 
            (msg) => {
              if (recv) {
                recv(JSON.parse(msg))
              }
            }, (msg) => {
              if (err) {
                err(JSON.parse(msg))
              }
            },
            params.poll_interval);
        },
  
        // Private methods
        _: {
          requests: [],

          // Set status of connection
          setStatus(pub, status) {
            if (status != pub.status) {
              this.status = status;
              if (pub.params.on_status) {
                pub.params.on_status(status);
              }
            }
          },
  
          // Do HTTP request.
          request: function(conn, method, path, params, recv, err, poll_interval) {
            // If this is a dryrun we're only returning the URL. Don't include the
            // dryrun parameter in the returned URL.
            let dryrun = false;
  
            if (params.dryrun) {
              dryrun = true;
              delete params.dryrun;
            }
        
            // Create the request object
            let result = {
              // Properties
              status: flecs.RequestStatus.Pending,
              owner: this,
              conn: conn,
              request: undefined,
              method: method,
              url: conn.params.host + "/" + path + flecs._.paramStr(params),
              recv: recv,
              err: err,
              poll_interval: poll_interval,
              retry_interval_ms: conn.retry_interval_ms,
              retry_count: 0,
              aborted: false,
  
              // Do request
              do(redo = false) {
                if (dryrun) {
                  return;
                }

                this.request = new XMLHttpRequest();
                this.request.open(this.method, this.url);
                this.request.onreadystatechange = (reply) => {
                  if (this.request.readyState == 4) {
                    let requestOk = false;

                    conn.requests.received ++;
                    if (this.request.responseText.length) {
                      conn.bytes.received += this.request.responseText.length;
                    }

                    // Request ready
                    if (this.request.status == 0) {
                      // No reply was received
                      this.status = flecs.RequestStatus.Pending;
  
                      this._.onError(this, reply);
                    } else {
                      // Reply was received, even if it returned an error
                      this.status = flecs.RequestStatus.Done;
  
                      if (this.request.status < 200 || this.request.status >= 300) {
                        // Error status
                        if (this.err) {
                          this.err(this.request.responseText);
                        }
                      } else {
                        requestOk = true;

                        // Request OK
                        if (this.recv) {
                          this.recv(this.request.responseText, this.url);
                        }
                      }
                    }

                    if (!requestOk) {
                      conn.requests.error ++;
                    }
  
                    // Poll if necessary
                    this._.poll(this);
                  }
                };
  
                // Send it
                this.request.send();

                conn.requests.sent ++;
              },
  
              // Redo the request
              redo() {
                this.retry_interval_ms = this.conn.retry_interval_ms;
                this.do(true);
              },
  
              // Abort request
              abort() {
                if (this.request) {
                  this.status = flecs.RequestStatus.Aborting;
                  this.request.abort();
                  this.aborted = true;
                }
              },
  
              // Private methods
              _: {
                // Do polling if request has poll interval
                poll(pub) {
                  if (pub.poll_interval && !pub.aborted) {
                    if (pub.status == flecs.RequestStatus.Done) {
                      // If this is a polling request and valid data was received,
                      // the request is alive.
                      pub.status = flecs.RequestStatus.Alive;
                    }
  
                    setTimeout(() => {
                      this.retry_count = 0;
                      pub.redo();
                    }, pub.poll_interval);
                  }
                },
  
                // Handle request error
                onError(pub) {
                  if (pub.poll_interval) {
                    // When this is a polling request don't bother with retrying
                    const errMsg = `request to ${pub.conn.host} failed`;
                    if (pub.err) pub.err(`{"error": \"${errMsg}\"}`);
                    return;
                  }

                  pub.retry_count ++;
                  if (pub.retry_count > pub.conn.max_retry_count) {
                    const errMsg = 
                      `request to ${pub.conn.host} failed: max retry count exceeded`;
                    console.error(errMsg);
                    if (pub.err) pub.err(`{"error": \"${errMsg}\"}`);
                    pub.retry_count = 0;
                    return;
                  }
  
                  if (pub.aborted) {
                    this.status = flecs.RequestStatus.Aborted;
                    console.log(`request to ${pub.conn.host} aborted`);
                    return;
                  }
  
                  // Retry if the server did not respond to request
                  if (pub.retry_interval_ms) {
                    pub.retry_interval_ms *= 1.3;
                    if (pub.retry_interval_ms > 1000) {
                      pub.retry_interval_ms = 1000;
                    }
  
                    // No point in timing out sooner than retry interval
                    if (pub.timeout_ms < pub.retry_interval_ms) {
                      pub.timeout_ms = pub.retry_interval_ms;
                    }
  
                    console.error(`retrying request to ${pub.conn.host}` +
                      `, ensure app is running and REST is enabled` +
                      `(retried ${pub.retry_count} times)`);
  
                    setTimeout(() => {
                      pub.redo();
                    }, pub.retry_interval_ms);
                  } else {
                    if (err) err(Request.responseText);
                  }
                }
              }
            };
  
            // Do request
            result.do();
  
            // Return request object
            return result;
          },
  
          // Do query request
          requestQuery: function(conn, params, recv, err, poll_interval) {
            let endpoint = "query";
            let on_recv, on_err;
            if (recv) {
              on_recv = (msg) => {
                if (msg && (msg[0] == '{' || msg[0] == '[')) {
                  msg = JSON.parse(msg);
                  recv(msg);
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
                  if (msg && (msg[0] == '{' || msg[0] == '[')) {
                    err(JSON.parse(msg));
                  } else {
                    err({error: msg});
                  }
                }
              }
            }
  
            return this.request(conn, "GET", endpoint, params, on_recv, on_err, 
              poll_interval);
          },
  
          // Start heartbeat request that monitors connection liveliness
          startConnMgr(pub) {
            this.setStatus(pub, flecs.ConnectionStatus.Initializing);
  
            this.connMgrRequest = pub.entity("flecs.core.World", 
              {values: true, label: true, poll_interval: 1000}, 
              (msg) => {
                pub.worldInfo = msg;

                this.setStatus(pub, flecs.ConnectionStatus.Connected);

                if (pub.params.on_heartbeat) {
                  pub.params.on_heartbeat(msg);
                }
              }, (err) => {
                this.setStatus(pub, flecs.ConnectionStatus.RetryConnecting);
              });
          },

          // Stop monitoring heartbeats
          stopConnMgr(pub) {
            this.connMgrRequest.abort();
            this.setStatus(pub, flecs.ConnectionStatus.Disconnected);
            pub.worldInfo = undefined;
          }
        }
      };
    },

    // Convert JavaScript object to query string
    paramStr(params) {
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
  },
};
