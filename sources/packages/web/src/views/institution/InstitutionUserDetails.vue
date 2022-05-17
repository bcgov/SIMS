<template>
  <div class="p-m-4">
    <HeaderNavigator title="Manage Users" subTitle="User Summary" />
    <v-container>
      <v-card class="mt-6 py-4 px-4">
        <InstitutionUserSummary />
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import InstitutionUserSummary from "@/components/common/InstitutionUserSummary.vue";

export default {
  components: {
    InstitutionUserSummary,
  },
};
</script>
