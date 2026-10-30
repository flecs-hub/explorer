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

  DefaultPort: 27750,

  reloadBypassingCache() {
    const urls = performance.getEntriesByType("resource").filter((entry) => {
      return entry.initiatorType !== "xmlhttprequest" &&
        entry.name.startsWith(window.location.origin);
    }).map((entry) => entry.name);
    urls.push(window.location.href);

    return Promise.allSettled(urls.map((url) => {
      return fetch(url, { cache: "reload" });
    })).then(() => {
      window.location.reload();
    });
  },

  normalizeHost(host) {
    if (!host) {
      return host;
    }

    let result = host.trim();
    if (result.endsWith(".wasm")) {
      return result;
    }

    if (result.startsWith("http://")) {
      result = result.slice(7);
    }

    while (result.endsWith("/")) {
      result = result.slice(0, -1);
    }

    if (!/:\d+$/.test(result)) {
      result += ":" + flecs.DefaultPort;
    }

    return result;
  },

  discover(params = {}) {
    const hostname = params.hostname || "localhost";
    const portMin = params.port_min !== undefined ? params.port_min : 27750;
    const portMax = params.port_max !== undefined ? params.port_max : 27760;
    const portLimit = params.port_limit !== undefined ? params.port_limit : portMax + 256;
    const timeout_ms = params.timeout_ms !== undefined ? params.timeout_ms : 1000;

    const probe = (port, checkUsed) =>
      flecs._.probeHost(hostname, port, timeout_ms, checkUsed);

    const ports = [];
    for (let port = portMin; port <= portMax; port ++) {
      ports.push(port);
    }

    const scanRange = Promise.all(ports.map((port) => probe(port, false)));

    return scanRange.then((results) => {
      const scanNext = (port) => {
        if (port > portLimit) {
          return results;
        }
        return probe(port, true).then((result) => {
          results.push(result);
          if (!result.used) {
            return results;
          }
          return scanNext(port + 1);
        });
      };
      return scanNext(Math.max(portMin, portMax + 1));
    }).then((results) => {
      return results
        .filter((result) => result.flecs)
        .sort((a, b) => a.port - b.port)
        .map((result) => ({
          host: result.host,
          hostname: hostname,
          port: result.port,
          name: result.name,
          world: result.world
        }));
    });
  },

  startDiscovery(params = {}) {
    const interval_ms = params.interval_ms !== undefined ? params.interval_ms : 5000;

    const discovery = {
      hosts: [],
      stopped: false,
      timer: undefined,
      pending: undefined,

      scan() {
        if (this.stopped) {
          return Promise.resolve(this.hosts);
        }
        if (this.pending) {
          return this.pending;
        }

        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = undefined;
        }

        this.pending = flecs.discover(params).then((hosts) => {
          this.pending = undefined;
          if (this.stopped) {
            return hosts;
          }

          this.hosts = hosts;
          if (params.on_hosts) {
            params.on_hosts(hosts);
          }

          this.schedule();
          return hosts;
        });

        return this.pending;
      },

      schedule() {
        if (interval_ms && !this.stopped) {
          this.timer = setTimeout(() => {
            this.timer = undefined;
            this.scan();
          }, interval_ms);
        }
      },

      stop() {
        this.stopped = true;
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = undefined;
        }
      }
    };

    discovery.scan();
    return discovery;
  },

  // Private methods
  _: {
    wasmModules: {},
    requestCount: 0,

    newHttpRequest() {
      return new XMLHttpRequest();
    },

    probeHost(hostname, port, timeout_ms, checkUsed) {
      const host = hostname + ":" + port;
      const url = "http://" + host;

      return new Promise((resolve) => {
        let done = false;
        const finish = (result) => {
          if (!done) {
            done = true;
            result.host = host;
            result.port = port;
            resolve(result);
          }
        };

        let request;
        try {
          request = flecs._.newHttpRequest();
          request.open("GET", url + "/entity/flecs/core/World?values=true&label=true");
          request.timeout = timeout_ms;
        } catch (e) {
          finish({used: false, flecs: false});
          return;
        }

        request.onload = () => {
          if (request.status >= 200 && request.status < 300) {
            try {
              const world = JSON.parse(request.responseText);
              let name;
              if (world && world.components) {
                const desc = world.components["(flecs.doc.Description,flecs.core.Name)"];
                if (desc) {
                  name = desc.value;
                }
              }
              finish({used: true, flecs: true, name: name, world: world});
              return;
            } catch (e) {}
          }
          finish({used: true, flecs: false});
        };

        request.ontimeout = () => {
          finish({used: true, flecs: false});
        };

        request.onerror = () => {
          if (!checkUsed) {
            finish({used: false, flecs: false});
            return;
          }
          flecs._.probeUsed(url, timeout_ms).then((used) => {
            finish({used: used, flecs: false});
          });
        };

        request.send();
      });
    },

    probeUsed(url, timeout_ms) {
      if (typeof window !== "object" || typeof fetch !== "function") {
        return Promise.resolve(false);
      }

      let controller;
      let timer;
      if (typeof AbortController === "function") {
        controller = new AbortController();
        timer = setTimeout(() => controller.abort(), timeout_ms);
      }

      return fetch(url + "/", {
        mode: "no-cors",
        cache: "no-store",
        signal: controller ? controller.signal : undefined
      }).then(() => {
        return true;
      }, (err) => {
        return !!(err && err.name === "AbortError");
      }).finally(() => {
        if (timer) {
          clearTimeout(timer);
        }
      });
    },

    createConnection(params) {
      let connParams = {
        host: undefined,
        timeout_ms: 10000,
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
            this._.wasm_url = undefined;
            this._.FlecsHttpRequest = () => new XMLHttpRequest();
            this.mode = flecs.ConnectionMode.Remote;

            let url = newHost;
            if (url.slice(0, 4) !== "http") {
              url = "http://" + url;
            }

            let portIndex = url.indexOf(":"); // first is protocol
            portIndex = url.indexOf(":", portIndex + 1);
            if (portIndex == -1) {
              url += ":27750";
            }

            this.url = url;
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
                if (msg && (msg[0] == '{' || msg[0] == '[')) {
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
        add: function(path, component, recv, err) {
          path = this._.escapePath(path);
          return this._.request(this, "PUT", "component/" + path, 
            {component: component}, recv, err);
        },

        // Remove component
        remove: function(path, component, recv, err) {
          path = this._.escapePath(path);
          return this._.request(this, "DELETE", "component/" + path,
            {component: component}, recv, err);
        },

        // Enable entity/component
        enable: function(path, component, recv, err) {
          path = this._.escapePath(path);
          return this._.request(this, "PUT", "toggle/" + path, {
            enable: true, component: component
          }, recv, err);
        },

        // Disable entity/component
        disable: function(path, component, recv, err) {
          path = this._.escapePath(path);
          return this._.request(this, "PUT", "toggle/" + path, {
            enable: false, component: component
          }, recv, err);
        },

        // Create entity
        create: function(path, recv, err) {
          path = this._.escapePath(path);
          return this._.request(this, "PUT", "entity/" + path, {}, recv, err);
        },

        // Delete entity
        delete: function(path, recv, err) {
          path = this._.escapePath(path);
          return this._.request(this, "DELETE", "entity/" + path, {}, recv, err);
        },

        // Get all entities in world
        world: function(recv, err) {
          return this._.request(this, "GET", "world", {}, recv, err);
        },

        // Update script code
        scriptUpdate: function(path, code, params, recv, err) {
          if (!params) params = {};
          params.payload = code;
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

        // Run action
        action: function(action, recv, err) {
          return this._.request(this, "PUT", "action/" + action, {}, recv, err);
        },

        commandSessionCreate: function(recv, err) {
          return this._.request(this, "PUT", "shell/session", {},
            (msg) => { if (recv) recv(this._.parseReply(msg)); },
            (msg) => { if (err) err(this._.parseReply(msg)); });
        },

        commandSessionDelete: function(session, recv, err) {
          return this._.request(this, "DELETE", "shell/session/" + session, {},
            (msg) => { if (recv) recv(this._.parseReply(msg)); },
            (msg) => { if (err) err(this._.parseReply(msg)); });
        },

        commandSessionHistory: function(session, params, recv, err) {
          return this._.request(this, "GET",
            "shell/session/" + session + "/history", params || {},
            (msg) => { if (recv) recv(this._.parseReply(msg)); },
            (msg) => { if (err) err(this._.parseReply(msg)); });
        },

        commandRun: function(session, cmd, params, recv, err) {
          if (!params) params = {};
          params.payload = cmd;
          return this._.request(this, "PUT", "shell/session/" + session, params,
            (msg) => { if (recv) recv(this._.parseReply(msg)); },
            (msg) => { if (err) err(this._.parseReply(msg)); });
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

          parseReply(msg) {
            if (!msg) {
              return {};
            }
            try {
              return JSON.parse(msg);
            } catch (e) {
              return { error: msg };
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
            
            let payload = undefined;

            if (params.payload) {
              payload = params.payload;
              delete params.payload;
            }

            if (params.managed) {
              poll_interval_ms = conn.params.poll_interval_ms;
            }

            let latency_budget_ms = params.latency_budget_ms;

            // Create the request object
            let result = {
              // Properties
              id: ++ flecs._.requestCount,
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
              latency_budget_ms: latency_budget_ms,
              budgetTimer: undefined,
              budgetFired: false,
              managed: params.managed,
              persist: params.persist,
              retry_count: 0,
              aborted: false,
  
              // Do request
              do(cache = true) {
                if (dryrun) {
                  return;
                }

                if (this.aborted) {
                  return;
                }

                if (!conn._.FlecsHttpRequest) {
                  setTimeout(() => {
                    this.do();
                  }, 100);
                  return;
                }

                if (this.latency_budget_ms && !this.budgetFired &&
                    conn.mode === flecs.ConnectionMode.Wasm) {
                  this.budgetTimer = setTimeout(() => {
                    this.budgetTimer = undefined;
                    this.budgetFired = true;
                    this.do(cache);
                  }, this.latency_budget_ms);
                  return;
                }

                let url;
                if (conn.mode == flecs.ConnectionMode.Remote) {
                  url = conn.params.host;
                  if (url.slice(0, 4) !== "http") {
                    url = "http://" + url;
                  }

                  let portIndex = url.indexOf(":"); // first is protocol
                  portIndex = url.indexOf(":", portIndex + 1);
                  if (portIndex == -1) {
                    url += ":27750";
                  }

                  url += "/" + this.url;
                } else {
                  url = "/" + this.url;
                }

                if (!cache) {
                  url += "&cache=false";
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
                  }
                };
  
                // Send it
                this.request.send(payload);

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
                this.aborted = true;
                this.status = flecs.RequestStatus.Aborting;
                if (this.budgetTimer) {
                  clearTimeout(this.budgetTimer);
                  this.budgetTimer = undefined;
                }
                if (this.timer) {
                  clearTimeout(this.timer);
                  this.timer = undefined;
                }
                if (this.request) {
                  this.request.abort();
                }
              },

              // Abort request
              abort(keepPersist = false) {
                if (this.aborted && !this.request && !this.timer &&
                    !this.budgetTimer)
                {
                  return;
                }

                const wasInBudget = !!this.budgetTimer;
                this.cancel();

                if (this.managed) {
                  if (!this.persist || !keepPersist) {
                    this.conn.managedRequests =
                      this.conn.managedRequests.filter(item => item.id !== this.id);
                  }
                }

                if (this.on_abort && !wasInBudget) {
                  this.on_abort(this);
                }

                this.request = undefined;
              },

              // Run request now
              now() {
                if (this.timer) {
                  clearTimeout(this.timer);
                  this.timer = undefined;
                }
                if (this.request) {
                  this.request.onreadystatechange = undefined;
                  this.request.abort();
                }
                this.do(false);
              },
  
              // Private methods
              _: {
                timer: undefined,

                // Do polling if request has poll interval
                poll(pub) {
                  if (pub.timer) {
                    clearTimeout(pub.timer);
                  }

                  if (pub.poll_interval_ms && !pub.aborted) {
                    if (pub.status == flecs.RequestStatus.Done) {
                      // If this is a polling request and valid data was received,
                      // the request is alive.
                      pub.status = flecs.RequestStatus.Alive;
                    }
  
                    pub.timer = setTimeout(() => {
                      this.retry_count = 0;
                      pub.redo();
                    }, pub.poll_interval_ms);
                  }
                },
  
                // Handle request error
                onError(pub) {
                  if (pub.aborted) {
                    pub.status = flecs.RequestStatus.Aborted;
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
            if (!params.managed || conn.status === flecs.ConnectionStatus.Connected) {
              // If request is managed (meaning that it will get automatically polled)
              // and we're not connected yet, don't do the request as it will be
              // automatically polled when the connection is established.
              // This prevents sending out duplicate requests.
              result.do();
            }
  
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

          patchTimestampWrites() {
            if (GPUCommandEncoder.prototype._flecsTimestampWrites) {
              return;
            }

            const queryIndexUndefined = 0xFFFFFFFF;
            for (const name of ["beginComputePass", "beginRenderPass"]) {
              const beginPass = GPUCommandEncoder.prototype[name];
              GPUCommandEncoder.prototype[name] = function(desc) {
                const writes = desc && desc.timestampWrites;
                if (writes) {
                  const fixed = { querySet: writes.querySet };
                  if (writes.beginningOfPassWriteIndex !== queryIndexUndefined) {
                    fixed.beginningOfPassWriteIndex = writes.beginningOfPassWriteIndex;
                  }
                  if (writes.endOfPassWriteIndex !== queryIndexUndefined) {
                    fixed.endOfPassWriteIndex = writes.endOfPassWriteIndex;
                  }
                  desc = Object.assign({}, desc, { timestampWrites: fixed });
                }
                return beginPass.call(this, desc);
              };
            }

            GPUCommandEncoder.prototype._flecsTimestampWrites = true;
          },

          wasmModuleArgs() {
            const canvas = document.getElementById("canvas");
            if (!canvas || !navigator.gpu) {
              return Promise.resolve({});
            }

            this.patchTimestampWrites();

            return navigator.gpu.requestAdapter({
              powerPreference: "high-performance"
            }).then(function(adapter) {
              if (!adapter) {
                return undefined;
              }

              const features = adapter.features.has("timestamp-query") ?
                ["timestamp-query"] : [];
              return adapter.requestDevice({
                requiredFeatures: features,
                requiredLimits: {
                  maxTextureArrayLayers: adapter.limits.maxTextureArrayLayers
                }
              });
            }).then(function(device) {
              if (!device) {
                return {};
              }

              return {
                canvas: canvas,
                preinitializedWebGPUDevice: device
              };
            }, function(err) {
              console.error("failed to initialize WebGPU", err);
              return {};
            });
          },

          wasmModuleLoaded(wasm_url) {
            const name = wasm_url.slice(wasm_url.lastIndexOf("/") + 1, wasm_url.lastIndexOf("."));
            const image_url = wasm_url.slice(0, wasm_url.lastIndexOf(".")) + ".wasm";
            wasm_module = Function(`return ` + name + `;`)();
            let args;
            let failed = false;
            let replied = false;
            const fail = (reason) => {
              failed = true;
              this.wasmImageFailed(image_url, reason);
            };
            return this.wasmModuleArgs().then((result) => {
              args = result;
              args.onAbort = fail;
              return wasm_module(args);
            }).then((Module) => {
              let nativeRequest = Module.cwrap('flecs_explorer_request', 'string', ['string', 'string', 'string']);
              const imageRequest = (method, url, body) => {
                if (failed) {
                  return JSON.stringify({ error: flecs.wasmImageError, status: 503 });
                }

                let reply;
                try {
                  reply = nativeRequest(method, url, body);
                  if (reply) {
                    JSON.parse(reply);
                    replied = true;
                  } else if (method === "GET") {
                    if (!replied) {
                      fail("image returned an empty reply");
                    }
                    return JSON.stringify({ error: "empty reply from wasm image", status: 500 });
                  }
                } catch (err) {
                  fail(err);
                  return JSON.stringify({ error: flecs.wasmImageError, status: 503 });
                }
                return reply;
              };
              if (Module._flecs_explorer_has_canvas && args.preinitializedWebGPUDevice) {
                flecs.has3DCanvas = true;
                flecs.captureKeyboardEvents = function(capture) {
                  if (capture) {
                    args.canvas.focus();
                  } else {
                    args.canvas.blur();
                  }
                };
              }

              return this.wasmRequestFactory(imageRequest);
            });
          },

          wasmRequestFactory(imageRequest) {
            return function() {
              return {
                  method: undefined,
                  url: undefined,
                  handler: undefined,
                  status: 200,
                  readyState: 4,
                  onreadystatechange: undefined,
                  _timer: undefined,
                  _aborted: false,

                  open(method, url) {
                    this.method = method;
                    this.url = url;
                  },

                  send(body) {
                    this._timer = setTimeout(() => {
                      this._timer = undefined;
                      if (this._aborted) {
                        return;
                      }

                      const reply = imageRequest(this.method, this.url, body);
                      this.responseText = reply;

                      if (reply) {
                        const replyObj = JSON.parse(reply);
                        if (replyObj.error) {
                          this.status = replyObj.status || 400;
                        }
                      }

                      if (this.onreadystatechange) {
                        this.onreadystatechange(reply);
                      }
                    }, 0);
                  },

                  abort() {
                    this._aborted = true;
                    if (this._timer) {
                      clearTimeout(this._timer);
                      this._timer = undefined;
                    }
                  }
              };
            };
          },

          wasmImageFailed(wasm_url, reason) {
            const detail = reason ? `: ${reason.message || reason}` : "";
            flecs.wasmImageError = `failed to run wasm image ${wasm_url}${detail}`;
            flecs.has3DCanvas = false;
            console.error(flecs.wasmImageError);
            delete flecs._.wasmModules[wasm_url];
          },

          revalidateWasmImage(wasm_url, js_url) {
            return Promise.all([js_url, wasm_url].map((url) => {
              return fetch(url, { cache: "no-cache" }).then((reply) => {
                return reply.arrayBuffer();
              }).catch((err) => {
                console.warn(`failed to revalidate ${url}`, err);
              });
            }));
          },

          loadWasmModule(wasm_url) {
            this.wasm_url = wasm_url;
            this.FlecsHttpRequest = undefined;
            flecs.wasmImageError = undefined;

            let module = flecs._.wasmModules[wasm_url];
            if (!module) {
              let js_url = wasm_url.slice(0, wasm_url.length - 5) + ".js";
              const oldEl = document.getElementById("wasm-module");
              if (oldEl) {
                oldEl.remove();
              }

              module = new Promise((resolve, reject) => {
                const scriptEl = document.createElement("script");
                scriptEl.id = "wasm-module";
                scriptEl.onload = () => {
                  this.wasmModuleLoaded(js_url).then(resolve, reject);
                };
                scriptEl.onerror = () => {
                  reject(new Error(`failed to load ${js_url}`));
                };

                this.revalidateWasmImage(wasm_url, js_url).then(() => {
                  scriptEl.src = js_url;
                  document.head.appendChild(scriptEl);
                });
              });

              flecs._.wasmModules[wasm_url] = module;
            }

            module.then((factory) => {
              if (this.wasm_url === wasm_url) {
                this.FlecsHttpRequest = factory;
              }
            }, (err) => {
              this.wasmImageFailed(wasm_url, err);
              if (this.wasm_url === wasm_url) {
                this.FlecsHttpRequest = this.wasmRequestFactory(() => {
                  return JSON.stringify({ error: flecs.wasmImageError, status: 503 });
                });
              }
            });
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
          if (k === "poll_interval_ms" || k === "host" || k === "managed" || k === "persist" || k === "latency_budget_ms") {
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
