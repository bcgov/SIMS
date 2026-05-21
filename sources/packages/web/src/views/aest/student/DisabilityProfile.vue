<template>
  <tab-container :enable-card-view="false">
    <student-disability-profile
      :student-id="studentId"
      :allow-update-actions="true"
      :show-legacy-match="true"
    />
  </tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StudentDisabilityProfile from "@/components/common/students/StudentDisabilityProfile.vue";

export default defineComponent({
  components: { StudentDisabilityProfile },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
});
</script>
