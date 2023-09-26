<template>
  <full-page-container layout-template="centered-card-tab">
    <template #header>
      <header-navigator
        title="Study period offerings"
        :routeLocation="{ name: AESTRoutesConst.OFFERING_CHANGE_REQUESTS }"
        subTitle="View Request"
      />
      <program-offering-detail-header
        class="m-4"
        :headerDetails="headerDetails"
      />
    </template>
    <template #tab-header>
      <v-tabs v-model="tab" color="primary" stacked>
        <v-tab value="requested-change" :ripple="false">Active Change</v-tab>
        <v-tab value="active-offering" :ripple="false">Previous Offering</v-tab>
      </v-tabs>
    </template>
    <v-window v-model="tab">
      <v-window-item value="requested-change"
        ><offering-change-request
          :offeringId="offeringId"
          :programId="programId"
          :relationType="OfferingRelationType.ActualOffering"
        ></offering-change-request>
      </v-window-item>
      <v-window-item value="active-offering">
        <offering-change-request
          :offeringId="offeringId"
          :programId="programId"
          :relationType="OfferingRelationType.PrecedingOffering"
        ></offering-change-request>
      </v-window-item>
    </v-window>
  </full-page-container>
</template>

<script lang="ts">
import { ref, defineComponent, onMounted } from "vue";
import {
  OfferingStatus,
  ProgramOfferingHeader,
  OfferingRelationType,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";

export default defineComponent({
  components: {
    ProgramOfferingDetailHeader,
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
  setup(props) {
    const tab = ref("requested-change");
    const headerDetails = ref({} as ProgramOfferingHeader);

    onMounted(async () => {
      const offering =
        await EducationProgramOfferingService.shared.getOfferingDetails(
          props.offeringId,
        );
      headerDetails.value = {
        institutionId: offering.institutionId,
        institutionName: offering.institutionName,
        submittedDate: offering.submittedDate,
        status: offering.offeringStatus,
        assessedBy: offering.assessedBy,
        assessedDate: offering.assessedDate,
        locationName: offering.locationName,
      };
    });

    return {
      headerDetails,
      OfferingStatus,
      AESTRoutesConst,
      tab,
      OfferingRelationType,
    };
  },
});
</script>
