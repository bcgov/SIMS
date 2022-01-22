<template>
  <Card class="p-m-4">
    <template #content>
      {{ initialData }}
      <formio
        formName="educationprogramoffering"
        :data="initialData"
        @submitted="submitted"
      ></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import formio from "@/components/generic/formio.vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
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
      required: true,
    },
    offeringId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const toast = useToast();
    const router = useRouter();
    const initialData = ref();
    onMounted(async () => {
      const programDetails = await EducationProgramService.shared.getProgram(
        props.programId,
      );
      if (props.offeringId) {
        const programOffering = await EducationProgramOfferingService.shared.getProgramOffering(
          props.locationId,
          props.programId,
          props.offeringId,
        );
        initialData.value = {
          ...programOffering,
          ...programDetails,
        };
      } else {
        initialData.value = {
          ...programDetails,
        };
      }
    });

    const submitted = async (data: any) => {
      try {
        if (props.offeringId) {
          await EducationProgramOfferingService.shared.updateProgramOffering(
            props.locationId,
            props.programId,
            props.offeringId,
            data,
          );
          toast.add({
            severity: "success",
            summary: "Updated!",
            detail: "Education Offering updated successfully!",
            life: 5000,
          });
        } else {
          await EducationProgramOfferingService.shared.createProgramOffering(
            props.locationId,
            props.programId,
            data,
          );
          toast.add({
            severity: "success",
            summary: "Created!",
            detail: "Education Offering created successfully!",
            life: 5000,
          });
        }
        router.push({
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
            locationName: "initialData.value?.name",
          },
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
      initialData,
    };
  },
};
</script>
