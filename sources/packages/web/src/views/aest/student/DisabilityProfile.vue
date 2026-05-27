<template>
  <tab-container :enable-card-view="false">
    <student-disability-profile
      :student-id="studentId"
      :allow-update-actions="true"
      :show-legacy-match="true"
    />
  </tab-container>
</template>

<script setup lang="ts">
import StudentDisabilityProfile from "@/components/common/students/StudentDisabilityProfile.vue";
defineProps<{ studentId: number }>();
</script>
