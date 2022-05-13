<template>
  <div class="p-m-4">
    <header-navigator
      :title="locationName"
      subTitle="Confirmation Of Enrollment"
    />
    <TabView lazy class="mt-4">
      <TabPanel>
        <template #header>
          <font-awesome-icon :icon="['fas', 'folder-open']"></font-awesome-icon>
          <span class="ml-2">Confirm enrollment </span>
        </template>
        <COESummaryData
          :locationId="locationId"
          :enrollmentPeriod="EnrollmentPeriod.Current"
          header="Available to confirm enrollment"
          subTitle="Confirm enrolment so that funding can be dispersed."
        />
      </TabPanel>
      <TabPanel>
        <template #header>
          <font-awesome-icon :icon="['fas', 'user']"></font-awesome-icon>
          <span class="ml-2">Upcoming enrollment</span>
        </template>
        <COESummaryData
          :locationId="locationId"
          :enrollmentPeriod="EnrollmentPeriod.Upcoming"
          header="Upcoming enrollment"
          subTitle="These applications are still outside of the 21 days of the study start date."
        />
      </TabPanel>
    </TabView>
  </div>
</template>

<script lang="ts">
import COESummaryData from "@/views/institution/locations/confirmation-of-enrollment/COESummaryData.vue";
import { EnrollmentPeriod } from "@/types";
export default {
  components: { COESummaryData },
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
    return { EnrollmentPeriod };
  },
};
</script>
