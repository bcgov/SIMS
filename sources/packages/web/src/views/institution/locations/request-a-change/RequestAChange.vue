<template>
  <full-page-container layout-template="centered-tab" :full-width="true">
    <template #header>
      <header-navigator
        :title="locationName"
        sub-title="Request an Application Change"
      />
    </template>
    <template #tab-header>
      <v-tabs stacked color="primary"
        ><v-tab
          v-for="item in tabItems"
          :key="item.label"
          :to="item.command()"
          :ripple="false"
          ><div>
            <span class="label-bold"> {{ item.label }} </span>
          </div>
        </v-tab>
      </v-tabs>
    </template>
    <router-view />
  </full-page-container>
</template>

<script lang="ts">
import { ref, computed, defineComponent } from "vue";
import { useInstitutionState } from "@/composables";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

export default defineComponent({
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { getLocationName } = useInstitutionState();
    const tabItems = ref([
      {
        label: "Available to change",
        command: () => ({
          name: InstitutionRoutesConst.REQUEST_CHANGE_AVAILABLE_TO_CHANGE,
          params: {
            locationId: props.locationId,
          },
        }),
      },
      {
        label: "In progress",
        command: () => ({
          name: InstitutionRoutesConst.REQUEST_CHANGE_IN_PROGRESS,
          params: { locationId: props.locationId },
        }),
      },
      {
        label: "Completed",
        command: () => ({
          name: InstitutionRoutesConst.REQUEST_CHANGE_COMPLETED,
          params: { locationId: props.locationId },
        }),
      },
    ]);

    const locationName = computed(() => {
      return getLocationName(props.locationId);
    });

    return { locationName, tabItems };
  },
});
</script>
