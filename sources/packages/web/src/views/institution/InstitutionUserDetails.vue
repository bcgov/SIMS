<template>
  <div class="p-m-4">
    <HeaderNavigator :title="'Manage Users'" :subTitle="'User Summary'" />
    <v-container>
      <v-card class="mt-6 py-4 px-4">
        <InstitutionUserSummary :clientType="ClientIdType.Institution" />
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import InstitutionUserSummary from "@/components/aest/InstitutionUserSummary.vue";
import { ClientIdType } from "@/types";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";

export default {
  components: {
    HeaderNavigator,
    InstitutionUserSummary,
  },
  setup() {
    return {
      ClientIdType,
    };
  },
};
</script>

<style></style>
