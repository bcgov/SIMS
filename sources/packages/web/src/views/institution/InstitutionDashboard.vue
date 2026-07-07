<template>
  <full-page-container :full-width="true" layout-template="centered">
    <template #alerts>
      <institution-restriction-banner />
      <announcement-banner dashboard="institution-dashboard" />
    </template>
    <formio-container form-name="institutionWelcomePage" />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AnnouncementBanner from "@/components/common/AnnouncementBanner.vue";
import InstitutionRestrictionBanner from "@/components/institutions/banners/InstitutionRestrictionBanner.vue";

export default defineComponent({
  components: { AnnouncementBanner, InstitutionRestrictionBanner },
});
</script>
