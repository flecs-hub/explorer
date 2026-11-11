import { mount } from '@vue/test-utils';
import Modal from '../../etc/js/components/widgets/modal.vue';

function overlay() {
  return document.body.querySelector('div.modal-overlay');
}

describe('modal', () => {
  test('clicking the backdrop cancels', () => {
    const wrapper = mount(Modal, { props: { title: 'Test' } });

    overlay().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay().dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(wrapper.emitted('cancel')).toHaveLength(1);
    wrapper.unmount();
  });

  test('press inside and release on the backdrop does not cancel', () => {
    const wrapper = mount(Modal, { props: { title: 'Test' } });

    document.body.querySelector('div.modal-body').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay().dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(wrapper.emitted('cancel')).toBeUndefined();
    wrapper.unmount();
  });
});
