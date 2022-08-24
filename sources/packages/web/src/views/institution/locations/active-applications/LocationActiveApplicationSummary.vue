<template>
  <full-page-container layout-template="centered-tab" :full-width="true">
    <template #header>
      <header-navigator :title="locationName" subTitle="Report a Change" />
    </template>
    <template #tab-header>
      <v-tabs v-model="tab" stacked color="primary">
        <v-tab
          :value="ActiveApplicationTab.AvailableToReportTab"
          :ripple="false"
        >
          <span class="mx-1 label-bold"> Available to report </span>
        </v-tab>
        <v-tab
          :value="ActiveApplicationTab.UnavailableToReportTab"
          :ripple="false"
        >
          <span class="mx-1 label-bold"> Unavailable to report </span>
        </v-tab>
      </v-tabs>
    </template>
    <v-window v-model="tab">
      <v-window-item
        :value="ActiveApplicationTab.AvailableToReportTab"
        :eager="false"
      >
        <active-application-summary-data
          :locationId="locationId"
          :archived="false"
        />
      </v-window-item>
      <v-window-item
        :value="ActiveApplicationTab.UnavailableToReportTab"
        :eager="false"
      >
        <active-application-summary-data
          :locationId="locationId"
          :archived="true"
        />
      </v-window-item>
    </v-window>
  </full-page-container>
</template>

<script lang="ts">
import ActiveApplicationSummaryData from "@/components/institutions/active-application/ActiveApplicationSummaryData.vue";
import { ref, computed } from "vue";
import { useInstitutionState } from "@/composables";

enum ActiveApplicationTab {
  AvailableToReportTab = "available-to-report-tab",
  UnavailableToReportTab = "unavailable-to-report-tab",
}

export default {
  components: { ActiveApplicationSummaryData },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },

  setup(props: any) {
    const insitutionState = useInstitutionState();
    const tab = ref("active-application-tab");

    const locationName = computed(() => {
      return insitutionState.getLocationName(parseInt(props.locationId));
    });

    return { tab, ActiveApplicationTab, locationName };
  },
};
</script>
