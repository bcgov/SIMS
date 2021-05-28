<template>
  <v-container>
    <h5 class="color-grey">Manage Users</h5>
    <h2>User Summary</h2>
    <v-sheet elevation="1" class="mx-auto">
      <v-container>
        <v-row>
          <v-col cols="8">
            <h2 class="color-blue">All Users ({{ users.length }})</h2>
          </v-col>
          <v-col cols="4">
            <v-btn class="float-right" @click="openNewUserModal()">
              Add New User
              <v-icon right> mdi-plus-circle </v-icon>
            </v-btn>
            <!-- Add user -->
            <AddInstitutionUser
              :userType="userType"
              :showAddUser="showAddUser"
              @updateShowAddInstitutionModal="updateShowAddInstitutionModal"
              @getAllInstitutionUsers="getAllInstitutionUsers"
            />
          </v-col>
        </v-row>
        <DataTable :autoLayout="true" :value="users">
          <Column field="displayName" header="Name"></Column>
          <Column field="email" header="Email"></Column>
          <Column field="userType" header="User Type"></Column>
          <Column field="role" header="Role"></Column>
          <Column field="location" header="Location"></Column>
          <Column field="status" header="Status"></Column>
          <Column field="" header=""
            ><template #body="slotProps">
              <v-btn plain>
                <v-icon
                  right
                  class="mr-2"
                  @click="editInstitutionUser(slotProps.data.userName)"
                >
                  mdi-pencil
                </v-icon>
              </v-btn>
            </template>
          </Column>
        </DataTable>
        <!-- edit user -->
        <EditInstitutionUser
          :userType="userType"
          :showEditUser="showEditUser"
          :userData="userData"
          @updateShowEditInstitutionModal="updateShowEditInstitutionModal"
          @getAllInstitutionUsers="getAllInstitutionUsers"
        />
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { InstitutionService } from "../../services/InstitutionService";
import { InstitutionUserViewModel } from "../../types";
import AddInstitutionUser from "./modals/AddInstitutionUserModal.vue";
import EditInstitutionUser from "./modals/EditInstitutionUserModal.vue";
import { useToast } from "primevue/usetoast";

export default {
  components: { DataTable, Column, AddInstitutionUser, EditInstitutionUser },
  setup() {
    const userData = ref({});
    const toast = useToast();
    const showAddUser = ref(false);
    const showEditUser = ref(false);
    const users = ref([] as InstitutionUserViewModel[]);
    const userRoleType = ref();
    const userType = ref();
    const openNewUserModal = () => {
      showAddUser.value = true;
    };
    const getAllInstitutionUsers = async () => {
      const respUsers = await InstitutionService.shared.users();
      users.value = respUsers;
    };
    const updateShowAddInstitutionModal = () => {
      showAddUser.value = !showAddUser.value;
    };
    const updateShowEditInstitutionModal = () => {
      showEditUser.value = !showEditUser.value;
    };
    const editInstitutionUser = async (institutionUserName: string) => {
      try {
        const respUser = await InstitutionService.shared.getInstitutionLocationUserDetails(
          institutionUserName
        );
        showEditUser.value = true;

        userData.value = respUser?.data;
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Unexpected error",
          detail: "An error happened during the fetch process.",
          life: 5000,
        });
      }
    };
    onMounted(async () => {
      // Call Service
      getAllInstitutionUsers();
      // Get User type and Role
      userRoleType.value = await InstitutionService.shared.getUserTypeAndRoles();
      userType.value = userRoleType.value?.userTypes
        ? userRoleType.value.userTypes.map((el: string) =>
            el !== "admin" ? { name: el, code: el } : null
          )
        : [];
    });
    return {
      users,
      openNewUserModal,
      showAddUser,
      showEditUser,
      updateShowAddInstitutionModal,
      getAllInstitutionUsers,
      editInstitutionUser,
      userData,
      updateShowEditInstitutionModal,
      userType,
    };
  },
};
</script>

<style></style>
