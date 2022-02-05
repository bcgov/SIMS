<template>
  <p class="muted-heading-text">
    <a @click="goBack()">
      <v-icon left> mdi-arrow-left </v-icon> Program detail</a
    >
  </p>
  <span class="heading-x-large">
    <span v-if="isReadonly">View Study Period</span>
    <span v-if="offeringId && !isReadonly">Edit Study Period</span>
    <span v-if="!offeringId">Add Study Period</span>
  </span>
  <full-page-container class="mt-2">
    <formio
      formName="educationprogramoffering"
      :data="initialData"
      :readOnly="isReadonly"
      @submitted="submitted"
    ></formio>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import formio from "@/components/generic/formio.vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import { onMounted, ref, computed } from "vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { ClientIdType } from "@/types";
import {
  InstitutionRoutesConst,
  AESTRoutesConst,
} from "@/constants/routes/RouteConstants";
import { useToastMessage } from "@/composables";

export default {
  components: { formio, FullPageContainer },
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
    clientType: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const toast = useToastMessage();
    const router = useRouter();
    const initialData = ref();
    const isInstitutionUser = computed(() => {
      return props.clientType === ClientIdType.Institution;
    });
    const isAESTUser = computed(() => {
      return props.clientType === ClientIdType.AEST;
    });
    const isReadonly = computed(() => {
      return isAESTUser.value;
    });
    const loadFormData = async () => {
      if (isInstitutionUser.value) {
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
      }
      if (isAESTUser.value) {
        if (props.offeringId) {
          const programOffering = await EducationProgramOfferingService.shared.getProgramOfferingForAEST(
            props.offeringId,
          );
          initialData.value = {
            ...programOffering,
          };
        }
      }
    };
    onMounted(async () => {
      await loadFormData();
    });

    const goBack = async () => {
      if (isInstitutionUser.value) {
        // when edit program and create program
        router.push({
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        });
      } else if (isAESTUser.value) {
        const programDetails = await EducationProgramService.shared.getEducationProgramForAEST(
          props.programId,
        );
        const institutionId = programDetails.institutionId;
        //view program mode
        router.push({
          name: AESTRoutesConst.PROGRAM_DETAILS,
          params: {
            programId: props.programId,
            institutionId: institutionId,
            locationId: props.locationId,
          },
        });
      }
    };
    const submitted = async (data: any) => {
      if (isInstitutionUser.value) {
        try {
          if (props.offeringId) {
            await EducationProgramOfferingService.shared.updateProgramOffering(
              props.locationId,
              props.programId,
              props.offeringId,
              data,
            );
            toast.success(
              "Updated!",
              "Education Offering updated successfully!",
            );
          } else {
            await EducationProgramOfferingService.shared.createProgramOffering(
              props.locationId,
              props.programId,
              data,
            );
            toast.success(
              "Created!",
              "Education Offering created successfully!",
            );
          }
          goBack();
        } catch (excp) {
          toast.error(
            "Unexpected error",
            "An error happened during the Offering saving process.",
          );
        }
      }
    };
    return {
      submitted,
      initialData,
      isReadonly,
      goBack,
    };
  },
};
</script>
