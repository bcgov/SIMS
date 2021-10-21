<template>
  <v-container>
    <h5 class="text-muted">
      <a @click="goBack()">
        <v-icon left> mdi-arrow-left </v-icon> Back to Students</a
      >
    </h5>
    <h2 class="color-blue">Student</h2>
    <h2 class="mt-2">Student Applications are Progress</h2>
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
export default {
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const router = useRouter();
    const goBack = () => {
      router.push({
        name: AESTRoutesConst.SEARCH_STUDENTS,
      });
    };
    return {
      goBack,
    };
  },
};
</script>
