<template>
  <formio-container
    formName="institutionProfile"
    :formData="profileData"
    @loaded="formLoaded"
    @submitted="submitInstitutionProfile"
  >
    <template #actions="{ submit }">
      <footer-buttons
        :processing="processing"
        primaryLabel="Create profile"
        @primaryClick="submit"
        :showSecondaryButton="false"
      />
    </template>
  </formio-container>
</template>

<script lang="ts">
import { useFormioDropdownLoader } from "@/composables";
import { SetupContext } from "vue";
import { InstitutionProfileForm } from "@/types";

export default {
  props: {
    profileData: {
      type: Object,
      required: true,
    },
    processing: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["submitInstitutionProfile"],
  setup(_props: any, context: SetupContext) {
    const formioDataLoader = useFormioDropdownLoader();

    const submitInstitutionProfile = async (data: InstitutionProfileForm) => {
      context.emit("submitInstitutionProfile", data);
    };

    const formLoaded = async (form: any) => {
      await formioDataLoader.loadInstitutionTypes(form, "institutionType");
    };

    return {
      submitInstitutionProfile,
      formLoaded,
    };
  },
};
</script>
