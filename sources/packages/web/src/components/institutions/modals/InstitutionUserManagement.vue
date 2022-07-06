<template>
  <v-form ref="userForm">
    <content-group>
      <v-row align="center" class="mx-1">
        <!-- This slot holds the BCeID basic(plain text)/business(dropdown) and readonly views(plain readonly text input) -->
        <slot name="user-name" />
        <v-switch
          label="Admin"
          color="primary"
          inset
          class="mr-3"
          :false-value="null"
          true-value="admin"
          v-model="isAdmin"
        ></v-switch>
        <v-switch
          :disabled="!isAdmin"
          label="Legal signing authority"
          inset
          color="primary"
          v-model="legalSigningAuthority"
        ></v-switch>
      </v-row>
    </content-group>
    <h3 class="category-header-medium primary-color my-2" v-if="!isAdmin">
      Assign user to locations
    </h3>
    <content-group v-if="!isAdmin">
      <span>
        <v-row
          ><v-col><strong>Locations</strong> </v-col
          ><v-col>
            <strong>Roles</strong>
          </v-col>
        </v-row>
        <v-row v-for="location in locationsAccess" :key="location.id"
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
      <v-input :rules="[hasLocationAccessValidationRule()]" error> </v-input>
    </content-group>
  </v-form>
</template>

<script lang="ts">
import { ref, watch, SetupContext, PropType, defineComponent } from "vue";
import {
  InstitutionUserRoles,
  LocationAuthorization,
  LocationUserAccess,
} from "@/types";

export default defineComponent({
  emits: ["submitted"],
  props: {
    locationsAccess: {
      type: Object as PropType<LocationAuthorization[]>,
      required: true,
    },
  },
  setup(props: any, context: SetupContext) {
    const userForm = ref({} as { validate: () => Promise<any> });
    const isAdmin = ref(false);
    const legalSigningAuthority = ref<string | undefined>();

    // If user is not an admin remove legalSigningAuthority value.
    watch(isAdmin, () => {
      if (!isAdmin.value) {
        legalSigningAuthority.value = undefined;
      }
    });

    // Validates the form and trigger the submitted event.
    const submit = async () => {
      const formValidation = await userForm.value.validate();
      if (formValidation.valid) {
        context.emit("submitted");
      }
    };

    // UI validation to ensure that at least on location is selected to the
    // user have access for non-admin users.
    const hasLocationAccessValidationRule = () => {
      if (isAdmin.value) {
        return true;
      }
      const locationsAccess = props.locationsAccess as LocationAuthorization[];
      const hasSomeLocationAccess = locationsAccess.some(
        (locationAccess) =>
          locationAccess.userAccess === LocationUserAccess.User,
      );
      if (!hasSomeLocationAccess) {
        return "Select at least one location for non-admin users.";
      }
      return true;
    };

    return {
      isAdmin,
      legalSigningAuthority,
      hasLocationAccessValidationRule,
      InstitutionUserRoles,
      submit,
      userForm,
    };
  },
});
</script>
