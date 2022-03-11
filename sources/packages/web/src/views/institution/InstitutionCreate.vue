<template>
  <Message severity="info">
    Please notice that the read-only information below is retrieved from your
    BCeID account and it is not possible to change it here. If any read-only
    information needs to be changed please visit
    <a href="https://www.bceid.ca/" target="_blank">bceid.ca</a>.
  </Message>
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
import { InstitutionDto } from "@/types";
import { InstitutionService } from "@/services/InstitutionService";
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

    const submitted = async (data: InstitutionDto) => {
      let redirectHome = true;
      try {
        await InstitutionService.shared.createInstitutionV2(data);
        await store.dispatch("institution/initialize");
        toast.success(
          "Create Successful",
          "Institution and User successfully created!",
        );
      } catch (error) {
        redirectHome = false;
        toast.error(
          "Unexpected error",
          "Unexpected error while creating the institution.",
        );
      }

      await store.dispatch("institution/getInstitutionDetails");
      if (redirectHome) {
        router.push({
          name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        });
      }
    };

    onMounted(async () => {
      const bceidAccount = await UserService.shared.getBCeIDAccountDetails();
      if (bceidAccount) {
        initialData.value = {
          userFirstName: bceidAccount?.user.firstname,
          userLastName: bceidAccount?.user.surname,
          userEmail: bceidAccount?.user.email,
          institutionLegalName: bceidAccount?.institution.legalName,
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
