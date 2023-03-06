let wq_init;
let wq_request_get;
let wq_request_put;
let wq_run;

flecs_explorer = flecs_explorer().then(function(Module) {
  wq_init = Module.cwrap('init');
  wq_request_get = Module.cwrap('get_request', 'string', ['string']);
  wq_request_put = Module.cwrap('put_request', 'string', ['string']);
  wq_run = Module.cwrap('run', 'string', ['string']);
  wq_init();
});
