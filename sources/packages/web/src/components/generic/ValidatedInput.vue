<template>
  <div>
    <div :class="{ 'validation-error': !!isValid }">
      <slot></slot>
    </div>
    <ErrorMessage :name="propertyName" class="validation-error-message" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useFieldError, ErrorMessage } from "vee-validate";

export default defineComponent({
  props: {
    propertyName: {
      type: String,
      required: true,
    },
  },
  components: {
    ErrorMessage,
  },
  setup(props) {
    const isValid = useFieldError(props.propertyName);
    return {
      isValid,
    };
  },
});
</script>

<style lang="scss">
.validation-error-message {
  color: red;
}

.validation-error input {
  border: 2px solid red;
}

.validation-error > .p-component {
  border: 2px solid red;
}
</style>
