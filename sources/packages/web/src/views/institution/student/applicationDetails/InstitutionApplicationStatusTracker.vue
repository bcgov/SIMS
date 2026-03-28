<template>
  <full-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Student applications"
        :route-location="{
          name: InstitutionRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        sub-title="Application Status"
      />
      <application-header-title :application-id="applicationId" />
    </template>
    <application-progress-bar :application-id="applicationId" />
  </full-page-container>
</template>

<script setup lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";
import ApplicationProgressBar from "@/components/common/applicationTracker/ApplicationProgressBar.vue";

defineProps<{
  studentId: number;
  applicationId: number;
}>();
</script>
