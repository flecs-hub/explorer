<template>
  <div class="stat">
    <div class="stat-name">
      <span>{{name_fmt}}</span>
    </div>
    <div class="stat-content">
      <stat-chart 
        :values="values"
        :width="440"
        :width_scale="true" 
        :width_margin="10 + 5 + 2"
        :disabled="!valid">
      </stat-chart>
    </div>
    <div class="stat-brief" v-if="values.brief">
      <span>{{values.brief}}</span>
    </div>
  </div>
</template>

<script>
  module.exports = {
    name: "stat",
    props: {
      name: String,
      values: Object,
      valid: Boolean
    },
    computed: {
      name_fmt() {
        let str = this.name.replaceAll("_", " ");
        str = str.charAt(0).toUpperCase() + str.slice(1);
        return str;
      }
    }
  }
</script>

<style>

div.stat {
  display: flex;
  align-items: center;
  flex-direction: column;
  background-color: var(--panel-bg-secondary);
  border-color: var(--steel-700);
  border-width: 1px;
  border-style: solid;
  margin: 10px;
  margin-right: 0px;
  margin-bottom: 0px;
  padding-top: 10px;
  padding-bottom: 5px;
  padding-left: 10px;
  padding-right: 10px;
}

div.stat-content {
}

div.stat-name {
  font-weight: bold;
  color: var(--secondary-text);
}

div.stat-brief {
  color: var(--secondary-text);
  font-size: 13px;
}

</style>
