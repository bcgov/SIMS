<template>
  <Card class="p-m-4">
    <template #content>
      <formio formName="educationprogram" @submitted="submitted"></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import formio from "../../components/generic/formio.vue";
import { EducationProgramService } from "../../services/EducationProgramService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import { CreateEducationProgramDto } from "../../types";

export default {
  components: { formio },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const toast = useToast();
    const router = useRouter();
    const submitted = async (data: CreateEducationProgramDto) => {
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
