<template>
  <full-page-container>
    <template #header>
      <header-navigator
        :title="backTarget.name"
        :route-location="backTarget.to"
        sub-title="View Program"
      />
    </template>
    <template #alerts>
      <institution-restriction-banner
        :scope="InstitutionRestrictionDisplayScope.Program"
        :location-id="locationId"
        :program-id="programId"
        :institution-id="institutionId"
      />
    </template>
    <program-form :read-only="true" :program-id="programId" />
  </full-page-container>
</template>
<script setup lang="ts">
import type { BackTarget } from "@/types";
import { InstitutionRestrictionDisplayScope } from "@/types";
import ProgramForm from "@/components/common/program/ProgramForm.vue";
import InstitutionRestrictionBanner from "@/components/institutions/banners/InstitutionRestrictionBanner.vue";

interface ViewProgramProps {
  locationId: number;
  programId: number;
  institutionId: number;
  backTarget: BackTarget;
}
defineProps<ViewProgramProps>();
</script>
