<template>
  <v-container>
    <p class="text-muted category-header-medium">
      {{ locationName }}
    </p>
    <p class="category-header-large">
      Confirmation Of Enrollment
    </p>

    <TabView lazy>
      <TabPanel>
        <template #header>
          <font-awesome-icon :icon="['fas', 'folder-open']"></font-awesome-icon>
          <span class="ml-2">Confirm enrollment </span>
        </template>
        <COESummaryData
          :locationId="locationId"
          :upcomingCOE="false"
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
          :upcomingCOE="true"
          header="Upcoming enrollment"
        />
      </TabPanel>
    </TabView>
  </v-container>
</template>

<script lang="ts">
import COESummaryData from "@/views/institution/locations/confirmation-of-enrollment/COESummaryData.vue";

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
};
</script>
