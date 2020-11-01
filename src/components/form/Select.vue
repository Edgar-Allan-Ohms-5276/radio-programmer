<template>
  <div class="select-effect">
    <select
      class="select"
      v-model="value"
      v-on:input="$emit('input', $event.target.value)"
    >
      <slot />
    </select>
    <label>{{ label }}</label>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import "./Select.scss";

const SelectProps = Vue.extend({
  props: {
    label: String,
    default: String,
  },
});

@Component
export default class Select extends SelectProps {
  value = this.default;
}
</script>

