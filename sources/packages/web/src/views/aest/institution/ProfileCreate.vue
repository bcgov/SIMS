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
    ></institution-profile-form>
  </full-page-container>
</template>

<script lang="ts">
import { ref } from "vue";
import { ClientIdType } from "@/types";
import {
  AESTCreateInstitutionAPIInDTO,
  InstitutionDetailAPIOutDTO,
} from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { useToastMessage } from "@/composables";
import InstitutionProfileForm from "@/components/institutions/profile/InstitutionProfileForm.vue";

type InstitutionDetailFormModel = Pick<
  InstitutionDetailAPIOutDTO,
  "clientType"
> & {
  mode: string;
};

export default {
  components: { InstitutionProfileForm },
  setup() {
    const toast = useToastMessage();
    const institutionProfileModel = ref({
      clientType: ClientIdType.AEST,
      mode: "create",
    } as InstitutionDetailFormModel);

    const createInstitution = async (data: AESTCreateInstitutionAPIInDTO) => {
      try {
        await InstitutionService.shared.createInstitution(data);
        toast.success(
          "Successfully created",
          "Institution successfully created!",
        );
      } catch (error) {
        toast.error(
          "Unexpected error",
          "Unexpected error while creating the institution.",
        );
      }
    };

    return {
      institutionProfileModel,
      createInstitution,
    };
  },
};
</script>
