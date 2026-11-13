<template>
  <v-btn
    v-if="renewalStatus === ProgramRenewalStatus.Available"
    color="primary"
    :to="renewProgramRoute"
    >Renew</v-btn
  >
  <span v-else class="text-body-2 text-medium-emphasis text-no-wrap">
    <v-icon :icon="renewalStatusIcon" size="14" class="mr-1" />
    {{ renewalStatus }}
  </span>
</template>
<script setup lang="ts">
import { computed } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ProgramRenewalStatus } from "@/services/http/dto";

interface ProgramRenewalActionProps {
  /**
   * Program to be renewed.
   */
  programId: number;
  /**
   * Renewal status of the program.
   */
  renewalStatus: ProgramRenewalStatus;
  /**
   * Program year currently selected, used to allow the renew page to
   * navigate back keeping the same program year selected.
   */
  programYearId: number;
}

const props = defineProps<ProgramRenewalActionProps>();

/**
 * Icon displayed along with the renewal status when the program
 * is not available to be renewed.
 */
const renewalStatusIcon = computed(() =>
  props.renewalStatus === ProgramRenewalStatus.Renewed
    ? "fa:fas fa-check"
    : "fa:fas fa-clock",
);

/**
 * Route to the renew program page for the next program year.
 * Used as a link target to allow the page to be opened in a new tab.
 */
const renewProgramRoute = computed<RouteLocationRaw>(() => ({
  name: InstitutionRoutesConst.RENEW_PROGRAM,
  params: {
    programId: props.programId,
  },
  // Allows the renew page to navigate back keeping the current program year selected.
  query: {
    programYearId: props.programYearId,
  },
}));
</script>
