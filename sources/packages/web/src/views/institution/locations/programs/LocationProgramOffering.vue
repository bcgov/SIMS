<template>
  <v-container>
    <header-navigator
      title="Program detail"
      :routeLocation="{
        name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
        params: {
          programId: programId,
          locationId: locationId,
        },
      }"
      :subTitle="subTitle"
    />
    <program-offering-detail-header
      v-if="offeringId"
      class="m-4"
      :headerDetails="{
        ...initialData,
        status: initialData.offeringStatus,
      }"
    />
  </v-container>
  <full-page-container>
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
import { ClientIdType, OfferingDTO, ProgramDto } from "@/types";
import {
  InstitutionRoutesConst,
  AESTRoutesConst,
} from "@/constants/routes/RouteConstants";
import { useToastMessage, useOffering } from "@/composables";
import { AuthService } from "@/services/AuthService";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";

export default {
  components: {
    formio,
    FullPageContainer,
    HeaderNavigator,
    ProgramOfferingDetailHeader,
  },
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
    const toast = useToastMessage();
    const router = useRouter();
    const initialData = ref({} as Partial<OfferingDTO & ProgramDto>);
    const { mapOfferingChipStatus } = useOffering();
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

    const subTitle = computed(() => {
      if (isReadonly.value) {
        return "View Study Period";
      }
      if (props.offeringId && !isReadonly.value) {
        return "Edit Study Period";
      }
      return "Add Study Period";
    });
    const loadFormData = async () => {
      if (isInstitutionUser.value) {
        const programDetails = await EducationProgramService.shared.getProgram(
          props.programId,
        );
        if (props.offeringId) {
          const programOffering =
            await EducationProgramOfferingService.shared.getProgramOffering(
              props.locationId,
              props.programId,
              props.offeringId,
            );
          initialData.value = {
            ...programOffering,
            ...programDetails,
          };
          initialData.value.offeringChipStatus = mapOfferingChipStatus(
            programOffering.offeringStatus,
          );
        } else {
          initialData.value = {
            ...programDetails,
          };
        }
      }
      if (isAESTUser.value) {
        if (props.offeringId) {
          const programOffering =
            await EducationProgramOfferingService.shared.getProgramOfferingForAEST(
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
        const programDetails =
          await EducationProgramService.shared.getEducationProgramForAEST(
            props.programId,
          );
        if (programDetails.institutionId) {
          //view program mode
          router.push({
            name: AESTRoutesConst.PROGRAM_DETAILS,
            params: {
              programId: props.programId,
              institutionId: programDetails.institutionId,
              locationId: props.locationId,
            },
          });
        }
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
      InstitutionRoutesConst,
      subTitle,
    };
  },
};
</script>
