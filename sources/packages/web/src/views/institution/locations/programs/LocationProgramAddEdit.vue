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
import { useToast } from "primevue/usetoast";
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
    clientType: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const toast = useToast();
    const router = useRouter();
    const institutionId = ref();
    const isReadonly = computed(() => {
      return ClientIdType.Institution !== props.clientType;
    });
    // Data-bind
    const initialData = ref({});

    const loadFormData = async () => {
      if (ClientIdType.Institution === props.clientType) {
        const institution = await InstitutionService.shared.getDetail();
        institutionId.value = institution.institution.id;
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
      if (ClientIdType.AEST === props.clientType) {
        const programDetails = await EducationProgramService.shared.getEducationProgramForAEST(
          props.programId,
        );
        institutionId.value = programDetails.institutionId;
        initialData.value = programDetails;
      }
    };

    onMounted(async () => {
      await loadFormData();
    });

    const goBack = () => {
      if (!isReadonly.value && props.programId) {
        // in edit program mode
        router.push({
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        });
      } else if (!isReadonly.value && !props.programId) {
        // in create program mode
        router.push({
          name: InstitutionRoutesConst.LOCATION_PROGRAMS,
          params: {
            locationId: props.locationId,
          },
        });
      } else if (isReadonly.value) {
        // in view program mode
        router.push({
          name: AESTRoutesConst.PROGRAM_DETAILS,
          params: {
            programId: props.programId,
            institutionId: institutionId.value,
          },
        });
      }
    };

    const submitted = async (data: any) => {
      try {
        if (!isReadonly.value) {
          if (props.programId) {
            await EducationProgramService.shared.updateProgram(
              props.programId,
              data,
            );
          } else {
            await EducationProgramService.shared.createProgram(data);
          }

          router.push({
            name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
            params: {
              programId: props.programId,
              locationId: props.locationId,
            },
          });
          toast.add({
            severity: "success",
            summary: "Created!",
            detail: "Education Program saved successfully!",
            life: 5000,
          });
        }
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
      isReadonly,
      goBack,
    };
  },
};
</script>
