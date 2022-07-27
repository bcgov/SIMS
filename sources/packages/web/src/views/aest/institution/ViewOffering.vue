<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Study period offerings"
        :routeLocation="programRoute"
        subTitle="View Request"
      >
        <template #buttons v-if="showActionButtons">
          <v-btn
            color="primary"
            variant="outlined"
            @click="assessOffering(OfferingStatus.Declined)"
            >Decline</v-btn
          >
          <v-btn
            class="ml-2"
            color="primary"
            @click="assessOffering(OfferingStatus.Approved)"
            >Approve offering</v-btn
          >
        </template>
      </header-navigator>
      <program-offering-detail-header
        class="m-4"
        :headerDetails="{
          ...initialData,
          status: initialData.offeringStatus,
          institutionId: institutionId,
        }"
      />
    </template>
    <offering-form :data="initialData"></offering-form>
    <assess-offering-modal
      ref="assessOfferingModalRef"
      :offeringStatus="offeringApprovalStatus"
    />
  </full-page-container>
</template>

<script lang="ts">
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import { onMounted, ref, computed } from "vue";
import { OfferingFormBaseModel, OfferingStatus } from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar, ModalDialog } from "@/composables";
import { OfferingAssessmentAPIInDTO } from "@/services/http/dto";
import { BannerTypes } from "@/components/generic/Banner.models";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingForm from "@/components/common/OfferingForm.vue";
import AssessOfferingModal from "@/components/aest/institution/modals/AssessOfferingModal.vue";

export default {
  components: {
    ProgramOfferingDetailHeader,
    OfferingForm,
    AssessOfferingModal,
  },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
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
    const snackBar = useSnackBar();
    const initialData = ref({} as OfferingFormBaseModel);
    const assessOfferingModalRef = ref(
      {} as ModalDialog<OfferingAssessmentAPIInDTO | boolean>,
    );
    const offeringApprovalStatus = ref(OfferingStatus.Declined);
    const programRoute = computed(() => ({
      name: AESTRoutesConst.PROGRAM_DETAILS,
      params: {
        programId: props.programId,
        institutionId: props.institutionId,
        locationId: props.locationId,
      },
    }));
    const showActionButtons = computed(
      () => initialData.value.offeringStatus === OfferingStatus.Pending,
    );
    const loadFormData = async () => {
      const programDetails =
        await EducationProgramService.shared.getEducationProgramForAEST(
          props.programId,
        );
      const programOffering =
        await EducationProgramOfferingService.shared.getProgramOfferingForAEST(
          props.offeringId,
        );

      initialData.value = {
        ...programOffering,
        programIntensity: programDetails.programIntensity,
        programDeliveryTypes: programDetails.programDeliveryTypes,
        hasWILComponent: programDetails.hasWILComponent,
      };
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
          snackBar.success(
            `The given offering has been ${offeringStatus.toLowerCase()} and notes added.`,
          );
          await loadFormData();
        } catch (error) {
          snackBar.error(
            "Unexpected error while approving/declining the offering.",
          );
        }
      }
    };
    onMounted(async () => {
      await loadFormData();
    });
    return {
      initialData,
      OfferingStatus,
      BannerTypes,
      AESTRoutesConst,
      assessOffering,
      assessOfferingModalRef,
      programRoute,
      showActionButtons,
      offeringApprovalStatus,
    };
  },
};
</script>
