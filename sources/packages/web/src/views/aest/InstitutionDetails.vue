<template>
  <v-container>
    <h5 class="text-muted">
      <a @click="goBack()">
        <v-icon left> mdi-arrow-left </v-icon> Back to Institution</a
      >
    </h5>
    <h2 class="color-blue">Institution</h2>
    <h2 class="mt-2">Institution Details page is in Progress</h2>
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
export default {
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const router = useRouter();
    const goBack = () => {
      router.push({
        name: AESTRoutesConst.SEARCH_INSTITUTIONS,
      });
    };
    return {
      goBack,
    };
  },
};
</script>
