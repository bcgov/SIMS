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

    <v-tabs
      lazy
      v-model="tab"
      background-color="deep-purple-accent-4"
      centered
      stacked
      grow
    >
      <v-tab value="tab-1" ripple>
        <v-icon>mdi-phone</v-icon>
        Recents
      </v-tab>

      <v-tab value="tab-2" ripple>
        <v-icon>mdi-heart</v-icon>
        Favorites
      </v-tab>
    </v-tabs>
    <v-window v-model="tab">
      <v-window-item value="tab-1">
        <v-lazy
          v-model="tab"
          :options="{
            threshold: 0.5,
          }"
          min-height="200"
          transition="fade-transition"
        >
          <COESummaryData
            v-if="tab === `tab-1`"
            :locationId="locationId"
            :enrollmentPeriod="EnrollmentPeriod.Current"
            header="Available to confirm enrollment"
            subTitle="Confirm enrolment so that funding can be dispersed."
          />
        </v-lazy>
      </v-window-item>
      <v-window-item value="tab-2">
        <v-lazy
          v-model="tab"
          :options="{
            threshold: 0.5,
          }"
          min-height="200"
          transition="fade-transition"
        >
          <COESummaryData
            v-if="tab === `tab-2`"
            :locationId="locationId"
            :enrollmentPeriod="EnrollmentPeriod.Upcoming"
            header="Upcoming enrollment"
            subTitle="These applications are still outside of the 21 days of the study start date."
          />
        </v-lazy>
      </v-window-item>
    </v-window>
  </div>
</template>

<script lang="ts">
import COESummaryData from "@/views/institution/locations/confirmation-of-enrollment/COESummaryData.vue";
import { EnrollmentPeriod } from "@/types";
import { ref } from "vue";
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
    const tab = ref("tab");
    const isActive = ref(false);
    return { EnrollmentPeriod, tab, isActive };
  },
};
</script>
