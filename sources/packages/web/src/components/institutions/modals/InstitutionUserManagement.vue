<!-- Shared modal content for modals AddInstitutionUserModal and EditInstitutionUserModal -->
<template>
  <error-summary :errors="errors" />
  <content-group>
    <v-row no-gutters>
      <v-row align="center" no-gutters>
        <v-col cols="auto">
          <!-- This slot holds the BCeID basic(plain text)/business(dropdown) and readonly views(plain readonly text input). -->
          <slot name="user-name" :formModel="formModel" />
        </v-col>
        <v-col cols="auto">
          <v-switch
            hide-details
            label="Admin"
            color="primary"
            inset
            class="mr-3"
            v-model="formModel.isAdmin"
            data-cy="isAdmin"
          ></v-switch>
        </v-col>
        <v-col cols="auto">
          <v-switch
            hide-details
            :disabled="!formModel.isAdmin"
            label="Legal Signing Authority"
            inset
            color="primary"
            v-model="formModel.isLegalSigningAuthority"
            data-cy="isLegalSigningAuthority"
          ></v-switch>
        </v-col>
      </v-row>
    </v-row>
    <v-input
      :rules="[isAdminOrHasLocationAccessValidationRule()]"
      hide-details="auto"
    >
    </v-input>
  </content-group>
  <h3
    class="category-header-medium primary-color mt-4 mb-2"
    v-if="!formModel.isAdmin"
    data-cy="assignLocationToUser"
  >
    Assign user to locations
  </h3>
  <content-group v-if="!formModel.isAdmin">
    <toggle-content :toggled="!formModel.locationAuthorizations.length">
      <v-row class="mb-1"
        ><v-col><strong>Locations</strong> </v-col
        ><v-col>
          <strong>Roles</strong>
        </v-col>
      </v-row>
      <v-row
        no-gutters
        v-for="location in formModel.locationAuthorizations"
        :key="location.id"
        class="mb-2"
        data-cy="location"
        ><v-col>
          <div>{{ location.name }}</div>
          {{ location.address }}
        </v-col>
        <v-col>
          <v-radio-group
            hide-details
            inline
            v-model="location.userAccess"
            color="primary"
            class="mt-2"
            data-cy="userAccess"
          >
            <v-radio label="User" value="user" color="primary"></v-radio>
            <v-radio
              label="Read-only"
              value="read-only-user"
              color="primary"
            ></v-radio>
            <v-radio label="No access" value="none" color="primary"></v-radio>
          </v-radio-group>
        </v-col>
      </v-row>
      <v-input
        :rules="[hasLocationAuthorizationValidationRule()]"
        hide-details="auto"
      >
      </v-input>
    </toggle-content>
  </content-group>
</template>

<script lang="ts">
import { watch, PropType, reactive, defineComponent } from "vue";
import { ErrorMessage, LocationUserAccess, UserManagementModel } from "@/types";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";

export default defineComponent({
  components: {
    ErrorSummary,
  },
  props: {
    initialData: {
      type: Object as PropType<UserManagementModel>,
      required: true,
      default: new UserManagementModel(),
    },
    errors: {
      type: Object as PropType<ErrorMessage[]>,
      required: false,
    },
  },
  setup(props) {
    const formModel = reactive(new UserManagementModel());

    watch(
      () => props.initialData,
      () => {
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

    const isAdminOrHasLocationAccessValidationRule = () => {
      const isValid =
        formModel.isAdmin || hasLocationAuthorizationValidationRule() === true;
      if (!isValid) {
        return "The user should be either an admin or have access to at least one location.";
      }
      return true;
    };
    // UI validation to ensure that the user has access to at least
    // on location when admin is not selected.
    const hasLocationAuthorizationValidationRule = (): boolean | string => {
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
      isAdminOrHasLocationAccessValidationRule,
      hasLocationAuthorizationValidationRule,
    };
  },
});
</script>
