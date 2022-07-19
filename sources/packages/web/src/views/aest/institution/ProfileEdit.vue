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
      ></institution-profile-form>
    </full-page-container>
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
import useEmitter from "@/composables/useEmitter";

export default {
  components: { InstitutionProfileForm },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const emitter = useEmitter();
    const toast = useToastMessage();
    const router = useRouter();
    const institutionProfileModel = ref({} as InstitutionDetailAPIOutDTO);
    const institutionProfileRoute = {
      name: AESTRoutesConst.INSTITUTION_PROFILE,
      params: { institutionId: props.institutionId },
    };

    const updateInstitution = async (data: InstitutionContactAPIInDTO) => {
      try {
        await InstitutionService.shared.updateInstitution(
          data,
          props.institutionId,
        );

        emitter.emit(
          "snackBar",
          toast.success1("Institution successfully updated!"),
        );
        router.push(institutionProfileRoute);
      } catch (error) {
        emitter.emit(
          "snackBar",
          toast.error1("Unexpected error while updating the institution."),
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
