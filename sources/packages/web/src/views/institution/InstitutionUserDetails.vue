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
      <Column>
        <template #body="slotProps">
          <Button
            :disabled="slotProps.data.disableRemove"
            label="Remove"
            icon="pi pi-trash"
            @click="removeUser(slotProps.data.id)"
          />
        </template>
      </Column>
    </DataTable>
  </v-container>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useToast } from "primevue/usetoast";
import { InstitutionService } from "../../services/InstitutionService";
import { InstitutionUserViewModel } from "../../types";
export default {
  components: {
    DataTable,
    Column,
  },
  setup() {
    const toast = useToast();
    const users = ref([] as InstitutionUserViewModel[]);
    const removeUser = async (userId: number) => {
      console.log(`${userId}`);
      try {
        await InstitutionService.shared.removeUser(userId);
        toast.add({
          severity: "success",
          summary: "Removed!",
          detail: "Institution user successfully removed!",
          life: 5000,
        });
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Unexpected error",
          detail: "An error happened during the remove process.",
          life: 5000,
        });
      }
    };
    onMounted(async () => {
      // Call Service
      const respUsers = await InstitutionService.shared.users();
      users.value = respUsers;
    });
    return {
      users,
      removeUser,
    };
  },
};
</script>

<style></style>
