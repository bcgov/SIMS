<template>
  <full-page-container layout-template="start" :fluid="false">
    <template #header>
      <header-navigator :title="locationName" subTitle="Report a Change" />
    </template>
    <v-tabs v-model="tab" stacked color="primary">
      <v-tab :value="ActiveApplicationTab.AvailableToReportTab" :ripple="false">
        <span class="mx-1 label-bold"> Available to report </span>
      </v-tab>
      <v-tab
        :value="ActiveApplicationTab.UnavailableToReportTab"
        :ripple="false"
      >
        <span class="mx-1 label-bold"> Unavailable to report </span>
      </v-tab>
    </v-tabs>
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
import { ref } from "vue";

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
    locationName: {
      type: String,
      required: true,
    },
  },
  setup() {
    const tab = ref("active-application-tab");
    return { tab, ActiveApplicationTab };
  },
};
</script>
