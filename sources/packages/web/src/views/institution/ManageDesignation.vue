<template>
  <div class="p-m-4">
    <HeaderNavigator
      :title="'Manage Desgination'"
      :subTitle="'Desgination In Progress'"
    />
    <v-container> </v-container>
  </div>
</template>

<script lang="ts">
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
export default {
  components: {
    HeaderNavigator,
  },
};
</script>
