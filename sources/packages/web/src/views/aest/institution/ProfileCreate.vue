<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Manage institutions"
        subTitle="Create Institution"
      />
    </template>
    <institution-profile-form
      :profileData="institutionProfileModel"
      @submitInstitutionProfile="createInstitution"
      :processing="processing"
      submitLabel="Create profile"
    ></institution-profile-form>
  </full-page-container>
</template>

<script lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ClientIdType } from "@/types";
import { AESTCreateInstitutionAPIInDTO } from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { useSnackBar } from "@/composables";
import InstitutionProfileForm from "@/components/institutions/profile/InstitutionProfileForm.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

interface FormModel {
  clientType: ClientIdType;
  mode: string;
}

export default {
  components: { InstitutionProfileForm },
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const processing = ref(false);
    const institutionProfileModel = ref({
      clientType: ClientIdType.AEST,
      mode: "create",
    } as FormModel);

    const createInstitution = async (data: AESTCreateInstitutionAPIInDTO) => {
      try {
        processing.value = true;
        const createdInstitution =
          await InstitutionService.shared.createInstitution(data);

        snackBar.success("Institution successfully created!");
        router.push({
          name: AESTRoutesConst.INSTITUTION_PROFILE,
          params: { institutionId: createdInstitution.id },
        });
      } catch (error) {
        snackBar.error("Unexpected error while creating the institution.");
      } finally {
        processing.value = false;
      }
    };

    return {
      institutionProfileModel,
      createInstitution,
    };
  },
};
</script>
