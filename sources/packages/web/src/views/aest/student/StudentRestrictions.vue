<template>
  <tab-container :enable-card-view="false"
    ><student-restrictions
      :student-id="studentId"
      :can-add-restrictions="true"
      :can-resolve-restriction="true"
      :can-delete-restriction="true"
      @restriction-created="restrictionsChanged"
      @restriction-deleted="restrictionsChanged"
    ></student-restrictions>
    <student-scholastic-standing-limited-history
      ref="scholasticStandingLimitedHistoryComponent"
      :student-id="studentId"
    />
    <check-permission-role :role="Role.StudentViewScholasticStandingHistory">
      <template #="{ notAllowed }">
        <scholastic-standing-history-table
          v-if="!notAllowed"
          :student-id="studentId"
        />
      </template>
    </check-permission-role>
  </tab-container>
</template>

<script setup lang="ts">
import ScholasticStandingHistoryTable from "@/components/aest/students/ScholasticStandingHistoryTable.vue";
import StudentRestrictions from "@/components/common/students/StudentRestrictions.vue";
import StudentScholasticStandingLimitedHistory from "@/components/common/students/StudentScholasticStandingLimitedHistory.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { Role } from "@/types";
import { ref } from "vue";

interface Props {
  studentId: number;
}

defineProps<Props>();

const scholasticStandingLimitedHistoryComponent =
  ref<InstanceType<typeof StudentScholasticStandingLimitedHistory>>();

const restrictionsChanged = () => {
  // Reload the scholastic standing limited history when restrictions are created or deleted.
  scholasticStandingLimitedHistoryComponent.value?.loadSummary();
};
</script>
