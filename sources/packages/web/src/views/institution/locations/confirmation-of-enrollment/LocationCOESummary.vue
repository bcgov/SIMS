<template>
  <div class="p-m-4">
    <HeaderNavigator
      :title="locationName"
      subTitle="Confirmation Of Enrollment"
    />
    <v-container>
      <TabView lazy>
        <TabPanel>
          <template #header>
            <font-awesome-icon
              :icon="['fas', 'folder-open']"
            ></font-awesome-icon>
            <span class="ml-2">Confirm enrollment </span>
          </template>
          <COESummaryData
            :locationId="locationId"
            :enrollmentPeriod="EnrollmentPeriod.Current"
            header="Available to confirm enrollment"
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
          />
        </TabPanel>
      </TabView>
    </v-container>
  </div>
</template>

<script lang="ts">
import COESummaryData from "@/views/institution/locations/confirmation-of-enrollment/COESummaryData.vue";
import { EnrollmentPeriod } from "@/types";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";

export default {
  components: { COESummaryData, HeaderNavigator },
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
