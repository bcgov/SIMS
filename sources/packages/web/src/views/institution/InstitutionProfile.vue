<template>
  <v-container>
    <header-navigator title="Manage institutions" subTitle="Manage Profile" />
    <Message severity="info">
      Please notice that the read-only information below is retrieved from your
      BCeID account and it is not possible to change it here. If any read-only
      information needs to be changed please visit
      <a href="https://www.bceid.ca/" target="_blank" rel="noopener">bceid.ca</a
      >.
    </Message>
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
import { InstitutionService } from "@/services/InstitutionService";
import {
  InstitutionDetailAPIOutDTO,
  InstitutionContactAPIInDTO,
} from "@/services/http/dto";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar } from "@/composables";
import { useStore } from "vuex";
import InstitutionProfileForm from "@/components/institutions/profile/InstitutionProfileForm.vue";

export default {
  components: { InstitutionProfileForm },
  setup() {
    // Hooks
    const store = useStore();
    const toast = useSnackBar();
    const router = useRouter();
    // Data-bind
    const institutionProfileModel = ref({} as InstitutionDetailAPIOutDTO);

    const updateInstitution = async (data: InstitutionContactAPIInDTO) => {
      try {
        await InstitutionService.shared.updateInstitution(data);

        toast.success("Institution successfully updated!");
        await store.dispatch("institution/getInstitutionDetails");
        router.push({
          name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        });
      } catch (error) {
        toast.error("Unexpected error while updating the institution.");
      }
    };

    // Hooks
    onMounted(async () => {
      institutionProfileModel.value =
        await InstitutionService.shared.getDetail();
    });

    return {
      institutionProfileModel,
      updateInstitution,
    };
  },
};
</script>
