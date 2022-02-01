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
          <span>Confirm enrollment </span>
          <font-awesome-icon
            :icon="['fas', 'folder-open']"
            class="ml-2"
          ></font-awesome-icon>
        </template>
        <COESummaryData
          :locationId="locationId"
          :upcomingCOE="false"
          header="Available to confirm enrollment"
        />
      </TabPanel>
      <TabPanel>
        <template #header>
          <span>Upcoming enrollment</span>
          <font-awesome-icon
            :icon="['fas', 'user']"
            class="ml-2"
          ></font-awesome-icon>
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
  setup() {
    return {};
  },
};
</script>
