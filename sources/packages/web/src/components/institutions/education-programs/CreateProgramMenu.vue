<template>
  <v-menu :disabled="!canModifyPrograms">
    <template #activator="{ props: menuProps }">
      <v-btn
        color="primary"
        v-bind="menuProps"
        :disabled="!activeProgramYears.length"
        :loading="loadingEducationProgramYears"
        prepend-icon="fa:fa fa-plus-circle"
        append-icon="mdi-menu-down"
      >
        Create program
      </v-btn>
    </template>
    <v-list
      active-class="active-list-item"
      density="compact"
      bg-color="default"
      color="primary"
    >
      <v-list-item
        v-for="programYear in activeProgramYears"
        :key="programYear.id"
        :value="programYear.id"
        :to="{
          name: InstitutionRoutesConst.CREATE_PROGRAM,
          params: { programYearId: programYear.id },
        }"
      >
        <v-list-item-title>
          <span class="label-bold">{{ programYear.description }}</span>
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useEducationProgramYears, useInstitutionAuth } from "@/composables";

const { educationProgramYears, loadingEducationProgramYears } =
  useEducationProgramYears();
// Read-only users are not allowed to create programs.
const { canModifyPrograms } = useInstitutionAuth();

/**
 * Program years with at least one active education program configuration,
 * available to have new programs created for.
 */
const activeProgramYears = computed(() =>
  educationProgramYears.value.filter(
    (programYear) => programYear.hasActiveProgramConfiguration,
  ),
);
</script>
