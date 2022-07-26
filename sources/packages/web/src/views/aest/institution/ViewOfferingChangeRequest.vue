<template>
  <full-page-container layout-template="centred-tab">
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
      <v-tabs v-model="tab" color="primary">
        <v-tab value="requested-change" :ripple="false">Requested Change</v-tab>
        <v-tab value="active-offering" :ripple="false">Active Offering</v-tab>
      </v-tabs>
    </template>
    <v-window v-model="tab">
      <v-window-item value="requested-change"
        ><offering-request-change
          v-if="tab === 'requested-change'"
          :offeringId="offeringId"
          :programId="programId"
          @getHeaderDetails="getHeaderDetails"
        ></offering-request-change>
      </v-window-item>
      <v-window-item value="active-offering">
        <offering-request-change
          v-if="tab === 'active-offering'"
          :offeringId="offeringId"
          :programId="programId"
          :relationType="OfferingRelationType.PrecedingOffering"
          @getHeaderDetails="getHeaderDetails"
        ></offering-request-change>
      </v-window-item>
    </v-window>
  </full-page-container>
</template>

<script lang="ts">
import { ref } from "vue";
import {
  OfferingStatus,
  OfferingRelationType,
  ProgramOfferingHeader,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/components/generic/Banner.models";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingRequestChange from "@/components/aest/OfferingRequestChange.vue";

export default {
  components: {
    ProgramOfferingDetailHeader,
    OfferingRequestChange,
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
    const getHeaderDetails = (data: ProgramOfferingHeader) => {
      headerDetails.value = data;
    };

    return {
      headerDetails,
      OfferingStatus,
      BannerTypes,
      AESTRoutesConst,
      tab,
      OfferingRelationType,
      getHeaderDetails,
    };
  },
};
</script>
