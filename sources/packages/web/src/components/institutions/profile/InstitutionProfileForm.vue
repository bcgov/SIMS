<template>
  <formio-container
    form-name="institutionProfile"
    :form-data="profileData"
    @loaded="formLoaded"
    @submitted="submitInstitutionProfile"
  >
    <template #actions="{ submit }">
      <check-permission-role :role="allowedRole">
        <template #="{ notAllowed }">
          <footer-buttons
            :processing="processing"
            :primary-label="submitLabel"
            @primary-click="submit"
            :show-secondary-button="false"
            :disable-primary-button="notAllowed"
          />
        </template>
      </check-permission-role>
    </template>
  </formio-container>
</template>

<script lang="ts">
import { useFormioDropdownLoader } from "@/composables";
import { PropType, defineComponent } from "vue";
import { FormIOForm, InstitutionProfileFormData, Role } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  components: {
    CheckPermissionRole,
  },
  props: {
    profileData: {
      type: Object as PropType<InstitutionProfileFormData>,
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
      required: false,
      default: undefined,
    },
  },
  emits: ["submitInstitutionProfile"],
  setup(_props, context) {
    const formioDataLoader = useFormioDropdownLoader();

    const submitInstitutionProfile = async (
      form: FormIOForm<InstitutionProfileFormData>,
    ) => {
      context.emit("submitInstitutionProfile", form.data);
    };

    const formLoaded = async (form: FormIOForm<InstitutionProfileFormData>) => {
      await formioDataLoader.loadInstitutionTypes(form, "institutionType");
    };

    return {
      submitInstitutionProfile,
      formLoaded,
      Role,
    };
  },
});
</script>
