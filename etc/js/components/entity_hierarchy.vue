<template>
  <div class="entity-hierarchy">
    <template v-if="entities.length >= 1">
      <template v-for="(entity, index) in entities">
        <span class="entity-hierarchy-node" :key="index">

          <span v-html="parse_for_overflow(entity)" :title="entity.length > 25 ? entity : ''">
          </span>

          <template v-if="index != entities.length - 1">
            <icon icon="feather:chevron-right" :size="12" />
          </template>

        </span>
      </template>
    </template>
  </div>
</template>

<script>
/*
  V1: use for only compact situation in query results table
  Does not update yet on prop change.

  Await V2.
*/
module.exports = {
  name: "entity-hierarchy",
  props: {
    entity_path: { type: String, required: true },
  },
  data() {
    return {
      entities: undefined,
    }
  },
  watch: {
    entity_path() {
      this.parse();
    }
  },
  methods: {
    parse_for_overflow(text) {
      if (text.length <= 25) {
        return text;
      } else {
        return text.slice(0,25) + "…";
      }
    },
    parse() {
      let entities = this.entity_path.split(".").slice(0, -1);
      this.entities = entities;
    }
  },
  created() {
    this.parse();
  },
}
</script>

<style scoped>

div.entity-hierarchy,
div.entity-hierarchy-node {
  display: flex;
  flex-direction: row;
  align-items: center;

  font-size: var(--text-fs-sm);
  line-height: var(--text-lh-sm);

  padding-bottom: var(--p-0);
}

div.entity-hierarchy span {
  color: var(--tertiary-text);
}

</style>