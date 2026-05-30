<template>
  <full-page-container :full-width="false">
    <template #header>
      <header-navigator
        title="Disability Profile"
        sub-title="Student Disabilities"
        :route-location="{
          name: AESTRoutesConst.STUDENT_DISABILITY_PROFILE,
          params: {
            studentId: props.studentId,
          },
        }"
      />
    </template>
    <body-header-container :enable-card-view="false">
      <template #header>
        <body-header
          title="Disability Profile"
          sub-title="Historical Student Disability"
        >
        </body-header>
      </template>
    </body-header-container>
    <content-group>
      <student-disability-disabilities
        :disability-profile-id="props.disabilityProfileId"
        :read-only="true"
      />
    </content-group>
  </full-page-container>
</template>

<script setup lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import StudentDisabilityDisabilities from "@/components/common/students/StudentDisabilityDisabilities.vue";

interface Props {
  studentId: number;
  disabilityProfileId: number;
}
const props = defineProps<Props>();
</script>
