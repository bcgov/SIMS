<template>
  <Message severity="info">
    Please notice that the read-only information below is retrieved from your
    BCeID account and it is not possible to change it here. If any read-only
    information needs to be changed please visit
    <a href="https://www.bceid.ca/" target="_blank">bceid.ca</a>.
  </Message>
  <full-page-container>
    <institution-profile
      :profileData="institutionProfileModel"
      @submitInstitutionProfile="updateInstitution"
    ></institution-profile>
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { InstitutionDto, InstitutionReadOnlyDto } from "../../types";
import { InstitutionService } from "@/services/InstitutionService";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormioDropdownLoader, useToastMessage } from "@/composables";
import { useStore } from "vuex";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import InstitutionProfile from "@/components/institutions/profile/InstitutionProfile.vue";

export default {
  components: { FullPageContainer, InstitutionProfile },
  setup() {
    // Hooks
    const store = useStore();
    const toast = useToastMessage();
    const router = useRouter();
    const formioDataLoader = useFormioDropdownLoader();
    // Data-bind
    const institutionProfileModel = ref({} as InstitutionReadOnlyDto);

    const updateInstitution = async (data: InstitutionDto) => {
      try {
        await InstitutionService.shared.updateInstitute(data);
        toast.success("Update Successful", "Institution successfully updated!");
        await store.dispatch("institution/getInstitutionDetails");
        router.push({
          name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        });
      } catch (error) {
        toast.error(
          "Unexpected error",
          "Unexpected error while updating the institution.",
        );
      }
    };

    // Hooks
    onMounted(async () => {
      const detail = await InstitutionService.shared.getDetail();
      institutionProfileModel.value = detail.institution as InstitutionReadOnlyDto;
    });

    const formLoaded = async (form: any) => {
      await formioDataLoader.loadInstitutionTypes(form, "institutionType");
    };

    return {
      institutionProfileModel,
      updateInstitution,
      formLoaded,
    };
  },
};
</script>
