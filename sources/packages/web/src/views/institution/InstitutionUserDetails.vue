<template>
  <h1>Institution User Details</h1>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { InstitutionService } from "../../services/InstitutionService";
export default {
  setup() {
    const users = ref([]);
    onMounted(async () => {
      // Call Service
      const respUsers = await InstitutionService.shared.users();
      users.value = respUsers;
    });
    return {
      users,
    };
  },
};
</script>

<style></style>
