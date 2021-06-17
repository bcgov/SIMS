<template>
  <Card class="p-m-4">
    <template #content>
      <formio
        formName="educationprogramoffering"
        @submitted="submitted"
      ></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import formio from "../../../../components/generic/formio.vue";
import { EducationProgramOfferingService } from "../../../../services/EducationProgramOfferingService";
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
      required: true,
    },
  },
  setup(props: any) {
    const toast = useToast();
    const router = useRouter();
    const submitted = async (data: any) => {
      try {
        await EducationProgramOfferingService.shared.createProgramOffering(
          props.locationId,
          props.programId,
          data,
        );
        router.push({
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
        });
        toast.add({
          severity: "success",
          summary: "Created!",
          detail: "Education Offering created successfully!",
          life: 5000,
        });
      } catch (excp) {
        toast.add({
          severity: "error",
          summary: "Unexpected error",
          detail: "An error happened during the Offering create process.",
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
