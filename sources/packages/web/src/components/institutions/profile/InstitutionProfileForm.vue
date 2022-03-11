<template>
  <formio
    formName="institutionprofile"
    :data="profileData"
    @loaded="formLoaded"
    @submitted="submitInstitutionProfile"
  ></formio>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import { InstitutionDto } from "@/types";
import { useFormioDropdownLoader } from "@/composables";

export default {
  components: { formio },
  props: {
    profileData: {
      type: Object,
      required: true,
    },
  },
  emits: ["submitInstitutionProfile"],
  setup(props: any, context: any) {
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
