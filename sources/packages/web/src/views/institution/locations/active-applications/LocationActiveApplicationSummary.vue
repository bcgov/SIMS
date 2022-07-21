<template>
  <full-page-container layout-template="centered">
    <template #header>
      <header-navigator :title="locationName" subTitle="Report a Change" />
    </template>

    <TabView lazy class="mt-4">
      <TabPanel>
        <template #header>
          <span class="ml-2">Available to report</span>
        </template>

        <ActiveApplicationSummaryData
          :locationId="locationId"
          :archived="false"
        />
      </TabPanel>
      <TabPanel>
        <template #header>
          <span class="ml-2">Unavailable to report</span>
        </template>

        <ActiveApplicationSummaryData
          :locationId="locationId"
          :archived="true"
        />
      </TabPanel>
    </TabView>
  </full-page-container>
</template>

<script lang="ts">
import ActiveApplicationSummaryData from "@/components/institutions/active-application/ActiveApplicationSummaryData.vue";

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
};
</script>
