<template>
  <v-container>
    <header-navigator
      title="Back all programs"
      :routeLocation="{
        name: AESTRoutesConst.INSTITUTION_PROGRAMS,
        params: { institutionId: institutionId },
      }"
      subTitle="View program"
    >
      <template #buttons>
        <div v-if="isPendingProgram">
          <v-btn
            outlined
            :color="COLOR_BLUE"
            class="mr-2"
            @click="declineProgram"
            >Decline</v-btn
          >
          <v-btn class="primary-btn-background" @click="approveProgram"
            >Approve program</v-btn
          >
        </div>
      </template>
    </header-navigator>
    <ManageProgramAndOfferingSummary
      :programId="programId"
      :locationId="locationId"
      :educationProgram="educationProgram"
    />
    <!-- approve program modal -->
    <ApproveProgramModal ref="approveProgramModal" />
    <!-- decline program modal -->
    <DeclineProgramModal ref="declineProgramModal" />
  </v-container>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ManageProgramAndOfferingSummary from "@/components/common/ManageProgramAndOfferingSummary.vue";
import { ref, onMounted, computed } from "vue";
import { EducationProgramData, ApprovalStatus } from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import { COLOR_BLUE } from "@/constants";
import ApproveProgramModal from "@/components/aest/institution/modals/ApproveProgramModal.vue";
import { ModalDialog, useToastMessage } from "@/composables";
import DeclineProgramModal from "@/components/aest/institution/modals/DeclineProgramModal.vue";

export default {
  components: {
    ManageProgramAndOfferingSummary,
    HeaderNavigator,
    ApproveProgramModal,
    DeclineProgramModal,
  },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    institutionId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const educationProgram = ref({} as EducationProgramData);
    const approveProgramModal = ref({} as ModalDialog<boolean>);
    const declineProgramModal = ref({} as ModalDialog<boolean>);
    const toast = useToastMessage();

    const getEducationProgramAndOffering = async () => {
      educationProgram.value = await EducationProgramService.shared.getEducationProgramForAEST(
        props.programId,
      );
    };

    const isPendingProgram = computed(
      () => educationProgram.value.approvalStatus === ApprovalStatus.pending,
    );
    const approveProgram = async () => {
      if (await approveProgramModal.value.showModal()) {
        console.log("approve");
        try {
          await EducationProgramService.shared.approveProgram(props.programId);
          toast.success(
            "Program Approved",
            `${educationProgram.value.name} approved !`,
          );
        } catch {
          toast.error(
            "Unexpected error",
            "An error happened while approving the program.",
          );
        }
      }
    };

    const declineProgram = async () => {
      if (await declineProgramModal.value.showModal()) {
        console.log("decline");
        try {
          await EducationProgramService.shared.declineProgram(props.programId);
          toast.success(
            "Program Decline",
            `${educationProgram.value.name} Decline !`,
          );
        } catch {
          toast.error(
            "Unexpected error",
            "An error happened while declining the program.",
          );
        }
      }
    };

    onMounted(getEducationProgramAndOffering);

    return {
      educationProgram,
      AESTRoutesConst,
      COLOR_BLUE,
      isPendingProgram,
      approveProgramModal,
      approveProgram,
      declineProgramModal,
      declineProgram,
    };
  },
};
</script>
