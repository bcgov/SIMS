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
    <template #alerts
      ><offering-application-banner
        :offeringId="offeringId"
      ></offering-application-banner>
    </template>
    <template #tab-header>
      <v-tabs stacked v-model="tab" color="primary">
        <v-tab value="requested-change" :ripple="false">Requested Change</v-tab>
        <v-tab value="active-offering" :ripple="false">Active Offering</v-tab>
      </v-tabs>
    </template>
    <v-window v-model="tab">
      <v-window-item value="requested-change"
        ><offering-change-request
          :offeringId="offeringId"
          :programId="programId"
          :relationType="OfferingRelationType.ActualOffering"
          @getHeaderDetails="getHeaderDetails"
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
import { ref } from "vue";
import {
  OfferingStatus,
  ProgramOfferingHeader,
  OfferingRelationType,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingChangeRequest from "@/components/aest/OfferingChangeRequest.vue";
import OfferingApplicationBanner from "@/components/aest/OfferingApplicationBanner.vue";

export default {
  components: {
    ProgramOfferingDetailHeader,
    OfferingChangeRequest,
    OfferingApplicationBanner,
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

  setup() {
    const tab = ref("requested-change");
    const headerDetails = ref({} as ProgramOfferingHeader);

    //TODO: This callback implementation needs to be removed when the program and offering header component
    //TODO: is enhanced to load header values with it's own API call.
    const getHeaderDetails = (data: ProgramOfferingHeader) => {
      headerDetails.value = data;
    };

    return {
      headerDetails,
      OfferingStatus,
      AESTRoutesConst,
      tab,
      getHeaderDetails,
      OfferingRelationType,
    };
  },
};
</script>
