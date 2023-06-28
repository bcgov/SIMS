<template>
  <full-page-container layout-template="centered">
    <div class="text-center">
      <h1 class="heading-x-large">Create Your Institution Profile</h1>
      <p class="label-value m-4">
        Please confirm your email and add your institution details below. An
        account will be created for
        <br />
        your institution and you will be assigned an admin.
      </p>
    </div>
    <full-page-container>
      <formio-container
        formName="institutionProfileCreation"
        :formData="initialData"
        @loaded="formLoaded"
        @submitted="submitted"
      >
        <template #actions="{ submit }">
          <footer-buttons
            :processing="processing"
            primaryLabel="Create profile"
            @primaryClick="submit"
            :showSecondaryButton="false"
          />
        </template>
      </formio-container>
    </full-page-container>
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { UserService } from "@/services/UserService";
import { InstitutionService } from "@/services/InstitutionService";
import { CreateInstitutionAPIInDTO } from "@/services/http/dto";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import {
  useFormioDropdownLoader,
  useFormioUtils,
  useSnackBar,
} from "@/composables";
import { FormIOForm } from "@/types";

export default defineComponent({
  setup() {
    const processing = ref(false);
    const store = useStore();
    const snackBar = useSnackBar();
    const { excludeExtraneousValues } = useFormioUtils();
    const router = useRouter();
    const formioDataLoader = useFormioDropdownLoader();
    const initialData = ref({});

    const submitted = async (form: FormIOForm<CreateInstitutionAPIInDTO>) => {
      try {
        processing.value = true;
        const typedData = excludeExtraneousValues(
          CreateInstitutionAPIInDTO,
          form.data,
        );
        await InstitutionService.shared.createInstitutionWithAssociatedUser(
          typedData,
        );
        await store.dispatch("institution/initialize");
        snackBar.success("Institution and User successfully created!");
        await store.dispatch("institution/getInstitutionDetails");
        router.push({
          name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        });
      } catch {
        snackBar.error("Unexpected error while creating the institution.");
      } finally {
        processing.value = false;
      }
    };

    onMounted(async () => {
      const bceidAccount = await UserService.shared.getBCeIDAccount();
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
      processing,
    };
  },
});
</script>
