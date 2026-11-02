import { mount } from '@vue/test-utils';
import AddComponentModal from '../../etc/js/components/widgets/inspector/entity-inspector-add-component-modal.vue';

const stubs = {
  modal: { template: '<div><slot></slot></div>', emits: ['ok', 'cancel'] },
  'search-box': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<input />'
  }
};

function browserStub(selectResult) {
  return {
    template: '<div></div>',
    methods: { select: jest.fn(() => selectResult), moveUp: jest.fn(), moveDown: jest.fn() }
  };
}

describe('add component modal', () => {
  test('OK submits a pair expression without selecting from the list', async () => {
    const browser = browserStub(true);
    const wrapper = mount(AddComponentModal, {
      props: { conn: {} },
      global: { stubs: { ...stubs, 'prop-browser': browser } }
    });
    await wrapper.findComponent(stubs['search-box']).vm.$emit('update:modelValue', '(IsA, my_prefab)');

    await wrapper.findComponent(stubs.modal).vm.$emit('ok');

    expect(browser.methods.select).not.toHaveBeenCalled();
    expect(wrapper.emitted('submit')).toEqual([['(IsA, my_prefab)']]);
    wrapper.unmount();
  });

  test('OK submits typed text when the list has no match', async () => {
    const wrapper = mount(AddComponentModal, {
      props: { conn: {} },
      global: { stubs: { ...stubs, 'prop-browser': browserStub(false) } }
    });
    await wrapper.findComponent(stubs['search-box']).vm.$emit('update:modelValue', 'Foo');

    await wrapper.findComponent(stubs.modal).vm.$emit('ok');

    expect(wrapper.emitted('submit')).toEqual([['Foo']]);
    wrapper.unmount();
  });

  test('OK selects from the list when it has a match', async () => {
    const browser = browserStub(true);
    const wrapper = mount(AddComponentModal, {
      props: { conn: {} },
      global: { stubs: { ...stubs, 'prop-browser': browser } }
    });
    await wrapper.findComponent(stubs['search-box']).vm.$emit('update:modelValue', 'Pos');

    await wrapper.findComponent(stubs.modal).vm.$emit('ok');

    expect(browser.methods.select).toHaveBeenCalledWith('ok');
    expect(wrapper.emitted('submit')).toBeUndefined();
    wrapper.unmount();
  });

  test('Enter submits a pair expression', async () => {
    const wrapper = mount(AddComponentModal, {
      props: { conn: {} },
      global: { stubs: { ...stubs, 'prop-browser': browserStub(false) } }
    });
    await wrapper.findComponent(stubs['search-box']).vm.$emit('update:modelValue', '(IsA, my_prefab)');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(wrapper.emitted('submit')).toEqual([['(IsA, my_prefab)']]);
    wrapper.unmount();
  });

  test('shows the error', () => {
    const wrapper = mount(AddComponentModal, {
      props: { conn: {}, error: "unresolved component '(IsA, foo)'" },
      global: { stubs: { ...stubs, 'prop-browser': browserStub(false) } }
    });

    expect(wrapper.text()).toContain("unresolved component '(IsA, foo)'");
    wrapper.unmount();
  });
});
