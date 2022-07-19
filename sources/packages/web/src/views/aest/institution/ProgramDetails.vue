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
            variant="outlined"
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
import {
  EducationProgramData,
  ApproveProgram,
  DeclineProgram,
  ProgramStatus,
} from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";
import { COLOR_BLUE } from "@/constants";
import ApproveProgramModal from "@/components/aest/institution/modals/ApproveProgramModal.vue";
import { ModalDialog, useToastMessage } from "@/composables";
import DeclineProgramModal from "@/components/aest/institution/modals/DeclineProgramModal.vue";
import useEmitter from "@/composables/useEmitter";

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
    const emitter = useEmitter();
    const educationProgram = ref({} as EducationProgramData);
    const approveProgramModal = ref(
      {} as ModalDialog<ApproveProgram | undefined>,
    );
    const declineProgramModal = ref(
      {} as ModalDialog<DeclineProgram | undefined>,
    );
    const toast = useToastMessage();

    const getEducationProgramAndOffering = async () => {
      educationProgram.value =
        await EducationProgramService.shared.getEducationProgramForAEST(
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

        emitter.emit(
          "snackBar",
          toast.success1(`${educationProgram.value.name} approved !`),
        );
        await getEducationProgramAndOffering();
      } catch {
        emitter.emit(
          "snackBar",
          toast.error1("An error happened while approving the program."),
        );
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

        emitter.emit(
          "snackBar",
          toast.success1(`${educationProgram.value.name} Decline !`),
        );
        await getEducationProgramAndOffering();
      } catch {
        emitter.emit(
          "snackBar",
          toast.error1("An error happened while declining the program."),
        );
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
