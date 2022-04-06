<template>
  <div class="p-m-4">
    <header-navigator
      :title="locationDetails?.locationName"
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
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import { InstitutionService } from "@/services/InstitutionService";
import { onMounted, ref } from "vue";
export default {
  components: { COESummaryData, HeaderNavigator },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const locationDetails = ref();

    const loadProgramDetails = async () => {
      locationDetails.value =
        await InstitutionService.shared.getInstitutionLocation(
          props.locationId,
        );
    };

    onMounted(async () => {
      await loadProgramDetails();
    });

    return { EnrollmentPeriod, locationDetails };
  },
};
</script>
