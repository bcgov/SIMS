<template>
  <full-page-container :full-width="true" layout-template="centered">
    <template #alerts>
      <institution-restriction-banner
        :scope="InstitutionRestrictionDisplayScope.Institution"
      />
      <institution-restriction-banner
        :scope="InstitutionRestrictionDisplayScope.Location"
      />
      <announcement-banner dashboard="institution-dashboard" />
    </template>
    <formio-container form-name="institutionWelcomePage" />
  </full-page-container>
</template>

<script setup lang="ts">
import AnnouncementBanner from "@/components/common/AnnouncementBanner.vue";
import { InstitutionRestrictionDisplayScope } from "@/types";
import InstitutionRestrictionBanner from "@/components/institutions/banners/InstitutionRestrictionBanner.vue";
</script>
