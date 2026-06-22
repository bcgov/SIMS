<template>
  <full-page-container layout-template="centered-tab" :full-width="true">
    <template #header>
      <header-navigator
        :title="locationName"
        data-cy="reportAChangeHeader"
        sub-title="Report a Change"
      />
    </template>
    <template #tab-header>
      <v-tabs v-model="tab" stacked color="primary">
        <v-tab
          :value="ActiveApplicationTab.AvailableToReportTab"
          text="Available to report"
          class="label-bold"
        />
        <v-tab
          :value="ActiveApplicationTab.UnavailableToReportTab"
          text="Unavailable to report"
          class="label-bold"
        />
      </v-tabs>
    </template>
    <v-window v-model="tab">
      <v-window-item
        :value="ActiveApplicationTab.AvailableToReportTab"
        :eager="false"
      >
        <active-application-summary-data
          :location-id="locationId"
          :archived="false"
        />
      </v-window-item>
      <v-window-item
        :value="ActiveApplicationTab.UnavailableToReportTab"
        :eager="false"
      >
        <active-application-summary-data
          :location-id="locationId"
          :archived="true"
        />
      </v-window-item>
    </v-window>
  </full-page-container>
</template>

<script lang="ts">
import ActiveApplicationSummaryData from "@/components/institutions/active-application/ActiveApplicationSummaryData.vue";
import { ref, computed, defineComponent } from "vue";
import { useInstitutionState } from "@/composables";

enum ActiveApplicationTab {
  AvailableToReportTab = "available-to-report-tab",
  UnavailableToReportTab = "unavailable-to-report-tab",
}

export default defineComponent({
  components: { ActiveApplicationSummaryData },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },

  setup(props) {
    const { getLocationName } = useInstitutionState();
    const tab = ref(ActiveApplicationTab.AvailableToReportTab);

    const locationName = computed(() => {
      return getLocationName(props.locationId);
    });

    return { tab, ActiveApplicationTab, locationName };
  },
});
</script>
