<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator :title="locationName" sub-title="Manage Offerings" />
    </template>
    <body-header-container>
      <template #header>
        <body-header title="All programs" :records-count="programsCount" />
      </template>
      <manage-programs-table
        :program-year-id="programYearId"
        :get-view-program-route="getViewProgramRoute"
        v-model:records-count="programsCount"
        @filters-changed="filtersChanged"
      />
    </body-header-container>
  </full-page-container>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import type { RouteLocationRaw } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ManageProgramsTable from "@/components/institutions/education-programs/ManageProgramsTable.vue";
import { useInstitutionState } from "@/composables";

interface ManageOfferingsProps {
  locationId: number;
  // Program year to be selected by default, when provided.
  programYearId?: number;
}

const props = defineProps<ManageOfferingsProps>();
const { getLocationName } = useInstitutionState();
const router = useRouter();
// Total of programs listed for the selected program year and filters.
const programsCount = ref<number>();

const locationName = computed(() => getLocationName(props.locationId));

/**
 * Route to the view program page in the context of the location.
 * @param programId program to be viewed.
 * @returns view location program route location.
 */
const getViewProgramRoute = (programId: number): RouteLocationRaw => ({
  name: InstitutionRoutesConst.MANAGE_OFFERINGS_PROGRAM_VIEW,
  params: { programId, locationId: props.locationId },
});

/**
 * Keeps the route in sync with the selected program year.
 * @param programYearId currently selected program year id, if any.
 */
const filtersChanged = async (programYearId?: number | null) => {
  await router.replace({
    name: InstitutionRoutesConst.MANAGE_OFFERINGS,
    params: { locationId: props.locationId, programYearId },
  });
};
</script>
