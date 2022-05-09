<template>
  <formio
    formName="institutionprofile"
    :data="profileData"
    @loaded="formLoaded"
    @submitted="submitInstitutionProfile"
  ></formio>
</template>

<script lang="ts">
import { InstitutionDto } from "@/types";
import { useFormioDropdownLoader } from "@/composables";
import { SetupContext } from "vue";

export default {
  props: {
    profileData: {
      type: Object,
      required: true,
    },
  },
  emits: ["submitInstitutionProfile"],
  setup(_props: any, context: SetupContext) {
    const formioDataLoader = useFormioDropdownLoader();

    const submitInstitutionProfile = async (data: InstitutionDto) => {
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
