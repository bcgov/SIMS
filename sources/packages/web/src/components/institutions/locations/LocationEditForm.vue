<template>
  <formio-container
    formName="institutionlocation"
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
import { ref, SetupContext } from "vue";
import { FormIOForm } from "@/types";

export default {
  props: {
    locationData: {
      type: Object,
      required: true,
    },
  },
  emits: ["updateInstitutionLocation"],
  setup(_props: any, context: SetupContext) {
    const processing = ref(false);
    const updateInstitutionLocation = async (form: FormIOForm) => {
      processing.value = true;
      const data = form.data as InstitutionLocationFormAPIOutDTO;
      context.emit("updateInstitutionLocation", data);
      processing.value = false;
    };

    return {
      updateInstitutionLocation,
      processing,
    };
  },
};
</script>
