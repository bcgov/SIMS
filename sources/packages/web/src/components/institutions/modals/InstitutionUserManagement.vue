<!-- Shared modal content for modals AddInstitutionUserModal and EditInstitutionUserModal -->
<template>
  <error-summary :errors="errors" />
  <content-group class="mb-3">
    <v-row no-gutters>
      <v-row align="center" no-gutters>
        <v-col cols="12">
          <!-- This slot holds the BCeID basic(plain text)/business(dropdown) and readonly views(plain readonly text input). -->
          <slot name="user-name" :form-model="formModel" />
        </v-col>
        <v-col cols="6">
          <v-switch
            size="small"
            hide-details
            label="Admin"
            color="primary"
            inset
            class="mr-3"
            v-model="formModel.isAdmin"
          ></v-switch>
        </v-col>
        <v-col cols="6">
          <v-switch
            size="small"
            hide-details
            :disabled="!formModel.isAdmin"
            label="Legal Signing Authority"
            inset
            color="primary"
            v-model="formModel.isLegalSigningAuthority"
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
  <body-header-container
    title="Assign user to locations"
    header-size="medium"
    v-if="!formModel.isAdmin"
  >
    <content-group>
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
  </body-header-container>
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
    // one location when admin is not selected.
    const hasLocationAuthorizationValidationRule = (): boolean | string => {
      if (formModel.isAdmin) {
        return true;
      }
      const hasSomeLocationAccess = formModel.locationAuthorizations.some(
        (locationAccess) =>
          locationAccess.userAccess === LocationUserAccess.User ||
          locationAccess.userAccess === LocationUserAccess.ReadOnlyUser,
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
