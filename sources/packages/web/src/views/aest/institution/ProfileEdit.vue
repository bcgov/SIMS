<template>
  <v-container>
    <header-navigator
      title="Profile"
      subTitle="Edit Profile"
      :routeLocation="institutionProfileRoute"
    />
    <div class="col-md-6 offset-md-3">
      <institution-profile-form
        :profileData="institutionProfileModel"
        @submitInstitutionProfile="updateInstitution"
      ></institution-profile-form>
    </div>
  </v-container>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ClientIdType } from "@/types";
import {
  InstitutionDetailAPIOutDTO,
  InstitutionContactAPIInDTO,
} from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useToastMessage } from "@/composables";
import InstitutionProfileForm from "@/components/institutions/profile/InstitutionProfileForm.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";

export default {
  components: { InstitutionProfileForm, HeaderNavigator },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const toast = useToastMessage();
    const router = useRouter();
    const institutionProfileModel = ref({} as InstitutionDetailAPIOutDTO);
    const institutionProfileRoute = {
      name: AESTRoutesConst.INSTITUTION_PROFILE,
      params: { institutionId: props.institutionId },
    };

    const updateInstitution = async (data: InstitutionContactAPIInDTO) => {
      try {
        await InstitutionService.shared.updateInstitute(
          data,
          props.institutionId,
        );
        toast.success("Update Successful", "Institution successfully updated!");
        router.push(institutionProfileRoute);
      } catch (error) {
        toast.error(
          "Unexpected error",
          "Unexpected error while updating the institution.",
        );
      }
    };

    onMounted(async () => {
      institutionProfileModel.value = await InstitutionService.shared.getDetail(
        props.institutionId,
      );
      institutionProfileModel.value.clientType = ClientIdType.AEST;
    });

    return {
      institutionProfileModel,
      updateInstitution,
      institutionProfileRoute,
    };
  },
};
</script>
