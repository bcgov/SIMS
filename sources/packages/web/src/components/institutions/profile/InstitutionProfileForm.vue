<template>
  <formio-container
    formName="institutionProfile"
    :formData="profileData"
    @loaded="formLoaded"
    @submitted="submitInstitutionProfile"
  >
    <template #actions="{ submit }">
      <check-a-e-s-t-permission-role :role="allowedRole">
        <template v-slot="{ isReadonly }">
          <footer-buttons
            :processing="processing"
            :primaryLabel="submitLabel"
            @primaryClick="submit"
            :showSecondaryButton="false"
            :disablePrimaryButton="isReadonly"
          />
        </template>
      </check-a-e-s-t-permission-role>
    </template>
  </formio-container>
</template>

<script lang="ts">
import { useFormioDropdownLoader } from "@/composables";
import { PropType, SetupContext } from "vue";
import { FormIOForm, InstitutionProfileForm, Role } from "@/types";
import CheckAESTPermissionRole from "@/components/generic/CheckAESTPermissionRole.vue";

export default {
  components: {
    CheckAESTPermissionRole,
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
