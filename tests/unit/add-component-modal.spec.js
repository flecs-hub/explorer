import { mount } from '@vue/test-utils';
import AddComponentModal from '../../etc/js/components/widgets/inspector/entity-inspector-add-component-modal.vue';

const modalStub = {
  props: ['okDisabled'],
  emits: ['ok', 'cancel'],
  template: '<div><div class="stub-header"><slot name="header"></slot></div><slot></slot><div class="stub-footer"><slot name="footer"></slot></div></div>'
};

const iconStub = { template: '<span></span>' };

function browserStub(match) {
  return {
    props: ['expr', 'first'],
    emits: ['select', 'highlight'],
    template: '<div></div>',
    mounted() {
      this.$emit('highlight', match(this.expr));
    },
    watch: {
      expr() {
        this.$emit('highlight', match(this.expr));
      }
    },
    methods: { moveUp: jest.fn(), moveDown: jest.fn() }
  };
}

const matchAll = (expr) => expr ? { parent: 'app', name: expr } : { parent: 'app', name: 'Position' };
const matchNone = () => undefined;

function connStub(relationships = []) {
  return {
    query: jest.fn((q, opts, recv) => {
      const isRel = relationships.some(r => q === `?flecs.core.Relationship(${r})`);
      recv({ results: [{ fields: { is_set: [isRel] } }] });
    })
  };
}

function mountModal(browser, props = {}) {
  return mount(AddComponentModal, {
    props: { conn: connStub(), ...props },
    global: { stubs: { modal: modalStub, icon: iconStub, 'prop-browser': browser } }
  });
}

async function switchToPair(wrapper) {
  await wrapper.findAll('button.add-mode-option')[1].trigger('click');
}

function pressEnter() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
}

