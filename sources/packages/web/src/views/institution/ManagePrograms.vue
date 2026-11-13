<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        :title="institutionState?.operatingName"
        sub-title="Manage Programs"
      />
    </template>
    <body-header-container>
      <template #header>
        <body-header
          title="Programs by Program Year"
          :records-count="programsCount"
        >
          <template #actions>
            <div class="text-end">
              <create-program-menu />
            </div>
          </template>
        </body-header>
      </template>
      <manage-programs-table
        :program-year-id="programYearId"
        v-model:records-count="programsCount"
        @filters-changed="filtersChanged"
      />
    </body-header-container>
  </full-page-container>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import BodyHeaderContainer from "@/components/layouts/BodyHeaderContainer.vue";
import CreateProgramMenu from "@/components/institutions/education-programs/CreateProgramMenu.vue";
import ManageProgramsTable from "@/components/institutions/education-programs/ManageProgramsTable.vue";
import { useInstitutionState } from "@/composables";

interface ManageProgramsProps {
  // Program year to be selected by default, when provided.
  programYearId?: number;
}

defineProps<ManageProgramsProps>();
const { institutionState } = useInstitutionState();
const router = useRouter();
// Total of programs listed for the selected program year and filters.
const programsCount = ref<number>();

/**
 * Keeps the route in sync with the selected program year.
 * @param programYearId currently selected program year id, if any.
 */
const filtersChanged = async (programYearId?: number | null) => {
  await router.replace({
    name: InstitutionRoutesConst.MANAGE_PROGRAMS,
    params: { programYearId },
  });
};
</script>
