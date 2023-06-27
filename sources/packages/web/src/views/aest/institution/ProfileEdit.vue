<template>
  <v-container>
    <header-navigator
      title="Profile"
      subTitle="Edit Profile"
      :routeLocation="institutionProfileRoute"
    />
    <full-page-container>
      <institution-profile-form
        :profileData="institutionProfileModel"
        @submitInstitutionProfile="updateInstitution"
        :allowedRole="Role.InstitutionEditProfile"
      ></institution-profile-form>
    </full-page-container>
  </v-container>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { ClientIdType, Role } from "@/types";
import {
  InstitutionDetailAPIOutDTO,
  InstitutionProfileAPIInDTO,
} from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormioUtils, useSnackBar } from "@/composables";
import InstitutionProfileForm from "@/components/institutions/profile/InstitutionProfileForm.vue";

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
    const institutionProfileModel = ref({} as InstitutionDetailAPIOutDTO);
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
      institutionProfileModel.value = await InstitutionService.shared.getDetail(
        props.institutionId,
      );
      institutionProfileModel.value.clientType = ClientIdType.AEST;
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
