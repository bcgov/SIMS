<template>
  <v-container>
    <formio
      formName="institutionlocation"
      :data="locationData"
      @submitted="updateInstituionLocation"
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
  emits: ["updateInstituionLocation"],
  setup(props: any, context: any) {
    const updateInstituionLocation = async (
      data: InstitutionLocationFormAPIOutDTO,
    ) => {
      context.emit("updateInstituionLocation", data);
    };

    return {
      updateInstituionLocation,
    };
  },
};
</script>
