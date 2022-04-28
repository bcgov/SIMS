<template>
  <!-- Add user -->
  <Dialog
    v-if="showAddUser"
    header="Add User to Account"
    :visible="display"
    :modal="true"
    :style="{ width: '50vw' }"
    :closable="false"
  >
    <v-divider></v-divider>
    <v-sheet color="white" elevation="1">
      <v-container>
        <form>
          <p><strong>Select a user to add to the locations below.</strong></p>
          <v-row
            ><v-col>
              <span class="form-text text-muted mb-2">
                <strong>User Name </strong></span
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
                <strong>Is this User an Admin?</strong><br />
                <strong>
                  Selected: <span v-if="isAdmin"> Yes </span
                  ><span v-else> No </span></strong
                ></span
              >
              <InputSwitch v-model="isAdmin" />
            </v-col>
            <v-col v-if="isAdmin">
              <span class="form-text text-muted mb-2 font-weight-bold"
                >Select Admin Role</span
              >
              <!-- TODO: remove inline styles when moving to Vuetify component. -->
              <Dropdown
                v-model="selectedAdminRole"
                :options="adminRoles"
                :style="{ width: '20vw' }"
                optionLabel="name"
              />
            </v-col>
          </v-row>
          <span v-if="!isAdmin && selectUser.name">
            <v-divider></v-divider>
            <h4 class="color-blue">Location Based Access</h4>
            <v-row v-if="!institutionLocationList.length">
              <Message :closable="false"
                >Institution locations need to be added first inorder to add a
                non-admin users to institution</Message
              >
            </v-row>
            <span v-else>
              <v-row
                ><v-col>
                  <span class="form-text text-muted mb-2">
                    <strong>Locations</strong>
                  </span> </v-col
                ><v-col>
                  <span class="form-text text-muted mb-2">
                    <strong>User Type</strong>
                  </span>
                </v-col>
              </v-row>
              <v-row v-for="location in institutionLocationList" :key="location"
                ><v-col>
                  <span>{{ location?.name }}</span
                  ><br />
                  <span>
                    <span>{{ location?.data?.address?.addressLine1 }}, </span>
                    <span>{{ location?.data?.address?.city }}, </span>
                    <span>{{ location?.data?.address?.province }}</span>
                    <br />
                  </span>
                </v-col>
                <v-col>
                  <Dropdown
                    v-model="location.userType"
                    :options="userType"
                    optionLabel="name"
                    placeholder="Select a User Role"
                    :style="{ width: '25vw' }"
                    :class="invalidUserType ? 'p-invalid' : ''"
                  />
                </v-col>
              </v-row>
            </span>
          </span>
        </form>
      </v-container>
    </v-sheet>
    <template #footer>
      <v-btn color="primary" variant="outlined" @click="closeAddUser()">
        Cancel
      </v-btn>
      <v-btn color="primary" @click="submitAddUser()">
        <v-icon size="25">mdi-account</v-icon>
        Add User
      </v-btn>
    </template>
  </Dialog>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import { UserService } from "@/services/UserService";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import InputSwitch from "primevue/inputswitch";
import { useToastMessage } from "@/composables";
import {
  InstitutionUserAuthDetails,
  LEGAL_SIGNING_AUTHORITY_EXIST,
  LEGAL_SIGNING_AUTHORITY_MSG,
} from "@/types";
import { UserRoleOptionAPIOutDTO } from "@/services/http/dto";
import Message from "primevue/message";

export default {
  components: { Dialog, Dropdown, InputSwitch, Message },
  props: {
    showAddUser: {
      type: Boolean,
      default: false,
    },
    userType: {
      type: Array,
      default() {
        return [];
      },
    },
    adminRoles: {
      type: Array,
      required: true,
    },
  },
  emits: ["updateShowAddInstitutionModal", "getAllInstitutionUsers"],
  setup(props: any, context: any) {
    const toast = useToastMessage();
    const isAdmin = ref(false);
    const invalidName = ref(false);
    const invalidUserType = ref(false);
    const display = ref(true);
    const selectUser = ref({} as UserRoleOptionAPIOutDTO);
    const usersList = ref();
    const institutionLocationList = ref();
    const payLoad = ref({} as InstitutionUserAuthDetails);
    const selectedAdminRole = ref({
      name: "admin",
      code: "admin",
    } as UserRoleOptionAPIOutDTO);
    const getInstitutionLocationList = async () => {
      //Get Institution Locations
      institutionLocationList.value =
        await InstitutionService.shared.getAllInstitutionLocations();
    };

    const closeAddUser = async () => {
      selectUser.value = { name: "", code: "" };
      isAdmin.value = false;
      invalidName.value = false;
      await getInstitutionLocationList();
      context.emit("updateShowAddInstitutionModal");
    };
    const submitAddUser = async () => {
      invalidName.value = false;
      invalidUserType.value = false;
      payLoad.value = await InstitutionService.shared.prepareAddUserPayload(
        isAdmin.value,
        selectUser.value,
        selectedAdminRole.value?.code,
        institutionLocationList.value,
      );
      if (
        selectUser?.value?.code &&
        ((payLoad.value &&
          payLoad.value?.location &&
          payLoad.value?.location?.length) ||
          isAdmin.value)
      ) {
        try {
          await InstitutionService.shared.createUser(payLoad.value);
          toast.success(
            "User Added",
            `${selectUser.value.name} Successfully Added!`,
          );
        } catch (excp) {
          const errorMessage =
            excp === LEGAL_SIGNING_AUTHORITY_EXIST
              ? LEGAL_SIGNING_AUTHORITY_MSG
              : "An error happened during the update process.";
          toast.error("Unexpected error", errorMessage);
        }
        closeAddUser();
        context.emit("getAllInstitutionUsers");
      } else {
        if (!selectUser.value.code) {
          invalidName.value = true;
        }
        if (payLoad.value?.location?.length === 0) {
          invalidUserType.value = true;
        }
      }
    };

    onMounted(async () => {
      // call institution location
      await getInstitutionLocationList();
      //  Get All users from Bceid;
      const bceidUsers = await UserService.shared.getBCeIDAccounts();
      usersList.value = bceidUsers
        ? bceidUsers?.accounts.map((el: any) => ({
            name: el.displayName,
            code: el.userId,
            id: el.guid,
          }))
        : [];
    });
    return {
      usersList,
      selectUser,
      institutionLocationList,
      closeAddUser,
      submitAddUser,
      isAdmin,
      invalidName,
      invalidUserType,
      display,
      selectedAdminRole,
    };
  },
};
</script>
