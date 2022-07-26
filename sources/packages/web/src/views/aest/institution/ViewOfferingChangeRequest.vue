<template>
  <full-page-container layout-template="centred-tab">
    <template #header>
      <header-navigator
        title="Study period offerings"
        :routeLocation="{ name: AESTRoutesConst.OFFERING_CHANGE_REQUESTS }"
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
    <template #tab-header>
      <v-tabs v-model="tab" color="primary">
        <v-tab value="requested-change" :ripple="false">Requested Change</v-tab>
        <v-tab value="active-offering" :ripple="false">Active Offering</v-tab>
      </v-tabs>
    </template>

    <v-window v-model="tab">
      <v-window-item value="requested-change"
        ><offering-form :data="initialData"></offering-form>
      </v-window-item>
      <v-window-item value="active-offering">
        <offering-form :data="initialData"></offering-form>
      </v-window-item>
    </v-window>

    <assess-offering-modal
      ref="assessOfferingModalRef"
      :offeringStatus="offeringApprovalStatus"
    />
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramService } from "@/services/EducationProgramService";
import { OfferingFormEditModel, OfferingStatus } from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
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
    const tab = ref("requested-change");
    const initialData = ref({} as OfferingFormEditModel);

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

    onMounted(async () => {
      await loadFormData();
    });

    return {
      initialData,
      OfferingStatus,
      BannerTypes,
      AESTRoutesConst,
      tab,
    };
  },
};
</script>
