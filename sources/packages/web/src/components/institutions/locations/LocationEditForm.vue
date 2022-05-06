<template>
  <v-container>
    <formio
      formName="institutionlocation"
      :data="locationData"
      @submitted="updateInstitutionLocation"
    ></formio>
  </v-container>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import { InstitutionLocationFormAPIOutDTO } from "@/services/http/dto";

export default {
  components: { formio },
  props: {
    locationData: {
      type: Object,
      required: true,
    },
  },
  emits: ["updateInstitutionLocation"],
  setup(props: any, context: any) {
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
