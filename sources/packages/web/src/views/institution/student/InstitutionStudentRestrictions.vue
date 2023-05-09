<template>
  <tab-container
    ><student-restrictions :studentId="studentId"></student-restrictions
  ></tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StudentRestrictions from "@/components/common/students/StudentRestrictions.vue";

export default defineComponent({
  components: { StudentRestrictions },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
});
</script>
