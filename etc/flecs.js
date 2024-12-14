// Flecs JavaScript client library (c) 2024, Sander Mertens, MIT license
//   Wrapper around the Flecs REST API.
//
// Resources:
//   Flecs repository: https://github.com/SanderMertens/flecs
//   API manual: https://www.flecs.dev/flecs/md_docs_RestApi.html
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

  // Whether explorer is connected to remote app or wasm image
  ConnectionMode: {
    Unknown:          Symbol('Unknown'),
    Remote:           Symbol('Remote'),
    Wasm:             Symbol('Wasm'),

    toString(value) {
      if (value == this.Unknown) {
        return "Unknown";
      } else if (value == this.Remote) {
        return "Remote";
      } else if (value == this.Wasm) {
        return "Wasm";
      } else {
        return "UnknownConnectionMode";
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
        poll_interval_ms: 1000, // For managed queries
        retry_interval_ms: 200,
        max_retry_count: 5
      };
  
      if (params) {
        if (params.timeout_ms) connParams.timeout_ms = params.timeout_ms;
        if (params.poll_interval_ms !== undefined) connParams.poll_interval_ms = params.poll_interval_ms;
        if (params.retry_interval_ms) connParams.retry_interval_ms = params.retry_interval_ms;
        if (params.max_retry_count) connParams.max_retry_count = params.max_retry_count;
        if (params.fallback_host) connParams.fallback_host = params.fallback_host;
        if (params.on_fallback) connParams.on_fallback = params.on_fallback;
        connParams.on_status = params.on_status;
        connParams.on_host = params.on_host;
        connParams.on_heartbeat = params.on_heartbeat;
      }
  
      return {
        status: flecs.ConnectionStatus.Initializing,
        mode: flecs.ConnectionMode.Unknown,
        params: connParams,
        worldInfo: undefined,

        managedRequests: [],

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
          this.disconnect();

          if (host.length > 5 && (host.slice(host.length - 5, host.length) === ".wasm")) {
            this._.loadWasmModule(host);
            this.mode = flecs.ConnectionMode.Wasm;
          } else {
            this._.FlecsHttpRequest = () => new XMLHttpRequest();
            this.mode = flecs.ConnectionMode.Remote;
          }
  
          // Connect to host, start connection manager
          this.params.host = newHost;
          this._.startConnMgr(this);
        },
  
        // Disconnect from host
        disconnect() {
          for (let r of this.managedRequests) {
            r.abort(true /* keep persistent requests */);
          }
          this._.stopConnMgr(this);
        },

        // Set params for managed requests. Supported params:
        //  - poll_interval_ms
        set_managed_params(params) {
          if (params.poll_interval_ms !== undefined) {
            this.params.poll_interval_ms = params.poll_interval_ms;

            for (let r of this.managedRequests) {
              const old_interval = r.poll_interval_ms;
              r.poll_interval_ms = params.poll_interval_ms;

              if (!old_interval) {
                r.resume();
              } else if (params.poll_interval_ms === 0) {
                r.cancel();
              }
            }
          }
        },

        // Request managed requests
        request_managed() {
          for (let r of this.managedRequests) {
            if (!r.poll_interval_ms) {
              r.resume();
            }
          }
        },
  
        // Request entity
        entity: function(path, params, recv, err, abort) {
          path = this._.escapePath(path);
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
            }, abort, params.poll_interval_ms);
        },
  
        // Request query
        query: function(query, params, recv, err, abort) {
          if (query === undefined) {
            console.error("flecs.query: invalid query parameter");
            return;
          }
  
          // Normalize query string
          query = flecs.trimQuery(query);
          query = query.replaceAll(", ", ",");
  
          params.expr = encodeURIComponent(query);
          return this._.requestQuery(
            this, params, recv, err, abort, params.poll_interval_ms);
        },
  
        // Request named query
        queryName: function(query, params, recv, err, abort) {
          params.name = encodeURIComponent(query);
          return this._.requestQuery(
            this, params, recv, err, abort, params.poll_interval_ms);
        },

        // Set component
        set: function(path, component, value) {
          path = this._.escapePath(path);
          if (typeof value == "object") {
            value = JSON.stringify(value);
            value = encodeURIComponent(value);
          }
          return this._.request(this, "PUT", "component/" + path, 
            {component: component, value: value});
        },

        // Get component
        get: function(path, params, recv, err) {
          path = this._.escapePath(path);
          if (typeof data == "object") {
            data = JSON.stringify(data);
            data = encodeURIComponent(data);
          }
          return this._.request(this, "GET", "component/" + path, 
            params, (msg) => {
              recv(JSON.parse(msg));
            }, err);
        },

        // Add component
        add: function(path, component) {
          path = this._.escapePath(path);
          return this._.request(this, "PUT", "component/" + path, 
            {component: component});
        },

        // Remove component
        remove: function(path, component) {
          path = this._.escapePath(path);
          return this._.request(this, "DELETE", "component/" + path,
            {component: component});
        },

        // Enable entity/component
        enable: function(path, component) {
          path = this._.escapePath(path);
          return this._.request(this, "PUT", "toggle/" + path, {
            enable: true, component: component
          });
        },

        // Disable entity/component
        disable: function(path, component) {
          path = this._.escapePath(path);
          return this._.request(this, "PUT", "toggle/" + path, {
            enable: false, component: component
          });
        },

        // Create entity
        create: function(path) {
          path = this._.escapePath(path);
          return this._.request(this, "PUT", "entity/" + path, {});
        },

        // Delete entity
        delete: function(path) {
          path = this._.escapePath(path);
          return this._.request(this, "DELETE", "entity/" + path, {});
        },

        // Get all entities in world
        world: function(reply, err) {
          return this._.request(this, "GET", "world", {}, reply, err);
        },

        // Update script code
        scriptUpdate: function(path, code, params, recv, err) {
          if (!params) params = {};
          params.code = encodeURIComponent(code);
          path = this._.escapePath(path);
          return this._.request(this, "PUT", "script/" + path, params, 
            (msg) => { 
              if (!msg) { msg = "{}"; }
              recv(JSON.parse(msg))
            }, 
            (msg) => { 
              if (!msg) { msg = "{}"; }
              if (err) {
                err(JSON.parse(msg))
              }
            }
          );
        },

        // Other REST endpoints
        request: function(path, params, recv, err, abort) {
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
            abort,
            params.poll_interval_ms);
        },
  
        // Private methods
        _: {
          FlecsHttpRequest: undefined,
          requests: [],

          // Set status of connection
          setStatus(pub, status) {
            if (status != pub.status) {
              pub.status = status;
              if (pub.params.on_status) {
                pub.params.on_status(status);
              }
            }
          },

          // Escape entity path
          escapePath(path) {
            path = path.replaceAll("/", "%5C%2F");
            path = path.replaceAll("\\.", "@@");
            path = path.replaceAll(".", "/");
            path = path.replaceAll("@@", ".");
            path = path.replaceAll("#", "%23");
            return path;
          },
  
          // Do HTTP request.
          request: function(conn, method, path, params, recv, err, on_abort, poll_interval_ms) {
            // If this is a dryrun we're only returning the URL. Don't include the
            // dryrun parameter in the returned URL.
            let dryrun = false;
  
            if (params.dryrun) {
              dryrun = true;
              delete params.dryrun;
            }

            if (params.managed) {
              poll_interval_ms = conn.params.poll_interval_ms;
            }
        
            // Create the request object
            let result = {
              // Properties
              status: flecs.RequestStatus.Pending,
              owner: this,
              conn: conn,
              request: undefined,
              method: method,
              // relative URL so we can persist requests across connections
              url: path + flecs._.paramStr(params), 
              recv: recv,
              err: err,
              on_abort: on_abort,
              poll_interval_ms: poll_interval_ms,
              retry_interval_ms: conn.retry_interval_ms,
              managed: params.managed,
              persist: params.persist,
              retry_count: 0,
              aborted: false,
  
              // Do request
              do() {
                if (dryrun) {
                  return;
                }

                if (!conn._.FlecsHttpRequest) {
                  setTimeout(() => {
                    this.do();
                  }, 1000);
                  return;
                }

                let url;
                if (conn.mode == flecs.ConnectionMode.Remote) {
                  url = conn.params.host;
                  if (url.slice(0, 4) !== "http") {
                    url = "http://" + url;
                  }

                  let portIndex = url.indexOf(":"); // first is protocol
                  portIndex = url.indexOf(portIndex + 1, ":");
                  if (portIndex == -1) {
                    url += ":27750";
                  }

                  url += "/" + this.url;
                } else {
                  url = "/" + this.url;
                }

                this.request = conn._.FlecsHttpRequest();
                this.request.open(this.method, url);
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
                        if (this.err && !this.aborted) {
                          this.err(this.request.responseText);
                        }
                      } else {
                        requestOk = true;

                        // Request OK
                        if (this.recv && !this.aborted) {
                          this.recv(this.request.responseText, url);
                        }
                      }
                    }

                    if (!requestOk) {
                      conn.requests.error ++;
                    }
  
                    // Poll if necessary
                    this._.poll(this);

                    this.aborted = false;
                  }
                };
  
                // Send it
                this.request.send();

                conn.requests.sent ++;
              },
  
              // Redo the request
              redo() {
                if (!this.aborted) {
                  this.retry_interval_ms = this.conn.retry_interval_ms;
                  this.do(true);
                }
              },

              // Resume cancelled request
              resume() {
                this.aborted = false;
                this.do();
              },

              // Cancel request
              cancel() {
                if (this.request) {
                  this.status = flecs.RequestStatus.Aborting;
                  this.request.abort();
                  this.aborted = true;
                }
              },
  
              // Abort request
              abort(keepPersist = false) {
                if (this.request) {
                  this.cancel();

                  if (this.managed) {
                    if (!this.persist || !keepPersist) {
                      this.conn.managedRequests = 
                        this.conn.managedRequests.filter(item => item !== this);
                    }
                  }

                  if (this.on_abort) {
                    this.on_abort(this);
                  }

                  this.request = undefined;
                }
              },
  
              // Private methods
              _: {
                // Do polling if request has poll interval
                poll(pub) {
                  if (pub.poll_interval_ms && !pub.aborted) {
                    if (pub.status == flecs.RequestStatus.Done) {
                      // If this is a polling request and valid data was received,
                      // the request is alive.
                      pub.status = flecs.RequestStatus.Alive;
                    }
  
                    setTimeout(() => {
                      this.retry_count = 0;
                      pub.redo();
                    }, pub.poll_interval_ms);
                  }
                },
  
                // Handle request error
                onError(pub) {
                  if (pub.aborted) {
                    this.status = flecs.RequestStatus.Aborted;
                    return;
                  }
                
                  if (pub.poll_interval_ms) {
                    // When this is a polling request don't bother with retrying
                    const errMsg = `request to ${pub.conn.params.host} failed`;
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

            if (params.managed) {
              conn.managedRequests.push(result);
            }

            // Do request
            result.do();
  
            // Return request object
            return result;
          },
  
          // Do query request
          requestQuery: function(conn, params, recv, err, on_abort, poll_interval_ms) {
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
              on_abort, poll_interval_ms);
          },
  
          // Start heartbeat request that monitors connection liveliness
          startConnMgr(pub) {
            this.setStatus(pub, flecs.ConnectionStatus.Initializing);
  
            this.connMgrRequest = pub.entity("flecs.core.World", 
              {values: true, label: true, poll_interval_ms: 1000}, 
              (msg) => {
                pub.worldInfo = msg;

                if (pub.status !== flecs.ConnectionStatus.Connected) {
                  for (let r of pub.managedRequests) {
                    r.resume();
                  }
                }

                this.setStatus(pub, flecs.ConnectionStatus.Connected);

                if (pub.params.on_heartbeat) {
                  pub.params.on_heartbeat(msg);
                }
              }, (err) => {
                if (pub.status == flecs.ConnectionStatus.Initializing) {
                  if (pub.params.on_fallback) {
                    pub.disconnect();
                    if (pub.params.on_fallback) {
                      pub.params.on_fallback();
                    }
                  }
                }

                if (pub.status == flecs.ConnectionStatus.Connected) {
                  this.setStatus(pub, flecs.ConnectionStatus.RetryConnecting);
                }
              });
          },

          // Stop monitoring heartbeats
          stopConnMgr(pub) {
            if (this.connMgrRequest) {
              this.connMgrRequest.abort();
              this.setStatus(pub, flecs.ConnectionStatus.Disconnected);
              this.connMgrRequest = undefined;
              pub.worldInfo = undefined;
            }
          },

          wasmModuleLoaded(wasm_url) {
            const conn_priv = this;
            const name = wasm_url.slice(wasm_url.lastIndexOf("/") + 1, wasm_url.lastIndexOf("."));
            wasm_module = Function(`return ` + name + `;`)();
            wasm_module().then(function(Module) {
              let nativeRequest = Module.cwrap('flecs_explorer_request', 'string', ['string', 'string']);
              flecs.captureKeyboardEvents = Module.sokol_capture_keyboard_events;
              if (flecs.captureKeyboardEvents) {
                Module.sokol_capture_keyboard_events(false);
                flecs.has3DCanvas = true;
              }

              conn_priv.FlecsHttpRequest = function() {
                return {
                  method: undefined,
                  url: undefined,
                  handler: undefined,
                  status: 200,
                  readyState: 4,
                  onreadystatechange: undefined,

                  open(method, url) {
                    this.method = method;
                    this.url = url;
                  },

                  send() {
                    const reply = nativeRequest(this.method, this.url);
                    this.responseText = reply;

                    // Check for errors, in which case we must set the status
                    if (reply) {
                      const replyObj = JSON.parse(reply);
                      if (replyObj.error) {
                        this.status = replyObj.status;
                      }
                    }

                    if (this.onreadystatechange) {
                      this.onreadystatechange(reply);
                    }
                  },

                  abort() {}
                };
              };
            });
          },

          loadWasmModule(wasm_url, onReady) {
            let js_url = wasm_url.slice(0, wasm_url.length - 5) + ".js";
            const oldEl = document.getElementById("wasm-module");
            if (oldEl) {
              oldEl.remove();
            }
            
            const scriptEl = document.createElement("script");
            scriptEl.id = "wasm-module";
            scriptEl.onload = () => {
              this.wasmModuleLoaded(js_url, onReady);
            };
            scriptEl.onerror = () => {
              console.error(`failed to load wasm module ${wasm_url}`);
            };
            scriptEl.src = js_url;
          
            document.head.appendChild(scriptEl);
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
          if (k === "poll_interval_ms" || k === "host" || k === "managed" || k === "persist") {
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
    }
  },
};
