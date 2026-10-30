const fs = require('fs');
const path = require('path');

const flecsSrc = fs.readFileSync(
  path.join(__dirname, '../../etc/flecs.js'), 'utf8');

const flecs = new Function('process', flecsSrc + '\nreturn flecs;')(undefined);

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

async function createWasmConnection(reply) {
  globalThis.fake_wasm_module = () => Promise.resolve({
    cwrap: () => () => reply
  });
  const conn = flecs._.createConnection({});
  conn._.FlecsHttpRequest = await conn._.wasmModuleLoaded('fake_wasm_module.js');
  conn.mode = flecs.ConnectionMode.Wasm;
  conn.status = flecs.ConnectionStatus.Connected;
  return conn;
}

describe('flecs.js wasm requests', () => {
  afterEach(() => {
    delete globalThis.fake_wasm_module;
    delete flecs.wasmImageError;
    flecs._.wasmModules = {};
    jest.restoreAllMocks();
  });

  test('image that throws stops being called and reports an error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const native = jest.fn(() => { throw new Error('unreachable'); });
    globalThis.fake_wasm_module = () => Promise.resolve({ cwrap: () => native });
    const conn = flecs._.createConnection({});
    conn._.FlecsHttpRequest = await conn._.wasmModuleLoaded('fake_wasm_module.js');
    conn.mode = flecs.ConnectionMode.Wasm;
    conn.status = flecs.ConnectionStatus.Connected;
    const recv = jest.fn();
    const err = jest.fn();

    conn.commandSessionHistory(0, {}, recv, err);
    await flush();
    conn.commandSessionHistory(0, {}, recv, err);
    await flush();

    expect(native).toHaveBeenCalledTimes(1);
    expect(recv).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalledTimes(2);
    expect(flecs.wasmImageError).toContain('unreachable');
  });

  test('abort callback from image marks it as failed', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    let moduleArgs;
    globalThis.fake_wasm_module = (args) => {
      moduleArgs = args;
      return Promise.resolve({ cwrap: () => () => '{}' });
    };
    const conn = flecs._.createConnection({});
    flecs._.wasmModules['fake_wasm_module.wasm'] = Promise.resolve();
    await conn._.wasmModuleLoaded('fake_wasm_module.js');

    moduleArgs.onAbort('LinkError');

    expect(flecs.wasmImageError).toContain('LinkError');
    expect(flecs._.wasmModules['fake_wasm_module.wasm']).toBeUndefined();
  });

  test('empty first reply from image marks it as failed', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const conn = await createWasmConnection('');
    const recv = jest.fn();
    const err = jest.fn();

    conn.commandSessionHistory(0, {}, recv, err);
    await flush();

    expect(recv).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalled();
    expect(flecs.wasmImageError).toContain('empty reply');
  });

  test('error reply without status invokes error callback', async () => {
    const conn = await createWasmConnection('{"error": "invalid command session"}');
    const recv = jest.fn();
    const err = jest.fn();

    conn.commandSessionHistory(0, {}, recv, err);
    await flush();

    expect(recv).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalledWith({ error: 'invalid command session' });
  });

  test('error reply with status invokes error callback', async () => {
    const conn = await createWasmConnection('{"error": "bad request", "status": 404}');
    const recv = jest.fn();
    const err = jest.fn();

    conn.commandSessionHistory(0, {}, recv, err);
    await flush();

    expect(recv).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalledWith({ error: 'bad request', status: 404 });
  });

  test('successful reply invokes receive callback', async () => {
    const conn = await createWasmConnection('{"session": 5}');
    const recv = jest.fn();
    const err = jest.fn();

    conn.commandSessionCreate(recv, err);
    await flush();

    expect(err).not.toHaveBeenCalled();
    expect(recv).toHaveBeenCalledWith({ session: 5 });
  });
});
