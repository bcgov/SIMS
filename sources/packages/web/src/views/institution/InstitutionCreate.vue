<template>
  <full-page-container>
    <formio
      formName="institutionProfileCreation"
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
import { UserService } from "@/services/UserService";
import { InstitutionService } from "@/services/InstitutionService";
import { CreateInstitutionAPIInDTO } from "@/services/http/dto";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormioDropdownLoader, useSnackBar } from "@/composables";

export default {
  setup() {
    const store = useStore();
    const snackBar = useSnackBar();
    const router = useRouter();
    const formioDataLoader = useFormioDropdownLoader();
    const initialData = ref({});

    const submitted = async (data: CreateInstitutionAPIInDTO) => {
      try {
        await InstitutionService.shared.createInstitutionWithAssociatedUser(
          data,
        );
        await store.dispatch("institution/initialize");
        snackBar.success("Institution and User successfully created!");
        await store.dispatch("institution/getInstitutionDetails");
        router.push({
          name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        });
      } catch (error) {
        snackBar.error("Unexpected error while creating the institution.");
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
        snackBar.error("Unable to fetch account details.");
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
