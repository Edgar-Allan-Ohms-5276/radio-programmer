<template>
  <div class="input-effect">
    <input
      type="text"
      placeholder=""
      v-model="value"
      v-on:input="$emit('input', $event.target.value)"
      v-on:keypress="$emit('keypress', $event)"
      :class="{ 'has-content': value != '', 'text-input': true }"
    />
    <label>{{ label }}</label>
    <span class="focus-border">
      <i></i>
    </span>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import "./Input.scss";

const InputProps = Vue.extend({
  props: {
    label: String,
  },
});

@Component
export default class Input extends InputProps {
  value = "";
}
</script>

