<template>
  <full-page-container>
    <formio
      formName="institutionprofilecreation"
      :data="initialData"
      @loaded="formLoaded"
      @submitted="submitted"
    ></formio>
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import formio from "@/components/generic/formio.vue";
import { UserService } from "@/services/UserService";
import { InstitutionService } from "@/services/InstitutionService";
import { InstitutionFormAPIInDTO } from "@/services/http/dto";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormioDropdownLoader, useToastMessage } from "@/composables";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";

export default {
  components: { formio, FullPageContainer },
  setup() {
    // Hooks
    const store = useStore();
    const toast = useToastMessage();
    const router = useRouter();
    const formioDataLoader = useFormioDropdownLoader();
    // Data-bind
    const initialData = ref({});

    const submitted = async (data: InstitutionFormAPIInDTO) => {
      try {
        await InstitutionService.shared.createInstitution(data);
        await store.dispatch("institution/initialize");
        toast.success(
          "Create Successful",
          "Institution and User successfully created!",
        );
        await store.dispatch("institution/getInstitutionDetails");
        router.push({
          name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        });
      } catch (error) {
        toast.error(
          "Unexpected error",
          "Unexpected error while creating the institution.",
        );
      }
    };

    onMounted(async () => {
      const bceidAccount = await UserService.shared.getBCeIDAccountDetails();
      if (bceidAccount) {
        initialData.value = {
          userFirstName: bceidAccount.user.firstname,
          userLastName: bceidAccount.user.surname,
          userEmail: bceidAccount.user.email,
          institutionLegalName: bceidAccount.institution.legalName,
        };
      } else {
        toast.error("BCeID Account error", "Unable to fetch account details.");
      }
    });

    const formLoaded = async (form: any) => {
      await formioDataLoader.loadInstitutionTypes(form, "institutionType");
    };

    return {
      initialData,
      submitted,
      formLoaded,
    };
  },
};
</script>
