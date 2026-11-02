const fs = require('fs');
const path = require('path');
const { mount, flushPromises } = require('@vue/test-utils');
const TerminalImage = require('../../etc/js/components/pages/terminal/terminal-image.vue').default;

const flecsSrc = fs.readFileSync(path.join(__dirname, '../../etc/flecs.js'), 'utf8');
const flecs = new Function('process', flecsSrc + '\nreturn flecs;')(undefined);

const resource = { name: '1', content_type: 'image/png' };
const url = 'http://localhost:27750/shell/session/5/resource/1';

function reply(size, status = 200) {
  return { ok: status < 300, status, blob: () => Promise.resolve({ size }) };
}

describe('terminal-image', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:image');
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.fetch;
  });

  test('shows the image of a resource', async () => {
    global.fetch.mockResolvedValue(reply(10));
    const wrapper = mount(TerminalImage, { props: { resource, url } });
    await flushPromises();

    expect(global.fetch).toHaveBeenCalledWith(url, { cache: 'no-store' });
    expect(wrapper.find('img').attributes('src')).toBe('blob:image');
  });

  test('retries until the image is written', async () => {
    global.fetch.mockResolvedValueOnce(reply(0)).mockResolvedValueOnce(reply(10));
    const wrapper = mount(TerminalImage, { props: { resource, url } });
    await flushPromises();
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.text()).toContain('loading image');

    await jest.advanceTimersByTimeAsync(250);
    await flushPromises();
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(wrapper.find('img').exists()).toBe(true);
  });

  test('retries after a failed request', async () => {
    global.fetch.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(reply(10));
    const wrapper = mount(TerminalImage, { props: { resource, url } });
    await flushPromises();

    await jest.advanceTimersByTimeAsync(250);
    await flushPromises();
    expect(wrapper.find('img').exists()).toBe(true);
  });

  test('stops when the resource does not exist', async () => {
    global.fetch.mockResolvedValue(reply(0, 404));
    const wrapper = mount(TerminalImage, { props: { resource, url } });
    await flushPromises();

    await jest.advanceTimersByTimeAsync(1000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('no longer available');
  });

  test('times out and can be retried', async () => {
    global.fetch.mockResolvedValue(reply(0));
    const wrapper = mount(TerminalImage, { props: { resource, url } });
    await flushPromises();

    await jest.advanceTimersByTimeAsync(31000);
    await flushPromises();
    expect(wrapper.text()).toContain('timed out');
    const count = global.fetch.mock.calls.length;

    global.fetch.mockResolvedValue(reply(10));
    await wrapper.find('.term-more').trigger('click');
    await flushPromises();
    expect(global.fetch).toHaveBeenCalledTimes(count + 1);
    expect(wrapper.find('img').exists()).toBe(true);
  });

  test('stops loading and releases the image when unmounted', async () => {
    global.fetch.mockResolvedValueOnce(reply(0));
    const pending = mount(TerminalImage, { props: { resource, url } });
    await flushPromises();
    pending.unmount();
    await jest.advanceTimersByTimeAsync(1000);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    global.fetch.mockResolvedValueOnce(reply(10));
    const loaded = mount(TerminalImage, { props: { resource, url } });
    await flushPromises();
    loaded.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:image');
  });

  test('reports images that cannot be decoded', async () => {
    global.fetch.mockResolvedValue(reply(10));
    const wrapper = mount(TerminalImage, { props: { resource, url } });
    await flushPromises();

    await wrapper.find('img').trigger('error');
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.text()).toContain('could not be decoded');
  });

  test('does not request anything without a url', async () => {
    const wrapper = mount(TerminalImage, { props: { resource } });
    await flushPromises();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('running application');
  });
});

describe('commandResourceUrl', () => {
  test('points at the resource endpoint of the session on a remote connection', () => {
    const conn = flecs._.createConnection({});
    conn.mode = flecs.ConnectionMode.Remote;
    conn.url = 'http://localhost:27750';
    expect(conn.commandResourceUrl('4294967904', 'a b')).toBe(
      'http://localhost:27750/shell/session/4294967904/resource/a%20b');
  });

  test('is undefined for a wasm connection', () => {
    const conn = flecs._.createConnection({});
    conn.mode = flecs.ConnectionMode.Wasm;
    expect(conn.commandResourceUrl('1', '1')).toBeUndefined();
  });
});
