<template>
  <div class="commands-cmd-hdr">
    <span class="commands-cmd-hdr-icon"></span>
    <span class="commands-cmd-hdr-kind">kind</span> 
    <span class="commands-cmd-hdr-entity">entity</span>
    <span class="commands-cmd-hdr-id">component</span>
  </div>
</template>

<script>
export default { name: "commands-inspect-cmd-header" };
</script>

<script setup>
</script>

<style scoped>

div.commands-cmd-hdr {
  display: grid;
  grid-template-columns: 2.0rem 300px 300px 1fr;
  padding: 0.5rem;
}

div.commands-cmd-hdr span {
  font-weight: bold;
  text-transform: uppercase;
  color: var(--secondary-text);
}

span.commands-cmd-kind {
  grid-column: 1;
}

span.commands-cmd-kind {
  grid-column: 2;
}

span.commands-cmd-entity {
  grid-column: 3;
}

span.commands-cmd-id {
  grid-column: 4;
}

</style>
