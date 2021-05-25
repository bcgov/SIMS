<template>
  <v-container>
    <h1>Institution User Details</h1>
    <DataTable :value="users">
      <Column field="displayName" header="Name"></Column>
      <Column field="email" header="Email"></Column>
      <Column field="userType" header="User Type"></Column>
      <Column field="role" header="Role"></Column>
      <Column field="location" header="Location"></Column>
      <Column field="status" header="Status"></Column>
    </DataTable>
  </v-container>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { InstitutionService } from "../../services/InstitutionService";
import { InstitutionUserViewModel } from "../../types";
export default {
  components: {
    DataTable,
    Column,
  },
  setup() {
    const users = ref([] as InstitutionUserViewModel[]);
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
