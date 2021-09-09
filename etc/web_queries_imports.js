let wq_init;
let wq_query;

Module['onRuntimeInitialized'] = function() {
  wq_init = Module.cwrap('init');
  wq_query = Module.cwrap('query', 'string', ['string'])
  wq_get_entity = Module.cwrap('get_entity', 'string', ['string'])
  wq_run = Module.cwrap('run', 'string', ['string'])
  wq_init();

  app.ready();
}
