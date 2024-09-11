<template>
  <full-page-container
    :full-width="true"
    layout-template="centered"
    data-cy="institutionWelcomePage"
  >
    <template #alerts>
      <announcement-banner dashboard="InstitutionDashboard" />
    </template>
    <formio-container formName="institutionWelcomePage" />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AnnouncementBanner from "@/components/common/AnnouncementBanner.vue";

export default defineComponent({
  components: { AnnouncementBanner },
});
</script>
