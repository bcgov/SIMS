<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <StudentApplications :studentId="studentId" />
    </div>
  </v-card>
</template>

<script lang="ts">
import StudentApplications from "@/components/aest/StudentApplications.vue";

export default {
  components: { StudentApplications },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
};
</script>
