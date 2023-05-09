<template>
  <body-header-container>
    <tab-container
      ><student-notes :studentId="studentId" :allowAddingNotes="true"
    /></tab-container>
  </body-header-container>
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
  setup() {
    return {
      StudentNotes,
    };
  },
});
</script>
