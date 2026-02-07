<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Manage institutions"
        sub-title="Create Institution"
      />
    </template>
    <institution-profile-form
      :profile-data="institutionProfileModel"
      @submit-institution-profile="createInstitution"
      :processing="processing"
      submit-label="Create profile"
      :allowed-role="Role.AESTCreateInstitution"
    ></institution-profile-form>
  </full-page-container>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { ClientIdType, InstitutionProfileFormInitialData, Role } from "@/types";
import { AESTCreateInstitutionAPIInDTO } from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { useFormioUtils, useSnackBar } from "@/composables";
import InstitutionProfileForm from "@/components/institutions/profile/InstitutionProfileForm.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

export default defineComponent({
  components: { InstitutionProfileForm },
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const { excludeExtraneousValues } = useFormioUtils();
    const processing = ref(false);
    const institutionProfileModel = ref({
      clientType: ClientIdType.AEST,
      mode: "create",
    } as InstitutionProfileFormInitialData);

    const createInstitution = async (data: unknown) => {
      try {
        processing.value = true;
        const typedData = excludeExtraneousValues(
          AESTCreateInstitutionAPIInDTO,
          data,
        );
        const createdInstitution =
          await InstitutionService.shared.createInstitution(typedData);
        snackBar.success("Institution successfully created!");
        router.push({
          name: AESTRoutesConst.INSTITUTION_PROFILE,
          params: { institutionId: createdInstitution.id },
        });
      } catch {
        snackBar.error("Unexpected error while creating the institution.");
      } finally {
        processing.value = false;
      }
    };

    return {
      institutionProfileModel,
      createInstitution,
      Role,
      processing,
    };
  },
});
</script>
