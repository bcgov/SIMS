<template>
  <v-container>
    <header-navigator
      title="Program detail"
      :routeLocation="getRouteLocation()"
      :subTitle="subTitle"
    >
      <template #buttons>
        <v-btn
          v-if="showActionButtons"
          color="primary"
          variant="outlined"
          @click="assessOffering(OfferingStatus.Declined)"
          >Decline</v-btn
        >
        <v-btn
          class="ml-2"
          color="primary"
          v-if="showActionButtons"
          @click="assessOffering(OfferingStatus.Approved)"
          >Approve offering</v-btn
        >
      </template></header-navigator
    >
    <program-offering-detail-header
      v-if="offeringId"
      class="m-4"
      :headerDetails="{
        ...initialData,
        status: initialData.offeringStatus,
      }"
    />
    <assess-offering-modal
      ref="assessOfferingModalRef"
      :offeringStatus="offeringApprovalStatus"
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
import { useRouter, RouteLocationRaw } from "vue-router";
import formio from "@/components/generic/formio.vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import { onMounted, ref, computed } from "vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import {
  ClientIdType,
  OfferingFormModel,
  OfferingStatus,
  ProgramDto,
} from "@/types";
import {
  InstitutionRoutesConst,
  AESTRoutesConst,
} from "@/constants/routes/RouteConstants";
import { useToastMessage, useOffering, ModalDialog } from "@/composables";
import { AuthService } from "@/services/AuthService";
import { OfferingAssessmentAPIInDTO } from "@/services/http/dto";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import AssessOfferingModal from "@/components/aest/institution/modals/AssessOfferingModal.vue";

export default {
  components: {
    formio,
    FullPageContainer,
    HeaderNavigator,
    ProgramOfferingDetailHeader,
    AssessOfferingModal,
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
    institutionId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const toast = useToastMessage();
    const router = useRouter();
    const initialData = ref({} as Partial<OfferingFormModel & ProgramDto>);
    const { mapOfferingChipStatus } = useOffering();
    const clientType = computed(() => AuthService.shared.authClientType);
    const assessOfferingModalRef = ref(
      {} as ModalDialog<OfferingAssessmentAPIInDTO | boolean>,
    );
    const offeringApprovalStatus = ref(OfferingStatus.Declined);
    const isInstitutionUser = computed(() => {
      return clientType.value === ClientIdType.Institution;
    });
    const isAESTUser = computed(() => {
      return clientType.value === ClientIdType.AEST;
    });
    const isReadonly = computed(() => {
      return isAESTUser.value;
    });

    const showActionButtons = computed(
      () =>
        initialData.value.offeringStatus === OfferingStatus.Pending &&
        isAESTUser.value,
    );

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
          initialData.value.offeringChipStatus = mapOfferingChipStatus(
            programOffering.offeringStatus,
          );
        }
      }
    };
    onMounted(async () => {
      await loadFormData();
    });

    const getRouteLocation = (): RouteLocationRaw => {
      if (isInstitutionUser.value) {
        // when edit program and create program
        return {
          name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
          params: {
            programId: props.programId,
            locationId: props.locationId,
          },
        };
      }
      if (isAESTUser.value) {
        return {
          name: AESTRoutesConst.PROGRAM_DETAILS,
          params: {
            programId: props.programId,
            institutionId: props.institutionId,
            locationId: props.locationId,
          },
        };
      }
      return {};
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
          router.push(getRouteLocation());
        } catch (excp) {
          toast.error(
            "Unexpected error",
            "An error happened during the Offering saving process.",
          );
        }
      }
    };

    const assessOffering = async (offeringStatus: OfferingStatus) => {
      offeringApprovalStatus.value = offeringStatus;
      const responseData = await assessOfferingModalRef.value.showModal();
      if (responseData) {
        try {
          await EducationProgramOfferingService.shared.assessOffering(
            props.offeringId,
            responseData as OfferingAssessmentAPIInDTO,
          );
          toast.success(
            `Offering ${offeringStatus}`,
            `The given offering has been ${offeringStatus.toLowerCase()} and notes added.`,
          );
          await loadFormData();
        } catch (error) {
          toast.error(
            "Unexpected error",
            "Unexpected error while approving/declining the offering.",
          );
        }
      }
    };
    return {
      submitted,
      initialData,
      isReadonly,
      getRouteLocation,
      InstitutionRoutesConst,
      subTitle,
      showActionButtons,
      assessOffering,
      OfferingStatus,
      assessOfferingModalRef,
      offeringApprovalStatus,
    };
  },
};
</script>
