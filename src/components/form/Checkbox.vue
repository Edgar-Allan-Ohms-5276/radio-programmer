<template>
  <div class="checkbox-effect">
    <label class="checkbox-label"
      >{{ label }}
      <input
        type="checkbox"
        checked="checked"
        v-model="value"
        v-on:change="$emit('input', $event.target.checked)"
      />
      <span class="checkmark"></span>
    </label>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import "./Checkbox.scss";

const CheckboxProps = Vue.extend({
  props: {
    label: String,
    default: Boolean
  },
});

@Component
export default class Checkbox extends CheckboxProps {
  value = this.default || false;
}
</script>

