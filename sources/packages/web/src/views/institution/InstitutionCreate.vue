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
import { useFormioDropdownLoader, useToastMessage } from "@/composables";
import useEmitter from "@/composables/useEmitter";

export default {
  setup() {
    const emitter = useEmitter();
    const store = useStore();
    const toast = useToastMessage();
    const router = useRouter();
    const formioDataLoader = useFormioDropdownLoader();
    const initialData = ref({});

    const submitted = async (data: CreateInstitutionAPIInDTO) => {
      try {
        await InstitutionService.shared.createInstitutionWithAssociatedUser(
          data,
        );
        await store.dispatch("institution/initialize");
        emitter.emit(
          "snackBar",
          toast.success1("Institution and User successfully created!"),
        );
        await store.dispatch("institution/getInstitutionDetails");
        router.push({
          name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        });
      } catch (error) {
        emitter.emit(
          "snackBar",
          toast.error1("Unexpected error while creating the institution."),
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
        emitter.emit(
          "snackBar",
          toast.error1("Unable to fetch account details."),
        );
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
