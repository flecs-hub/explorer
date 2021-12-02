let wq_init;
let wq_query;
let wq_get_entity;
let wq_run;
let wq_encode;
let wq_decode;

web_queries = web_queries().then(function(Module) {
  wq_init = Module.cwrap('init');
  wq_query = Module.cwrap('query', 'string', ['string']);
  wq_get_entity = Module.cwrap('get_entity', 'string', ['string']);
  wq_run = Module.cwrap('run', 'string', ['string']);
  wq_encode = Module.cwrap('encode', 'string', ['string']);
  wq_decode = Module.cwrap('decode', 'string', ['string']);
  wq_init();
});
