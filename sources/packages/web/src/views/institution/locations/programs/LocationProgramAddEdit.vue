<template>
  <h5 class="color-grey">
    <span v-if="programId">Edit Program</span>
    <span v-else>Create New Program</span>
  </h5>
  <v-sheet elevation="1" class="mx-auto">
    <v-container>
      <formio
        formName="educationprogram"
        :data="initialData"
        @submitted="submitted"
      ></formio>
    </v-container>
  </v-sheet>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import formio from "../../../../components/generic/formio.vue";
import { EducationProgramService } from "../../../../services/EducationProgramService";
import { InstitutionRoutesConst } from "../../../../constants/routes/RouteConstants";
import { onMounted, ref } from "vue";

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
    // Data-bind
    const initialData = ref({});

    onMounted(async () => {
      if (props.programId) {
        initialData.value = await EducationProgramService.shared.getProgram(
          props.programId,
        );
      }
    });

    const submitted = async (data: any) => {
      try {
        if (props.programId) {
          await EducationProgramService.shared.updateProgram(
            props.programId,
            data,
          );
        } else {
          await EducationProgramService.shared.createProgram(data);
        }

        router.push({
          name: InstitutionRoutesConst.LOCATION_PROGRAMS,
          params: {
            locationId: props.locationId,
          },
        });
        toast.add({
          severity: "success",
          summary: "Created!",
          detail: "Education Program saved successfully!",
          life: 5000,
        });
      } catch (excp) {
        toast.add({
          severity: "error",
          summary: "Unexpected error",
          detail: "An error happened during the saving process.",
          life: 5000,
        });
      }
    };
    return {
      initialData,
      submitted,
    };
  },
};
</script>