describe('add component modal', () => {
  test('header shows a mode switch instead of a duplicate title', () => {
    const wrapper = mountModal(browserStub(matchNone));

    expect(wrapper.find('.add-header-title').text()).toBe('Add');
    expect(wrapper.findAll('button.add-mode-option').map(b => b.text())).toEqual(['Component', 'Pair']);
    wrapper.unmount();
  });

  test('OK adds the highlighted component', async () => {
    const wrapper = mountModal(browserStub(matchAll));
    await wrapper.find('input').setValue('Pos');

    await wrapper.findComponent(modalStub).vm.$emit('ok');

    expect(wrapper.emitted('submit')).toEqual([['app.Pos']]);
    wrapper.unmount();
  });

  test('OK adds a typed pair expression as is', async () => {
    const wrapper = mountModal(browserStub(matchAll));
    await wrapper.find('input').setValue('(IsA, my_prefab)');

    await wrapper.findComponent(modalStub).vm.$emit('ok');

    expect(wrapper.emitted('submit')).toEqual([['(IsA, my_prefab)']]);
    wrapper.unmount();
  });

  test('Enter adds typed text when the list has no match', async () => {
    const wrapper = mountModal(browserStub(matchNone));
    await wrapper.find('input').setValue('Foo');

    pressEnter();

    expect(wrapper.emitted('submit')).toEqual([['Foo']]);
    expect(wrapper.text()).toContain('No matches');
    wrapper.unmount();
  });

  test('clicking a component highlights it, double clicking adds it', async () => {
    const browser = browserStub(matchAll);
    const wrapper = mountModal(browser);
    const list = wrapper.findComponent(browser);

    await list.vm.$emit('select', { value: { parent: 'app', name: 'Velocity' }, kind: 'click', detail: 1 });
    expect(wrapper.emitted('submit')).toBeUndefined();

    await list.vm.$emit('select', { value: { parent: 'app', name: 'Velocity' }, kind: 'dblclick' });
    expect(wrapper.emitted('submit')).toEqual([['app.Velocity']]);
    wrapper.unmount();
  });

  test('pair mode adds typed relationship and target on OK', async () => {
    const wrapper = mountModal(browserStub(matchNone));
    await switchToPair(wrapper);
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('IsA');
    await inputs[1].setValue('my_prefab');

    expect(wrapper.find('code.add-preview').text()).toBe('(IsA, my_prefab)');
    await wrapper.findComponent(modalStub).vm.$emit('ok');

    expect(wrapper.emitted('submit')).toEqual([['(IsA, my_prefab)']]);
    wrapper.unmount();
  });

  test('pair mode disables OK without a target', async () => {
    const wrapper = mountModal(browserStub(matchNone));
    await switchToPair(wrapper);
    await wrapper.findAll('input')[0].setValue('IsA');

    expect(wrapper.findComponent(modalStub).props('okDisabled')).toBe(true);
    await wrapper.findComponent(modalStub).vm.$emit('ok');

    expect(wrapper.emitted('submit')).toBeUndefined();
    wrapper.unmount();
  });

  test('pair mode Enter picks relationship then target from the list', async () => {
    const browser = browserStub(matchAll);
    const wrapper = mountModal(browser);
    await switchToPair(wrapper);

    await wrapper.findAll('input')[0].setValue('Likes');
    pressEnter();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.findAll('input')[0].element.value).toBe('app.Likes');
    expect(wrapper.findComponent(browser).props('first')).toBe('app.Likes');

    await wrapper.findAll('input')[1].setValue('Bob');
    pressEnter();

    expect(wrapper.emitted('submit')).toEqual([['(app.Likes, app.Bob)']]);
    wrapper.unmount();
  });

  test('pair mode click fills the field without adding', async () => {
    const browser = browserStub(matchAll);
    const wrapper = mountModal(browser);
    await switchToPair(wrapper);
    const list = wrapper.findComponent(browser);

    await list.vm.$emit('select', { value: { parent: 'app', name: 'Likes' }, kind: 'click', detail: 1 });
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('input')[0].element.value).toBe('app.Likes');
    expect(list.props('first')).toBe('app.Likes');

    await list.vm.$emit('select', { value: { parent: 'app', name: 'Bob' }, kind: 'click', detail: 2 });
    await list.vm.$emit('select', { value: { parent: 'app', name: 'Bob' }, kind: 'dblclick' });
    expect(wrapper.findAll('input')[1].element.value).toBe('');

    await list.vm.$emit('select', { value: { parent: 'app', name: 'Bob' }, kind: 'click', detail: 1 });
    expect(wrapper.findAll('input')[1].element.value).toBe('app.Bob');
    expect(wrapper.emitted('submit')).toBeUndefined();
    wrapper.unmount();
  });

  test('shows the error', () => {
    const wrapper = mountModal(browserStub(matchNone), { error: "unresolved component '(IsA, foo)'" });

    expect(wrapper.text()).toContain("unresolved component '(IsA, foo)'");
    wrapper.unmount();
  });

  test('adding a relationship as component switches to pair mode', async () => {
    const wrapper = mountModal(browserStub(matchAll), { conn: connStub(['app.Likes']) });
    await wrapper.find('input').setValue('Likes');

    expect(wrapper.findComponent(modalStub).attributes('ok-label')).toBe('Next');
    expect(wrapper.find('code.add-preview').text()).toBe('(app.Likes, target)');

    pressEnter();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('submit')).toBeUndefined();
    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(2);
    expect(inputs[0].element.value).toBe('app.Likes');
    expect(inputs[1].element.value).toBe('');
    wrapper.unmount();
  });

  test('double clicking a relationship switches to pair mode', async () => {
    const browser = browserStub(matchAll);
    const wrapper = mountModal(browser, { conn: connStub(['app.Likes']) });
    await wrapper.find('input').setValue('Likes');

    await wrapper.findComponent(browser).vm.$emit('select', { value: { parent: 'app', name: 'Likes' }, kind: 'dblclick' });

    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.findAll('input')[0].element.value).toBe('app.Likes');
    wrapper.unmount();
  });

  test('error is hidden after editing the input', async () => {
    const wrapper = mountModal(browserStub(matchNone), { error: "unresolved component 'Foo'" });
    expect(wrapper.text()).toContain("unresolved component 'Foo'");

    await wrapper.find('input').setValue('Bar');

    expect(wrapper.text()).not.toContain("unresolved component 'Foo'");
    wrapper.unmount();
  });
});
