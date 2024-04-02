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
          <check-permission-role :role="Role.InstitutionApproveDeclineProgram">
            <template #="{ notAllowed }">
              <v-btn
                variant="outlined"
                color="primary"
                class="mr-2"
                @click="declineProgram"
                :disabled="notAllowed"
                >Decline</v-btn
              >
              <v-btn
                color="primary"
                @click="approveProgram"
                :disabled="notAllowed"
                >Approve program</v-btn
              >
            </template>
          </check-permission-role>
        </v-row>
      </template>
    </header-navigator>
    <program-offering-detail-header
      class="m-4"
      :headerDetails="{
        ...educationProgram,
        status: educationProgram.programStatus,
      }"
    />
    <manage-program-and-offering-summary
      :programId="programId"
      :locationId="locationId"
      :educationProgram="educationProgram"
      :institutionId="institutionId"
      @program-data-updated="programDataUpdated"
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
import { ref, onMounted, computed, defineComponent } from "vue";
import { ProgramStatus, Role } from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";
import ApproveProgramModal from "@/components/aest/institution/modals/ApproveProgramModal.vue";
import { ModalDialog, useSnackBar } from "@/composables";
import DeclineProgramModal from "@/components/aest/institution/modals/DeclineProgramModal.vue";
import {
  ApproveProgramAPIInDTO,
  DeclineProgramAPIInDTO,
  EducationProgramAPIOutDTO,
} from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";

export default defineComponent({
  components: {
    ManageProgramAndOfferingSummary,
    ApproveProgramModal,
    DeclineProgramModal,
    CheckPermissionRole,
    ProgramOfferingDetailHeader,
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
  setup(props) {
    const educationProgram = ref({} as EducationProgramAPIOutDTO);
    const approveProgramModal = ref(
      {} as ModalDialog<ApproveProgramAPIInDTO | undefined>,
    );
    const declineProgramModal = ref(
      {} as ModalDialog<DeclineProgramAPIInDTO | undefined>,
    );
    const snackBar = useSnackBar();

    const getEducationProgramAndOffering = async () => {
      educationProgram.value =
        await EducationProgramService.shared.getEducationProgram(
          props.programId,
        );
    };

    const isPendingProgram = computed(
      () => educationProgram.value.programStatus === ProgramStatus.Pending,
    );

    const submitApproveProgram = async (
      approveProgramData: ApproveProgramAPIInDTO,
    ) => {
      try {
        await EducationProgramService.shared.approveProgram(
          props.programId,
          props.institutionId,
          approveProgramData,
        );
        snackBar.success(`${educationProgram.value.name} approved!`);
        await getEducationProgramAndOffering();
      } catch {
        snackBar.error("An error happened while approving the program.");
      }
    };

    const approveProgram = async () => {
      const approveProgramData = await approveProgramModal.value.showModal();
      if (approveProgramData) await submitApproveProgram(approveProgramData);
    };

    const submitDeclineProgram = async (
      declineProgramData: DeclineProgramAPIInDTO,
    ) => {
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

    const programDataUpdated = () => getEducationProgramAndOffering();

    onMounted(getEducationProgramAndOffering);

    return {
      educationProgram,
      AESTRoutesConst,
      isPendingProgram,
      approveProgramModal,
      approveProgram,
      declineProgramModal,
      declineProgram,
      Role,
      programDataUpdated,
    };
  },
});
</script>
