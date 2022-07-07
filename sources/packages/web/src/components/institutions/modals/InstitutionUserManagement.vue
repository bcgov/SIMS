<!-- Shared modal content for modals AddInstitutionUserModal and EditInstitutionUserModal -->
<template>
  <v-form ref="userForm">
    <content-group>
      <v-row align="center" class="mx-1">
        <!-- This slot holds the BCeID basic(plain text)/business(dropdown) and readonly views(plain readonly text input). -->
        <slot name="user-name" :formModel="formModel" />
        <v-switch
          label="Admin"
          color="primary"
          inset
          class="mr-3"
          v-model="formModel.isAdmin"
        ></v-switch>
        <v-switch
          :disabled="!formModel.isAdmin"
          label="Legal signing authority"
          inset
          color="primary"
          v-model="formModel.isLegalSigningAuthority"
        ></v-switch>
      </v-row>
    </content-group>
    <h3
      class="category-header-medium primary-color my-2"
      v-if="!formModel.isAdmin"
    >
      Assign user to locations
    </h3>
    <content-group v-if="!formModel.isAdmin">
      <span>
        <v-row
          ><v-col><strong>Locations</strong> </v-col
          ><v-col>
            <strong>Roles</strong>
          </v-col>
        </v-row>
        <v-row
          v-for="location in formModel.locationAuthorizations"
          :key="location.id"
          ><v-col>
            <div>{{ location.name }}</div>
            {{ location.address }}
          </v-col>
          <v-col>
            <v-radio-group inline v-model="location.userAccess" color="primary">
              <v-radio label="User" value="user" color="primary"></v-radio>
              <v-radio label="No access" value="none" color="primary"></v-radio>
            </v-radio-group>
          </v-col>
        </v-row>
      </span>
      <v-input :rules="[hasLocationAuthorizationValidationRule()]" error>
      </v-input>
    </content-group>
  </v-form>
</template>

<script lang="ts">
import { ref, watch, PropType, reactive } from "vue";
import { LocationUserAccess, UserManagementModel } from "@/types";

export default {
  props: {
    initialData: {
      type: Object as PropType<UserManagementModel>,
      required: true,
      default: new UserManagementModel(),
    },
  },
  setup(props: any) {
    const userForm = ref({});
    const formModel = reactive(new UserManagementModel());

    watch(
      () => props.initialData,
      () => {
        formModel.selectedBCeIDUser = props.initialData.selectedBCeIDUser;
        formModel.isAdmin = props.initialData.isAdmin;
        formModel.isLegalSigningAuthority =
          props.initialData.isLegalSigningAuthority;
        formModel.locationAuthorizations =
          props.initialData.locationAuthorizations;
      },
      {
        immediate: true,
      },
    );

    // If user is not an admin remove legalSigningAuthority value.
    watch(
      () => formModel.isAdmin,
      () => {
        if (!formModel.isAdmin) {
          formModel.isLegalSigningAuthority = false;
        }
      },
    );

    // UI validation to ensure that the user has access to at least
    // on location when admin is not selected.
    const hasLocationAuthorizationValidationRule = () => {
      if (formModel.isAdmin) {
        return true;
      }
      const hasSomeLocationAccess = formModel.locationAuthorizations.some(
        (locationAccess) =>
          locationAccess.userAccess === LocationUserAccess.User,
      );
      if (!hasSomeLocationAccess) {
        return "Select at least one location for non-admin users.";
      }
      return true;
    };

    return {
      formModel,
      hasLocationAuthorizationValidationRule,
      userForm,
    };
  },
};
</script>
