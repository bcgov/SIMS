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
    ></institution-profile-form>
  </full-page-container>
</template>

<script lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ClientIdType } from "@/types";
import {
  AESTCreateInstitutionAPIInDTO,
  InstitutionDetailAPIOutDTO,
} from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { useToastMessage } from "@/composables";
import InstitutionProfileForm from "@/components/institutions/profile/InstitutionProfileForm.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

type InstitutionDetailFormModel = Pick<
  InstitutionDetailAPIOutDTO,
  "clientType"
> & {
  mode: string;
};

export default {
  components: { InstitutionProfileForm },
  setup() {
    const router = useRouter();
    const toast = useToastMessage();
    const processing = ref(false);
    const institutionProfileModel = ref({
      clientType: ClientIdType.AEST,
      mode: "create",
    } as InstitutionDetailFormModel);

    const createInstitution = async (data: AESTCreateInstitutionAPIInDTO) => {
      try {
        processing.value = true;
        const createdInstitution =
          await InstitutionService.shared.createInstitution(data);
        toast.success(
          "Successfully created",
          "Institution successfully created!",
        );
        router.push({
          name: AESTRoutesConst.INSTITUTION_PROFILE,
          params: { institutionId: createdInstitution.id },
        });
      } catch (error) {
        toast.error(
          "Unexpected error",
          "Unexpected error while creating the institution.",
        );
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
