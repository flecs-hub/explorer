<template>
  <detail-toggle>
    <template v-slot:summary>
      <span class="stat-name">{{name_fmt}}</stat>
    </template>
    <template v-slot:detail>
      <stat-chart :values="values"></stat-chart>
    </template>
  </detail-toggle>
</template>

<script>
  module.exports = {
    name: "stat",
    props: {
      name: String,
      values: Object
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

span.stat-name {
  margin-top: 5px;
}

</style>
