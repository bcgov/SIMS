<template>
  <tab-container><student-notes :studentId="studentId" /></tab-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import StudentNotes from "@/components/common/notes/StudentNotes.vue";
export default defineComponent({
  components: { StudentNotes },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
});
</script>
