<template>
  <full-page-container layout-template="centered-tab" :full-width="true">
    <template #header>
      <header-navigator
        :title="locationName"
        subTitle="Confirmation Of Enrolment"
        data-cy="confirmationOfEnrolmentHeader"
      />
    </template>
    <template #tab-header>
      <v-tabs v-model="tab" stacked color="primary">
        <v-tab :value="COETab.ConfirmEnrollmentTab" :ripple="false">
          <div>
            <v-icon start icon="fa:far fa-check-square"></v-icon>
            <span class="label-bold" data-cy="confirmEnrolmentTab">
              Confirm enrolment
            </span>
          </div>
        </v-tab>

        <v-tab :value="COETab.UpcomingEnrollmentTab" :ripple="false">
          <div>
            <v-icon start icon="fa:far fa-folder-open" class="px-1"></v-icon>
            <span class="label-bold" data-cy="upcomingEnrolmentTab">
              Upcoming and Previous Enrolments
            </span>
          </div>
        </v-tab>
      </v-tabs></template
    >
    <v-window v-model="tab">
      <v-window-item :value="COETab.ConfirmEnrollmentTab" :eager="false">
        <c-o-e-summary-data
          :locationId="locationId"
          :enrollmentPeriod="EnrollmentPeriod.Current"
          header="Available to confirm enrolment"
          subTitle="Confirm enrolment so that funding can be dispersed."
        />
      </v-window-item>
      <v-window-item :value="COETab.UpcomingEnrollmentTab" :eager="false">
        <c-o-e-summary-data
          :locationId="locationId"
          :enrollmentPeriod="EnrollmentPeriod.Upcoming"
          header="Upcoming and
        Previous Enrolments"
        >
          <template #coeSummarySubtitle>
            <span>This page contains two types of records:</span>
            <ul>
              <li>
                disbursements requests which are upcoming and will be required
                at a later date. These are indicated by a 'Required' status.
              </li>
              <li>
                previously actioned Confirmation of Enrolment Requests which can
                no longer be actioned. These are indicated by a 'Completed'
                status.
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
