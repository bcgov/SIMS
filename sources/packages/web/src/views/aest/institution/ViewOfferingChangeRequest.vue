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
    <template #alerts>
      <banner class="mb-2" :type="BannerTypes.Warning" :header="bannerText" />
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
          :offeringId="precedingOffering.offeringId"
          :programId="programId"
        ></offering-request-change>
      </v-window-item>
    </v-window>
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  OfferingStatus,
  OfferingRelationType,
  ProgramOfferingHeader,
} from "@/types";
import { PrecedingOfferingSummaryAPIOutDTO } from "@/services/http/dto";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
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

  setup(props: any) {
    const tab = ref("requested-change");
    const headerDetails = ref({} as ProgramOfferingHeader);
    const precedingOffering = ref({} as PrecedingOfferingSummaryAPIOutDTO);
    const bannerText = computed(() =>
      precedingOffering.value?.applicationsCount
        ? `There are ${precedingOffering.value.applicationsCount} financial aid applications with this offering`
        : "There are no financial aid application with this offering",
    );
    const getHeaderDetails = (data: ProgramOfferingHeader) => {
      headerDetails.value = data;
    };

    onMounted(async () => {
      precedingOffering.value =
        await EducationProgramOfferingService.shared.getPrecedingOfferingSummary(
          props.offeringId,
        );
    });

    return {
      headerDetails,
      OfferingStatus,
      BannerTypes,
      AESTRoutesConst,
      tab,
      OfferingRelationType,
      getHeaderDetails,
      precedingOffering,
      bannerText,
    };
  },
};
</script>
