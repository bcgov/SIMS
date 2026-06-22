<template>
  <full-page-container layout-template="centered-tab" :full-width="true">
    <template #header>
      <header-navigator
        :title="locationName"
        sub-title="Confirmation Of Enrolment"
        data-cy="confirmationOfEnrolmentHeader"
      />
    </template>
    <template #tab-header>
      <v-tabs v-model="tab" color="primary">
        <v-tab text="Confirm enrolment" :value="COETab.ConfirmEnrollmentTab" />
        <v-tab
          text="Upcoming and Previous Enrolments"
          :value="COETab.UpcomingEnrollmentTab"
        /> </v-tabs
    ></template>
    <v-window v-model="tab">
      <v-window-item :value="COETab.ConfirmEnrollmentTab" :eager="false">
        <c-o-e-summary-data
          :location-id="locationId"
          :enrollment-period="EnrollmentPeriod.Current"
          header="Available to confirm enrolment"
          sub-title="Confirm enrolment so that funding can be dispersed."
        />
      </v-window-item>
      <v-window-item :value="COETab.UpcomingEnrollmentTab" :eager="false">
        <c-o-e-summary-data
          :location-id="locationId"
          :enrollment-period="EnrollmentPeriod.Upcoming"
          header="Upcoming and Previous Enrolments"
        >
          <template #coeSummarySubtitle>
            <span>This page contains two types of records:</span>
            <ul>
              <li>
                Disbursements requests which are upcoming and will be required
                at a later date. These are indicated by a
                <span class="font-bold">Required</span> status.
              </li>
              <li>
                Previously actioned Confirmation of Enrolment Requests which can
                no longer be actioned. These are indicated by a
                <span class="font-bold">Completed</span> status.
              </li>
            </ul>
          </template>
        </c-o-e-summary-data>
      </v-window-item>
    </v-window>
  </full-page-container>
</template>

<script lang="ts">
import COESummaryData from "@/views/institution/locations/confirmation-of-enrollment/COESummaryData.vue";
import { EnrollmentPeriod } from "@/types";
import { ref, computed, defineComponent } from "vue";
import { useInstitutionState } from "@/composables";

enum COETab {
  ConfirmEnrollmentTab = "confirm-enrolment-tab",
  UpcomingEnrollmentTab = "upcoming-enrolment-tab",
}

export default defineComponent({
  components: { COESummaryData },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { getLocationName } = useInstitutionState();
    const tab = ref("coe-tab");

    const locationName = computed(() => {
      return getLocationName(props.locationId);
    });
    return { EnrollmentPeriod, COETab, tab, locationName };
  },
});
</script>
