<template>
  <div class="p-m-4">
    <HeaderNavigator :title="locationName" subTitle="Report a Change" />

    <TabView lazy class="mt-4">
      <TabPanel>
        <template #header>
          <span class="ml-2">Available to report</span>
        </template>
        <ActiveApplicationSummaryData
          :locationId="locationId"
          :applicationStatus="ApplicationStatus.available"
        />
      </TabPanel>
      <TabPanel>
        <template #header>
          <span class="ml-2">Unavailable to report</span>
        </template>
        <ActiveApplicationSummaryData
          :locationId="locationId"
          :applicationStatus="ApplicationStatus.unavailable"
        />
      </TabPanel>
    </TabView>
  </div>
</template>

<script lang="ts">
import ActiveApplicationSummaryData from "@/views/institution/locations/active-applications/ActiveApplicationSummaryData.vue";
import { ApplicationStatus } from "@/types";
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
  setup(_props: any) {
    return {
      ApplicationStatus,
    };
  },
};
</script>
