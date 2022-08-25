<template>
  <full-page-container layout-template="centered-tab" :full-width="true">
    <template #header>
      <header-navigator
        :title="locationName"
        subTitle="Confirmation Of Enrollment"
      />
    </template>
    <template #tab-header>
      <v-tabs v-model="tab" stacked color="primary">
        <v-tab :value="COETab.ConfirmEnrollmentTab" :ripple="false">
          <div>
            <v-icon start icon="fa:far fa-check-square"></v-icon>
            <span class="mx-1 label-bold"> Confirm enrollment </span>
          </div>
        </v-tab>

        <v-tab :value="COETab.UpcomingEnrollmentTab" :ripple="false">
          <div>
            <v-icon start icon="fa:far fa-folder-open" class="px-1"></v-icon>
            <span class="mx-1 label-bold"> Upcoming enrollment </span>
          </div>
        </v-tab>
      </v-tabs></template
    >
    <v-window v-model="tab">
      <v-window-item :value="COETab.ConfirmEnrollmentTab" :eager="false">
        <c-o-e-summary-data
          :locationId="locationId"
          :enrollmentPeriod="EnrollmentPeriod.Current"
          header="Available to confirm enrollment"
          subTitle="Confirm enrolment so that funding can be dispersed."
        />
      </v-window-item>
      <v-window-item :value="COETab.UpcomingEnrollmentTab" :eager="false">
        <c-o-e-summary-data
          :locationId="locationId"
          :enrollmentPeriod="EnrollmentPeriod.Upcoming"
          header="Upcoming enrollment"
          subTitle="These applications are still outside of the 21 days of the study start date."
        />
      </v-window-item>
    </v-window>
  </full-page-container>
</template>

<script lang="ts">
import COESummaryData from "@/views/institution/locations/confirmation-of-enrollment/COESummaryData.vue";
import { EnrollmentPeriod } from "@/types";
import { ref, computed } from "vue";
import { useInstitutionState } from "@/composables";

enum COETab {
  ConfirmEnrollmentTab = "confirm-enrollment-tab",
  UpcomingEnrollmentTab = "upcoming-enrollment-tab",
}

export default {
  components: { COESummaryData },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const { getLocationName } = useInstitutionState();
    const tab = ref("coe-tab");

    const locationName = computed(() => {
      return getLocationName(parseInt(props.locationId));
    });
    return { EnrollmentPeriod, COETab, tab, locationName };
  },
};
</script>
