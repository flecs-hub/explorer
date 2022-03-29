
Vue.component('entity-reference', {
    props: ['entity', 'label', 'show_name', 'click_name', 'show_parent', 'disabled', 'text'],
    methods: {
      clicked: function() {
        this.$emit('select-entity', this.entity);
      }
    },
    computed: {
      entity_name: function() {
        if (this.show_name) {
          if (this.label) {
            return this.label;
          } else {
            return this.entity.split('.').pop();
          }
        } else {
          return this.entity;
        }
      },
      has_parent: function() {
        if (!this.show_parent) {
          return false;
        } else {
          return this.entity.lastIndexOf(".") != -1;
        }
      },
      show_icon: function() {
        if (!this.disabled) {
          if (!this.click_name) {
            return true;
          }
        }
        return false;
      }
    },
    template: `
      <span class="entity-reference">
        <span v-if="!disabled && !click_name">
          <template v-if="text && text.length">{{text}}&nbsp;</template><span>{{entity_name}}</span><template v-if="has_parent">&nbsp;-&nbsp;<entity-parent :entity="entity"/></template>
          <icon-button :size="14" icon="feather:arrow-up-right" v-on:click.stop="clicked" v-if="show_icon" v-tooltip="'Inspect entity'"
          />
        </span>
        <span class="entity-reference-clickable-name" v-else-if="!disabled && click_name" v-on:click.stop="clicked">
          <template v-if="text && text.length">{{text}}&nbsp;</template><span>{{entity_name}}</span><template v-if="has_parent">&nbsp;-&nbsp;<entity-parent :entity="entity"/></template>
        </span>
        <span v-else>
          <template v-if="text && text.length">{{text}}&nbsp;</template><span>{{entity_name}}</span><template v-if="has_parent">&nbsp;-&nbsp;<entity-parent :entity="entity"/></template>
        </span>
      </span>
      `
  });
