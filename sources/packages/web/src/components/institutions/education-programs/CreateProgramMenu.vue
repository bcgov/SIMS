<template>
  <v-menu>
    <template #activator="{ props: menuProps }">
      <v-btn
        color="primary"
        v-bind="menuProps"
        :disabled="!activeProgramYears.length"
        :loading="loading"
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
import { ref, computed, onMounted } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { EducationProgramService } from "@/services/EducationProgramService";
import type { EducationProgramYearAPIOutDTO } from "@/services/http/dto";
import { useSnackBar } from "@/composables";

const snackBar = useSnackBar();
const loading = ref(false);
/**
 * Program years with education program configurations.
 */
const programYears = ref<EducationProgramYearAPIOutDTO[]>([]);

/**
 * Program years with at least one active education program configuration,
 * available to have new programs created for.
 */
const activeProgramYears = computed(() =>
  programYears.value.filter(
    (programYear) => programYear.hasActiveProgramConfiguration,
  ),
);

onMounted(async () => {
  loading.value = true;
  try {
    programYears.value =
      await EducationProgramService.shared.getProgramYearsList();
  } catch {
    snackBar.error("Unexpected error while loading program years.");
  } finally {
    loading.value = false;
  }
});
</script>
