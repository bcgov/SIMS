<template>
  <p class="muted-heading-text">
    <a @click="goBack()">
      <v-icon left> mdi-arrow-left </v-icon> Program detail</a
    >
  </p>

  <span class="heading-x-large">
    <span v-if="isReadonly">View Program</span>
    <span v-if="programId && !isReadonly">Edit Program</span>
    <span v-if="!programId">Create New Program</span>
  </span>
  <full-page-container class="mt-2">
    <formio
      formName="educationprogram"
      :data="initialData"
      :readOnly="isReadonly"
      @submitted="submitted"
    ></formio>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import formio from "@/components/generic/formio.vue";
import { EducationProgramService } from "@/services/EducationProgramService";
import {
  InstitutionRoutesConst,
  AESTRoutesConst,
} from "@/constants/routes/RouteConstants";
import { onMounted, ref, computed } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import { ClientIdType } from "@/types";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { useToastMessage } from "@/composables";
import { AuthService } from "@/services/AuthService";

export default {
  components: { formio, FullPageContainer },
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
    const toast = useToastMessage();
    const router = useRouter();
    const institutionId = ref();
    const clientType = computed(() => AuthService.shared.authClientType);

    const isInstitutionUser = computed(() => {
      return clientType.value === ClientIdType.Institution;
    });
    const isAESTUser = computed(() => {
      return clientType.value === ClientIdType.AEST;
    });
    const isReadonly = computed(() => {
      return isAESTUser.value;
    });
    // Data-bind
    const initialData = ref({});

    const loadFormData = async () => {
      if (isInstitutionUser.value) {
        const institution = await InstitutionService.shared.getDetail();
        if (props.programId) {
          const program = await EducationProgramService.shared.getProgram(
            props.programId,
          );
          initialData.value = {
            ...program,
            ...{ isBCPrivate: institution.isBCPrivate },
          };
        } else {
          initialData.value = {
            isBCPrivate: institution.isBCPrivate,
          };
        }
      }
      if (isAESTUser.value) {
        const programDetails = await EducationProgramService.shared.getEducationProgramForAEST(
          props.programId,
        );
        institutionId.value = programDetails.institutionId;
        initialData.value = {
          ...programDetails,
          ...{ isBCPrivate: programDetails.regulatoryBody },
        };
      }
    };

    onMounted(async () => {
      await loadFormData();
    });

    const goBack = () => {
      if (isInstitutionUser.value && props.programId) {
        // in edit program mode
        router.push({
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        });
      } else if (isInstitutionUser.value && !props.programId) {
        // in create program mode
        router.push({
          name: InstitutionRoutesConst.LOCATION_PROGRAMS,
          params: {
            locationId: props.locationId,
          },
        });
      } else if (isAESTUser.value) {
        // in view program mode
        router.push({
          name: AESTRoutesConst.PROGRAM_DETAILS,
          params: {
            programId: props.programId,
            institutionId: institutionId.value,
            locationId: props.locationId,
          },
        });
      }
    };

    const submitted = async (data: any) => {
      if (isInstitutionUser.value) {
        try {
          if (props.programId) {
            await EducationProgramService.shared.updateProgram(
              props.programId,
              data,
            );
            toast.success(
              "Updated!",
              "Education Program updated successfully!",
            );
          } else {
            await EducationProgramService.shared.createProgram(data);
            toast.success(
              "Created!",
              "Education Program created successfully!",
            );
          }
          goBack();
        } catch (excp) {
          toast.error(
            "Unexpected error",
            "An error happened during the saving process.",
          );
        }
      }
    };
    return {
      initialData,
      submitted,
      isReadonly,
      goBack,
    };
  },
};
</script>
