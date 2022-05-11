<template>
  <formio
    formName="institutionlocation"
    :data="locationData"
    @submitted="updateInstitutionLocation"
  ></formio>
</template>

<script lang="ts">
import { InstitutionLocationFormAPIOutDTO } from "@/services/http/dto";
import { SetupContext } from "vue";

export default {
  props: {
    locationData: {
      type: Object,
      required: true,
    },
  },
  emits: ["updateInstitutionLocation"],
  setup(_props: any, context: SetupContext) {
    const updateInstitutionLocation = async (
      data: InstitutionLocationFormAPIOutDTO,
    ) => {
      context.emit("updateInstitutionLocation", data);
    };

    return {
      updateInstitutionLocation,
    };
  },
};
</script>
