<template>
  <!-- Edit user -->
  <Dialog
    v-if="showEditUser"
    header="Edit User Permissions"
    v-model:visible="display"
    :modal="true"
    :style="{ width: '50vw' }"
    :closable="false"
  >
    <v-divider></v-divider>
    <v-sheet color="white" elevation="1">
      <v-container>
        <form>
          <v-row>
            <v-col>
              <span class="form-text text-muted mb-2"><b>User Name </b></span>
              <span class="form-text text-muted mb-2">
                {{ userData?.user?.firstName }} {{ userData?.user?.lastName }}
              </span>
            </v-col>
            <v-col>
              <span class="form-text text-muted mb-2">
                <b>Is this User an Admin?</b><br />
                <b>
                  Selected:<span v-if="isAdmin"> Yes </span><span v-else> No </span>
                </b>
              </span>
              <InputSwitch v-model="isAdmin" />
            </v-col>
          </v-row>
          <span v-if="!isAdmin">
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
            <v-row v-for="location in institutionLocationList" :key="location"
              ><v-col>
                <span>{{ location?.name }} <br /></span>
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
              </v-col> </v-row
          ></span>
        </form>
      </v-container>
    </v-sheet>
    <template #footer>
      <v-btn color="primary" outlined @click="closeEditUser()"> Cancel </v-btn>
      <v-btn color="primary" @click="submitAddUser()">
        Add User
        <v-icon right>mdi-account </v-icon>
      </v-btn>
    </template>
  </Dialog>
</template>

<script lang="ts">
/* eslint-disable */
import { ref, onMounted, watch } from "vue";
import { InstitutionService } from "../../../services/InstitutionService";
import { UserService } from "../../../services/UserService";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import InputSwitch from "primevue/inputswitch";
import { useToast } from "primevue/usetoast";
import { InstitutionUserWithUserType } from "../../../types";

export default {
  components: { Dialog, Dropdown, InputSwitch },
  props: {
    showEditUser: {
      type: Boolean,
      default: false,
    },
    userData: {
      type: Object,
      default: {},
    },
    userType: {
      type: Array,
      default: [],
    },
  },
  emits: ["updateShowEditInstitutionModal", "refreshAllInstitutionUsers"],
  setup(props: any, context: any) {
    const isAdmin = ref(false);
    const toast = useToast();
    const invalidUserType = ref(false);
    const display = ref(true);
    const institutionLocationList = ref([] as InstitutionUserWithUserType[]);
    const closeEditUser = () => {
      context.emit("updateShowEditInstitutionModal");
    };
    const checkIsAdmin = async () => {
      isAdmin.value =
        (await props?.userData?.authorizations.filter(
          (el: any) => el?.authType?.type == "admin"
        ).length) < 1
          ? false
          : true;
    };
    const getAndSetAllLocations = async () => {
      institutionLocationList.value = [];
      const allLocations = await InstitutionService.shared.getAllInstitutionLocations();
      for (const eachLocation of allLocations) {
        let selectedLocation = false;
        let proceesedLocation = {};
        for (const assignedLocation of props?.userData?.authorizations) {
          if (eachLocation.id === assignedLocation.location?.id) {
            selectedLocation = true;
            proceesedLocation = {
              ...assignedLocation.location,
              userType: {
                name: assignedLocation?.authType?.type,
                code: assignedLocation?.authType?.type,
              },
            };
          }
        }
        if (!selectedLocation) {
          proceesedLocation = {
            ...eachLocation,
            userType: {
              name: null,
              code: null,
            },
          };
        }
        if (proceesedLocation) {
          institutionLocationList.value.push(proceesedLocation);
        }
      }
    };
    onMounted(async () => {
      // call institution location
    });
    watch(
      () => props.userData,
      (currValue, preValue) => {
        institutionLocationList.value = [];
        checkIsAdmin();
        getAndSetAllLocations();
      }
    );
    watch(
      () => isAdmin.value,
      (currValue, preValue) => {
        getAndSetAllLocations();
      }
    );
    return {
      institutionLocationList,
      invalidUserType,
      display,
      closeEditUser,
      isAdmin,
    };
  },
};
</script>

<style></style>
