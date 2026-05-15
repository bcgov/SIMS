<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header title="Disability Profile" />
      </template>
      <student-disability-profile
        :student-id="studentId"
        :allow-update-actions="true"
        :show-legacy-match="true"
      />
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StudentDisabilityProfile from "@/components/common/students/StudentDisabilityProfileProfile.vue";

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
