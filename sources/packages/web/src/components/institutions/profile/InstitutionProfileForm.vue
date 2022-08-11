<template>
  <formio-container
    formName="institutionProfile"
    :formData="profileData"
    @loaded="formLoaded"
    @submitted="submitInstitutionProfile"
  >
    <template #actions="{ submit }">
      <check-permission-role :role="allowedRole">
        <template #="{ notAllowed }">
          <footer-buttons
            :processing="processing"
            :primaryLabel="submitLabel"
            @primaryClick="submit"
            :showSecondaryButton="false"
            :disablePrimaryButton="notAllowed"
          />
        </template>
      </check-permission-role>
    </template>
  </formio-container>
</template>

<script lang="ts">
import { useFormioDropdownLoader } from "@/composables";
import { PropType, SetupContext } from "vue";
import { FormIOForm, InstitutionProfileForm, Role } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default {
  components: {
    CheckPermissionRole,
  },
  props: {
    profileData: {
      type: Object,
      required: true,
    },
    submitLabel: {
      type: String,
      required: false,
      default: "Submit",
    },
    processing: {
      type: Boolean,
      default: false,
    },
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  emits: ["submitInstitutionProfile"],
  setup(_props: any, context: SetupContext) {
    const formioDataLoader = useFormioDropdownLoader();

    const submitInstitutionProfile = async (
      form: FormIOForm<InstitutionProfileForm>,
    ) => {
      context.emit("submitInstitutionProfile", form.data);
    };

    const formLoaded = async (form: any) => {
      await formioDataLoader.loadInstitutionTypes(form, "institutionType");
    };

    return {
      submitInstitutionProfile,
      formLoaded,
      Role,
    };
  },
};
</script>
