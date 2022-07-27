<template>
  <full-page-container layout-template="centered-tab">
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
        ><offering-change-request
          :offeringId="offeringId"
          :programId="programId"
          @getHeaderDetails="getHeaderDetails"
        ></offering-change-request>
      </v-window-item>
      <v-window-item value="active-offering">
        <offering-change-request
          :offeringId="precedingOffering.offeringId"
          :programId="programId"
        ></offering-change-request>
      </v-window-item>
    </v-window>
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { OfferingStatus, ProgramOfferingHeader } from "@/types";
import { PrecedingOfferingSummaryAPIOutDTO } from "@/services/http/dto";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { BannerTypes } from "@/components/generic/Banner.models";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingChangeRequest from "@/components/aest/OfferingChangeRequest.vue";

export default {
  components: {
    ProgramOfferingDetailHeader,
    OfferingChangeRequest,
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
    const bannerText = computed(() => {
      if (precedingOffering.value?.applicationsCount > 1) {
        return `There are ${precedingOffering.value.applicationsCount} financial aid applications with this offering.`;
      }
      return precedingOffering.value?.applicationsCount === 1
        ? "There is 1 financial aid application with this offering."
        : "There are no financial aid applications with this offering.";
    });
    //TODO: This callback implementation needs to be removed when the program and offering header component
    //TODO: is enhanced to load header values with it's own API call.
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
      getHeaderDetails,
      precedingOffering,
      bannerText,
    };
  },
};
</script>
