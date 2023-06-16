<template>
  <full-page-container layout-template="centered-tab" :full-width="true">
    <template #header>
      <header-navigator
        :title="locationName"
        data-cy="requestAnApplicationChangeHeader"
        sub-title="Request an Application Change"
      />
    </template>
    <template #tab-header>
      <v-tabs v-model="tab" stacked color="primary">
        <v-tab
          :value="ActiveRequestAChangeTab.AvailableToChangeTab"
          :ripple="false"
        >
          <span class="label-bold" data-cy="availableToChangeTab">
            Available to change
          </span>
        </v-tab>
        <v-tab :value="ActiveRequestAChangeTab.InprogressTab" :ripple="false">
          <span class="label-bold" data-cy="inprogressTab"> In progress </span>
        </v-tab>
        <v-tab :value="ActiveRequestAChangeTab.CompletedTab" :ripple="false">
          <span class="label-bold" data-cy="completedTab"> Completed </span>
        </v-tab>
      </v-tabs>
    </template>
    <v-window v-model="tab">
      <v-window-item
        :value="ActiveRequestAChangeTab.AvailableToChangeTab"
        :eager="false"
      >
        <available-to-change-summary :location-id="locationId" />
      </v-window-item>
      <v-window-item
        :value="ActiveRequestAChangeTab.InprogressTab"
        :eager="false"
      >
        <!-- todo: InprogressTab -->
      </v-window-item>
      <v-window-item
        :value="ActiveRequestAChangeTab.CompletedTab"
        :eager="false"
      >
        <!-- todo: CompletedTab -->
      </v-window-item>
    </v-window>
  </full-page-container>
</template>

<script lang="ts">
import AvailableToChangeSummary from "@/components/institutions/request-a-change/AvailableToChangeSummary.vue";
import { ref, computed, defineComponent } from "vue";
import { useInstitutionState } from "@/composables";

enum ActiveRequestAChangeTab {
  AvailableToChangeTab = "available-to-change-tab",
  InprogressTab = "inprogress-tab",
  CompletedTab = "complete-tab",
}

export default defineComponent({
  components: { AvailableToChangeSummary },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },

  setup(props) {
    const { getLocationName } = useInstitutionState();
    const tab = ref(ActiveRequestAChangeTab.AvailableToChangeTab);

    const locationName = computed(() => {
      return getLocationName(props.locationId);
    });

    return { tab, ActiveRequestAChangeTab, locationName };
  },
});
</script>
