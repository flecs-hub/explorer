Vue.component('entity-hierarchy', {
  functional: true,
  props: {
    entity_path: { type: String, required: true },
    is_path: { type: Boolean, required: false, default: false }
  },
  render: function (createElement, context) {
    let entities;
    if (!context.props.is_path) {
      entities = context.props.entity_path.split(".").slice(0, -1);
    } else {
      entities = context.props.entity_path.split(".");
    }

    return createElement(
      'div', 
      { class: ["entity-hierarchy"] },
      entities.map(
        (entity, index) => {
          if (index != entities.length - 1) {
            return createElement(
              'span',
              { class: ["entity-hierarchy-node"] },
              [
                createElement(
                  'span',
                  entity
                ),
                createElement(
                  'icon',
                  {
                    props: {
                      icon: 'feather:chevron-right',
                      size: 12,
                      opacity: 0.4
                    }
                  }
                )
              ]
            )
          } else {
            // So as to not render a chevron icon at the end
            return createElement(
              'span',
              { class: ["entity-hierarchy-node"] },
              [
                createElement(
                  'span',
                  entity
                )
              ]
            )
          }
        }
      )
    );
  }
})