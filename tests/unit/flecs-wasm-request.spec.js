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
