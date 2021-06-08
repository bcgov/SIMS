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

            <!-- edit user -->
            <EditInstitutionUser
              :userType="userType"
              :showEditUser="showEditUser"
              :institutionUserName="institutionUserName"
              @updateShowEditInstitutionModal="updateShowEditInstitutionModal"
              @getAllInstitutionUsers="getAllInstitutionUsers"
            />
          </v-col>
        </v-row>
        <DataTable autoLayout="true" :value="users">
          <Column field="displayName" header="Name"></Column>
          <Column field="email" header="Email"></Column>
          <Column field="userType" header="User Type"></Column>
          <Column field="role" header="Role"></Column>
          <Column field="location" header="Location"></Column>
          <Column field="isActive" header="Status"
            ><template #body="slotProps">
              <Chip
                v-if="slotProps.data.isActive"
                label="Active"
                class="p-mr-2 p-mb-2 bg-success text-white"
              /><Chip
                v-else
                label="Inactive"
                class="p-mr-2 p-mb-2 bg-danger text-white"
              /> </template
          ></Column>
          <Column field="" header="Actions"
            ><template #body="slotProps">
              <span v-if="slotProps.data.userName !== logginedUserDetails?.userName">
                <v-btn plain>
                  <v-icon
                    v-if="slotProps.data.isActive"
                    right
                    class="mr-2"
                    @click="editInstitutionUser(slotProps.data.userName)"
                    v-tooltip="'Edit User'"
                  >
                    mdi-pencil </v-icon
                  ><v-icon
                    v-else
                    right
                    class="mr-2"
                    v-tooltip="'Disabled User Cannot Be Edited'"
                  >
                    mdi-pencil
                  </v-icon>
                </v-btn>
                <InputSwitch
                  v-model="slotProps.data.isActive"
                  v-tooltip="slotProps.data.isActive ? 'Disable User' : 'Enable User'"
                  @change="updateUserStatus(slotProps.data)"
                />
              </span>
            </template>
          </Column>
        </DataTable>
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { InstitutionService } from "../../services/InstitutionService";
import { InstitutionUserViewModel, ApplicationToken } from "../../types";
import AddInstitutionUser from "@/components/institutions/modals/AddInstitutionUserModal.vue";
import EditInstitutionUser from "@/components/institutions/modals/EditInstitutionUserModal.vue";
import Chip from "primevue/chip";
import InputSwitch from "primevue/inputswitch";
import Tooltip from "primevue/tooltip";
import { useToast } from "primevue/usetoast";
import { AppConfigService } from "../../services/AppConfigService";

export default {
  components: {
    DataTable,
    Column,
    AddInstitutionUser,
    EditInstitutionUser,
    Chip,
    InputSwitch,
  },
  directives: {
    tooltip: Tooltip,
  },
  setup() {
    const toast = useToast();
    const logginedUserDetails = ref(
      AppConfigService.shared.authService?.tokenParsed as ApplicationToken
    );
    const showAddUser = ref(false);
    const showEditUser = ref(false);
    const users = ref([] as InstitutionUserViewModel[]);
    const userRoleType = ref();
    const userType = ref();
    const openNewUserModal = () => {
      showAddUser.value = true;
    };
    const institutionUserName = ref();
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
    const editInstitutionUser = async (userName: string) => {
      institutionUserName.value = userName;
      showEditUser.value = true;
    };
    const updateUserStatus = async (userDetails: InstitutionUserViewModel) => {
      try {
        await InstitutionService.shared.updateUserStatus(
          userDetails.userName,
          userDetails.isActive
        );
        await getAllInstitutionUsers();
        toast.add({
          severity: "success",
          summary: `${userDetails.displayName} is ${
            userDetails.isActive ? "Enabled" : "Disabled"
          }`,
          detail: " Successfully!",
          life: 5000,
        });
      } catch (excp) {
        toast.add({
          severity: "error",
          summary: "Unexpected error",
          detail: "An error happened during the update process.",
          life: 5000,
        });
      }
    };
    onMounted(async () => {
      // Call Service
      await getAllInstitutionUsers();
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
      updateShowEditInstitutionModal,
      userType,
      institutionUserName,
      updateUserStatus,
      logginedUserDetails,
    };
  },
};
</script>

<style></style>
