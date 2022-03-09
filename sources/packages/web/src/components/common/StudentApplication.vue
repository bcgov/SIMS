<template>
  <formio
    :formName="selectedForm"
    :data="initialData"
    :readOnly="isReadOnly"
    @loaded="$emit('formLoaded')"
    @changed="$emit('formChanged')"
    @submitted="$emit('submitApplication')"
    @customEvent="$emit('customEventCallback')"
  ></formio>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";

export default {
  emits: [
    "formLoaded",
    "formChanged",
    "submitApplication",
    "customEventCallback",
  ],
  components: {
    formio,
  },
  props: {
    initialData: {
      type: Object,
      required: true,
    },
    selectedForm: {
      type: String,
      required: true,
    },
    isReadOnly: {
      type: Boolean,
      required: true,
    },
  },
};
</script>
