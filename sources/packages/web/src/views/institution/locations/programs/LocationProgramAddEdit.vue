<template>
  <v-container>
    <!-- TODO: Remove v-if once edit is developed. -->
    <h5 v-if="programId" class="color-grey">
      Edit Program ID {{ programId }} - TO BE DEVELOPED
    </h5>
    <template v-else>
      <h5 class="color-grey">Create New Program</h5>
      <v-sheet elevation="1" class="mx-auto">
        <v-container>
          <formio formName="educationprogram" @submitted="submitted"></formio>
        </v-container>
      </v-sheet>
    </template>
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import formio from "../../../../components/generic/formio.vue";
import { EducationProgramService } from "../../../../services/EducationProgramService";
import { InstitutionRoutesConst } from "../../../../constants/routes/RouteConstants";

export default {
  components: { formio },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    programId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const toast = useToast();
    const router = useRouter();
    const submitted = async (data: any) => {
      try {
        await EducationProgramService.shared.createProgram(data);
        router.push({
          name: InstitutionRoutesConst.LOCATION_PROGRAMS,
          params: {
            locationId: props.locationId,
          },
        });
        toast.add({
          severity: "success",
          summary: "Created!",
          detail: "Education Program created successfully!",
          life: 5000,
        });
      } catch (excp) {
        toast.add({
          severity: "error",
          summary: "Unexpected error",
          detail: "An error happened during the create process.",
          life: 5000,
        });
      }
    };
    return {
      submitted,
    };
  },
};
</script>
