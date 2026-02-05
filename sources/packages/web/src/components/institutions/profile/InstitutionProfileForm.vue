<template>
  <formio-container
    form-name="institutionProfile"
    :form-data="formData"
    :is-data-ready="isDataReady"
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
import { PropType, computed, defineComponent, onMounted, ref } from "vue";
import {
  FormIOForm,
  InstitutionProfileFormData,
  InstitutionProfileFormInitialData,
  Role,
  SystemLookupCategory,
  SystemLookupEntry,
} from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { SystemLookupConfigurationService } from "@/services/SystemLookupConfigurationService";

export default defineComponent({
  components: {
    CheckPermissionRole,
  },
  props: {
    profileData: {
      type: Object as PropType<InstitutionProfileFormInitialData>,
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
  setup(props, context) {
    const formioDataLoader = useFormioDropdownLoader();
    const countries = ref<SystemLookupEntry[]>([]);
    const provinces = ref<SystemLookupEntry[]>([]);
    const isLookupLoaded = ref(false);
    const isDataReady = computed(
      () => props.profileData && isLookupLoaded.value,
    );
    const formData = computed<InstitutionProfileFormData>(() => ({
      ...props.profileData,
      countries: countries.value,
      provinces: provinces.value,
    }));

    const submitInstitutionProfile = async (
      form: FormIOForm<InstitutionProfileFormData>,
    ) => {
      context.emit("submitInstitutionProfile", form.data);
    };

    const formLoaded = async (form: FormIOForm<InstitutionProfileFormData>) => {
      await formioDataLoader.loadInstitutionTypes(form, "institutionType");
    };

    /**
     * Loads the lookup data.
     */
    const loadLookup = async () => {
      const countryLookupPromise =
        SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
          SystemLookupCategory.Country,
        );
      const provinceLookupPromise =
        SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
          SystemLookupCategory.Province,
        );
      const [countryLookup, provinceLookup] = await Promise.all([
        countryLookupPromise,
        provinceLookupPromise,
      ]);
      countries.value = countryLookup.items;
      provinces.value = provinceLookup.items;
      isLookupLoaded.value = true;
    };
    onMounted(loadLookup);

    return {
      submitInstitutionProfile,
      formLoaded,
      Role,
      isDataReady,
      formData,
    };
  },
});
</script>
