<template>
  <div>
    <label :for="id">{{ label }}</label>
    <input
      class="input"
      type="text"
      :id="id"
      :value="value"
      readonly
      v-on:input="updateValue($event.target.value)"
    />
  </div>
</template>

<script>
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    id: {
      type: String,
    },
    label: {
      type: String,
    },
    value: {
      type: String,
    },
  },

  methods: {
    updateValue: function (value) {
      this.$emit("input", value);
    },
  },
});
</script>
