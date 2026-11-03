import { mount, flushPromises } from '@vue/test-utils';
import fs from 'fs';
import path from 'path';
import EntitiesOverview from '../../etc/js/components/pages/entities/entities-overview.vue';

const commonSrc = fs.readFileSync(
  path.join(__dirname, '../../etc/js/common.js'), 'utf8');

const stubs = { icon: true, dropdown: true, histogram: true };

async function mountWithMemory(memory) {
  const conn = {
    entity: jest.fn((path, params, onReply) => {
      onReply({ components: { 'flecs.stats.WorldMemory': memory } });
      return { abort: jest.fn() };
    }),
    action: jest.fn()
  };
  const wrapper = mount(EntitiesOverview, {
    props: {
      conn,
      app_state: { status: flecs.ConnectionStatus.Connected, heartbeat: undefined }
    },
    global: { stubs }
  });
  await flushPromises();
  return wrapper;
}

describe('entities overview memory panel', () => {
  beforeEach(() => {
    globalThis.explorer = new Function(commonSrc + '\nreturn explorer;')();
    globalThis.flecs = { ConnectionStatus: { Connected: 'connected' } };
    globalThis.Chart = jest.fn(() => ({
      destroy: jest.fn(),
      update: jest.fn(),
      data: { datasets: [{ data: [] }] }
    }));
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({}));
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    delete globalThis.explorer;
    delete globalThis.flecs;
    delete globalThis.Chart;
    jest.restoreAllMocks();
  });

  test('byte counts that wrapped around int32 show their unsigned value', async () => {
    const wrapper = await mountWithMemory({
      components: { instances: 3000799, bytes_table_components: -1222943224, bytes_toggle_bitsets: 0 },
      misc: { bytes_world: 1000 }
    });

    const text = wrapper.text();
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('undefined');
    expect(wrapper.find('.total-value').text()).toBe('3.07 GB');
    expect(text).toContain('3.07 GB');
    wrapper.unmount();
  });

  test('non numeric byte counts show n/a', async () => {
    const wrapper = await mountWithMemory({
      components: { instances: 1, bytes_table_components: null, bytes_toggle_bitsets: undefined },
      misc: { bytes_world: 1000 }
    });

    const text = wrapper.text();
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('undefined');
    expect(wrapper.find('.total-value').text()).toBe('n/a');
    wrapper.unmount();
  });

  test('valid byte counts are unchanged', async () => {
    const wrapper = await mountWithMemory({
      components: { instances: 12, bytes_table_components: 2500, bytes_toggle_bitsets: 0 },
      misc: { bytes_world: 500 }
    });

    const text = wrapper.text();
    expect(wrapper.find('.total-value').text()).toBe('3 KB');
    expect(text).toContain('2.5 KB');
    expect(text).toContain('0 B');
    expect(text).toContain('500 B');
    wrapper.unmount();
  });
});
