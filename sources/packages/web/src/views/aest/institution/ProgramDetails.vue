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
        <v-row class="p-0 m-0" v-if="isPendingProgram">
          <v-btn
            variant="outlined"
            :color="COLOR_BLUE"
            class="mr-2"
            @click="declineProgram"
            >Decline</v-btn
          >
          <v-btn class="primary-btn-background" @click="approveProgram"
            >Approve program</v-btn
          >
        </v-row>
      </template>
    </header-navigator>
    <ManageProgramAndOfferingSummary
      :programId="programId"
      :locationId="locationId"
      :educationProgram="educationProgram"
      :institutionId="institutionId"
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
import { ApproveProgram, DeclineProgram, ProgramStatus } from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";
import { COLOR_BLUE } from "@/constants";
import ApproveProgramModal from "@/components/aest/institution/modals/ApproveProgramModal.vue";
import { ModalDialog, useSnackBar } from "@/composables";
import DeclineProgramModal from "@/components/aest/institution/modals/DeclineProgramModal.vue";
import { EducationProgramDetailsAPIOutDTO } from "@/services/http/dto";

export default {
  components: {
    ManageProgramAndOfferingSummary,
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
    const educationProgram = ref({} as EducationProgramDetailsAPIOutDTO);
    const approveProgramModal = ref(
      {} as ModalDialog<ApproveProgram | undefined>,
    );
    const declineProgramModal = ref(
      {} as ModalDialog<DeclineProgram | undefined>,
    );
    const snackBar = useSnackBar();

    const getEducationProgramAndOffering = async () => {
      educationProgram.value =
        await EducationProgramService.shared.getEducationProgramDetails(
          props.programId,
        );
    };

    const isPendingProgram = computed(
      () => educationProgram.value.programStatus === ProgramStatus.Pending,
    );

    const submitApproveProgram = async (approveProgramData: ApproveProgram) => {
      try {
        await EducationProgramService.shared.approveProgram(
          props.programId,
          props.institutionId,
          approveProgramData,
        );
        snackBar.success(`${educationProgram.value.name} approved !`);
        await getEducationProgramAndOffering();
      } catch {
        snackBar.error("An error happened while approving the program.");
      }
    };

    const approveProgram = async () => {
      const approveProgramData = await approveProgramModal.value.showModal();
      if (approveProgramData) await submitApproveProgram(approveProgramData);
    };

    const submitDeclineProgram = async (declineProgramData: DeclineProgram) => {
      try {
        await EducationProgramService.shared.declineProgram(
          props.programId,
          props.institutionId,
          declineProgramData,
        );
        snackBar.success(`${educationProgram.value.name} Decline !`);
        await getEducationProgramAndOffering();
      } catch {
        snackBar.error("An error happened while declining the program.");
      }
    };

    const declineProgram = async () => {
      const declineProgramData = await declineProgramModal.value.showModal();
      if (declineProgramData) await submitDeclineProgram(declineProgramData);
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
