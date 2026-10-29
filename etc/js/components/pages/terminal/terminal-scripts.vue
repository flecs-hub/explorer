<template>
  <div class="term-scripts">
    <div class="term-dim" v-if="!scripts.length">no scripts</div>
    <table class="term-table" v-else>
      <thead>
        <tr>
          <th>script</th>
          <th>lines</th>
          <th>file</th>
          <th>status</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(s, i) in scripts" :key="i">
          <tr>
            <td><terminal-entity :path="s.script" :scope="scope"></terminal-entity></td>
            <td class="term-number">{{ s.lines }}</td>
            <td><span v-if="s.filename" class="term-string">{{ s.filename }}</span><span v-else class="term-dim">&ndash;</span></td>
            <td>
              <span class="term-error" v-if="s.error">&#x2716; error</span>
              <span class="term-warning" v-else-if="s.unsaved">&#x25CF; unsaved</span>
              <span class="term-ok" v-else>&#x2714; ok</span>
            </td>
          </tr>
          <tr v-if="s.error">
            <td colspan="4" class="term-scripts-error">{{ s.error }}</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script>
export default { name: "terminal-scripts" };
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  scripts: { type: Array, required: true },
  scope: { type: String, required: false }
});
</script>

<style>
#terminal-pane td.term-scripts-error {
  color: var(--term-error);
  white-space: pre-wrap;
  padding-left: 2ch;
}
</style>
