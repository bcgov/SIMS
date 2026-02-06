<template>
  <div class="alert alert-danger error-summary" v-if="errors?.length">
    <p>Please fix the following errors before submitting.</p>
    <ul class="pl-4">
      <li v-for="error in errors" :key="error">
        <span>{{ error.errorMessages[0] }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from "vue";
import { ErrorMessage } from "@/types";

export default defineComponent({
  props: {
    errors: {
      type: Object as PropType<ErrorMessage[]>,
      required: false,
    },
  },
});
</script>
