<template>
  <v-container>
    <header-navigator
      title="Profile"
      sub-title="Edit Profile"
      :route-location="institutionProfileRoute"
    />
    <full-page-container>
      <institution-profile-form
        :profile-data="institutionProfileModel"
        @submit-institution-profile="updateInstitution"
        :allowed-role="Role.InstitutionEditProfile"
      ></institution-profile-form>
    </full-page-container>
  </v-container>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import {
  ClientIdType,
  InstitutionProfileFormData,
  Role,
  SystemLookupCategory,
} from "@/types";
import { InstitutionProfileAPIInDTO } from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormioUtils, useSnackBar } from "@/composables";
import InstitutionProfileForm from "@/components/institutions/profile/InstitutionProfileForm.vue";
import { SystemLookupConfigurationService } from "@/services/SystemLookupConfigurationService";

export default defineComponent({
  components: { InstitutionProfileForm },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const router = useRouter();
    const { excludeExtraneousValues } = useFormioUtils();
    const institutionProfileModel = ref({} as InstitutionProfileFormData);
    const institutionProfileRoute = {
      name: AESTRoutesConst.INSTITUTION_PROFILE,
      params: { institutionId: props.institutionId },
    };

    const updateInstitution = async (data: InstitutionProfileAPIInDTO) => {
      try {
        const typedData = excludeExtraneousValues(
          InstitutionProfileAPIInDTO,
          data,
        );
        await InstitutionService.shared.updateInstitution(
          typedData,
          props.institutionId,
        );
        snackBar.success("Institution successfully updated!");
        router.push(institutionProfileRoute);
      } catch {
        snackBar.error("Unexpected error while updating the institution.");
      }
    };

    onMounted(async () => {
      const institutionDetail = await InstitutionService.shared.getDetail(
        props.institutionId,
      );
      const countryLookup =
        await SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
          SystemLookupCategory.Country,
        );
      institutionProfileModel.value = {
        ...institutionDetail,
        clientType: ClientIdType.AEST,
        countries: countryLookup.items,
      };
    });

    return {
      institutionProfileModel,
      updateInstitution,
      institutionProfileRoute,
      Role,
    };
  },
});
</script>
