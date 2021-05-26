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
            <Dialog
              header="Add User to Account"
              v-model:visible="showAddUser"
              :modal="true"
              :style="{ width: '50vw' }"
            >
              <v-divider></v-divider>
              <v-sheet color="white" elevation="1">
                <v-container>
                  <form>
                    <p><b>Select a user to add to this location below.</b></p>
                    <v-row
                      ><v-col>
                        <span class="form-text text-muted mb-2">
                          <b>User Name </b></span
                        >
                        <Dropdown
                          v-model="selectUser"
                          :options="usersList"
                          optionLabel="name"
                          placeholder="Select a User"
                          :filter="true"
                          filterPlaceholder="Find User"
                          :style="{ width: '20vw' }"
                          :class="invalidName ? 'p-invalid' : ''"
                        />
                      </v-col>
                      <v-col v-if="selectUser.name">
                        <span class="form-text text-muted mb-2">
                          <b>Is this User an Admin?</b><br />
                          <b>
                            Selected: <span v-if="isAdmin"> Yes </span
                            ><span v-else> No </span></b
                          ></span
                        >
                        <InputSwitch v-model="isAdmin" />
                      </v-col>
                    </v-row>
                    <span v-if="!isAdmin && selectUser.name">
                      <v-divider></v-divider>
                      <h4 class="color-blue">Location Based Access</h4>
                      <v-row
                        ><v-col>
                          <span class="form-text text-muted mb-2">
                            <b>Locations</b>
                          </span> </v-col
                        ><v-col>
                          <span class="form-text text-muted mb-2">
                            <b>User Type</b>
                          </span>
                        </v-col>
                      </v-row>
                      <v-row
                        v-for="location in institutionLocationList"
                        :key="location"
                        ><v-col>
                          <span>{{ location?.name }} <br /></span>
                          <span>
                            <span
                              >{{ location?.data?.address?.addressLine1 }},
                            </span>
                            <span>{{ location?.data?.address?.city }}, </span>
                            <span>{{ location?.data?.address?.province }}</span>
                            <br />
                          </span>
                        </v-col>
                        <v-col>
                          <Dropdown
                            v-model="location.user_type"
                            :options="userType"
                            optionLabel="name"
                            placeholder="Select a User Role"
                            :style="{ width: '25vw' }"
                            :class="invalidUserType ? 'p-invalid' : ''"
                          />
                        </v-col> </v-row
                    ></span>
                  </form>
                </v-container>
              </v-sheet>
              <template #footer>
                <v-btn color="primary" outlined @click="closeAddUser()">
                  Cancel
                </v-btn>
                <v-btn color="primary" @click="submitAddUser()">
                  Add User
                  <v-icon right>mdi-account </v-icon>
                </v-btn>
              </template>
            </Dialog>
          </v-col>
        </v-row>
        <DataTable autoLayout="true" :value="users">
          <Column field="displayName" header="Name"></Column>
          <Column field="email" header="Email"></Column>
          <Column field="userType" header="User Type"></Column>
          <Column field="role" header="Role"></Column>
          <Column field="location" header="Location"></Column>
          <Column field="status" header="Status"></Column>
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
import { UserService } from "../../services/UserService";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import InputSwitch from "primevue/inputswitch";
import { useToast } from "primevue/usetoast";
import { InstitutionUserViewModel } from "../../types";

export default {
  components: { Dialog, Dropdown, InputSwitch, DataTable, Column },
  setup() {
    const toast = useToast();
    const isAdmin = ref(false);
    const invalidName = ref(false);
    const invalidUserType = ref(false);
    const users = ref([] as InstitutionUserViewModel[]);
    const showAddUser = ref(false);
    const selectUser = ref({ name: "", code: "" });
    const openNewUserModal = () => {
      showAddUser.value = true;
    };
    const usersList = ref();
    const institutionLocationList = ref();
    const getInstitutionLocationList = async () => {
      //Get Institution Locations
      institutionLocationList.value = await InstitutionService.shared.getAllInstitutionLocations();
    };
    const userRoleType = ref();
    const userType = ref();
    const closeAddUser = () => {
      showAddUser.value = false;
      selectUser.value = { name: "", code: "" };
      isAdmin.value = false;
      invalidName.value = false;
      getInstitutionLocationList();
    };
    const preparPayload = () => {
      let payLoad;
      if (isAdmin.value == true) {
        payLoad = {
          userId: selectUser.value.code,
          userType: "admin",
        };
      } else {
        payLoad = {
          userId: selectUser.value.code,
          location: institutionLocationList.value
            .map((el: any) => {
              if (el.user_type?.code) {
                return {
                  locationId: el.id,
                  userType: el.user_type?.code,
                };
              }
            })
            .filter((el: any) => el),
        };
        if (payLoad.location.length === 0) {
          invalidUserType.value = true;
        }
      }
      return payLoad;
    };
    const submitAddUser = async () => {
      invalidName.value = false;
      invalidUserType.value = false;
      const payLoad = preparPayload();
      if (selectUser.value.code && !invalidUserType.value) {
        try {
          await InstitutionService.shared.createUser(payLoad),
            toast.add({
              severity: "success",
              summary: `${selectUser.value.name} Successfully Added!`,
              detail: " Successfully!",
              life: 5000,
            });
        } catch (excp) {
          toast.add({
            severity: "error",
            summary: "Unexpected error",
            detail: "An error happened during the create process.",
            life: 5000,
          });
        }
        closeAddUser();
      } else {
        if (!selectUser.value.code) {
          invalidName.value = true;
        }
      }
    };

    onMounted(async () => {
      // call institution location
      getInstitutionLocationList();
      // Call Service
      const respUsers = await InstitutionService.shared.users();
      users.value = respUsers;
      //  Get All users from Bceid;
      const bceidUsers = await UserService.shared.getBCeIDAccounts();
      usersList.value = bceidUsers
        ? bceidUsers?.accounts.map((el: any) => ({
            name: el.displayName,
            code: el.userId,
          }))
        : [];
      // Get User type and Role
      userRoleType.value = await InstitutionService.shared.getUserTypeAndRoles();
      userType.value = userRoleType.value?.userTypes
        ? userRoleType.value.userTypes.map((el: string) =>
            el !== "admin" ? { name: el, code: el } : null,
          )
        : [];
    });
    return {
      users,
      openNewUserModal,
      showAddUser,
      usersList,
      selectUser,
      institutionLocationList,
      userType,
      closeAddUser,
      submitAddUser,
      isAdmin,
      invalidName,
      invalidUserType,
    };
  },
};
</script>

<style></style>
