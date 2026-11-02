import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import FlecsScript from '../../etc/js/components/widgets/flecs-script.vue';

describe('flecs-script', () => {
  test('shows the error when the script update request fails', async () => {
    let onChange;
    let value = '';
    const editor = {
      setOption: () => {},
      setBehavioursEnabled: () => {},
      setTheme: () => {},
      session: {
        setMode: () => {},
        on: (_, cb) => { onChange = cb; },
        addMarker: () => 1,
        removeMarker: () => {}
      },
      commands: { addCommand: () => {} },
      setValue: (v) => { value = v; },
      getValue: () => value,
      clearSelection: () => {},
      gotoLine: () => {},
      focus: () => {}
    };
    globalThis.ace = {
      edit: () => editor,
      require: () => ({ Range: class {} })
    };
    globalThis.explorer = { EDITOR_LATENCY_BUDGET_MS: 0 };
    const conn = {
      get: (path, params, recv) => { recv({ code: '' }); return {}; },
      scriptUpdate: (path, code, params, recv, err) => {
        err({ error: '1: unexpected end of script\nFoo {\n    ^' });
        return { abort: () => {} };
      }
    };

    const wrapper = mount(FlecsScript, { props: { conn, script: 'my_script' } });
    value = 'Foo {';
    onChange();
    await nextTick();

    expect(wrapper.find('pre.editor-error').text()).toBe('error: 1: unexpected end of script');
    delete globalThis.ace;
    delete globalThis.explorer;
  });
});
