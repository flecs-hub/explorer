Vue.component('entity-hierarchy', {
  functional: true,
  props: {
    entity_path: { type: String, required: true },
  },
  render: function (createElement, context) {
    let entities = context.props.entity_path.split(".").slice(0, -1);

    return createElement(
      'div', 
      { 
        class: ["entity-hierarchy"],
      }, 
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