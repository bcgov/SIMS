<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <StudentApplications
        :studentId="studentId"
        :clientType="ClientIdType.AEST"
      />
    </div>
  </v-card>
</template>

<script lang="ts">
import StudentApplications from "@/components/aest/StudentApplications.vue";
import { ClientIdType } from "@/types";

export default {
  components: { StudentApplications },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return { ClientIdType };
  },
};
</script>
