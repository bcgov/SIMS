<template>
  <formio-container
    formName="institutionLocation"
    :formData="locationData"
    @submitted="updateInstitutionLocation"
  >
    <template #actions="{ submit }">
      <footer-buttons
        :processing="processing"
        primaryLabel="Submit"
        @primaryClick="submit"
        :showSecondaryButton="false"
      /> </template
  ></formio-container>
</template>

<script lang="ts">
import { InstitutionLocationFormAPIOutDTO } from "@/services/http/dto";
import { ref, defineComponent } from "vue";
import { FormIOForm } from "@/types";

export default defineComponent({
  props: {
    locationData: {
      type: Object,
      required: true,
    },
  },
  emits: ["updateInstitutionLocation"],
  setup(_props, context) {
    const processing = ref(false);
    const updateInstitutionLocation = async (
      form: FormIOForm<InstitutionLocationFormAPIOutDTO>,
    ) => {
      processing.value = true;
      context.emit("updateInstitutionLocation", form.data);
      processing.value = false;
    };

    return {
      updateInstitutionLocation,
      processing,
    };
  },
});
</script>
