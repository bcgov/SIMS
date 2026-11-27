<template>
  <v-btn v-if="canRenew" color="primary" :to="renewProgramRoute">Renew</v-btn>
  <span v-else class="text-body-2 text-medium-emphasis text-no-wrap">
    <v-icon
      v-if="renewalStatusIcon"
      :icon="renewalStatusIcon"
      size="14"
      class="mr-1"
    />
    {{ renewalStatus }}
  </span>
</template>
<script setup lang="ts">
import { computed } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ProgramRenewalStatus } from "@/services/http/dto";
import { useInstitutionAuth } from "@/composables";

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
   * Indicates if the program is currently active.
   */
  isActive: boolean;
  /**
   * Program year currently selected, used to allow the renew page to
   * navigate back keeping the same program year selected.
   */
  programYearId: number;
}

const props = defineProps<ProgramRenewalActionProps>();
const { canModifyPrograms } = useInstitutionAuth();

/**
 * Indicates if the renew action is displayed, which requires the program
 * to be available for renewal and the user to be allowed to modify programs.
 * Otherwise, only the renewal status is displayed.
 */
const canRenew = computed(
  () =>
    props.renewalStatus === ProgramRenewalStatus.Available &&
    canModifyPrograms.value,
);

/**
 * Icon displayed along with the renewal status when the renew action
 * is not displayed.
 * Inactive programs not renewed cannot be renewed, hence the "X" icon
 * instead of the one used while the renewal is not yet available.
 */
const renewalStatusIcon = computed(() => {
  switch (props.renewalStatus) {
    case ProgramRenewalStatus.Renewed:
      return "fa:fas fa-check";
    case ProgramRenewalStatus.Available:
      return "fa:fas fa-rotate";
    case ProgramRenewalStatus.NotAvailable:
      return props.isActive ? "fa:fas fa-clock" : "fa:fas fa-xmark";
    default:
      return undefined;
  }
});

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
