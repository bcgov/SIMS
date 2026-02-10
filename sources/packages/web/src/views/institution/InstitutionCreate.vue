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
        form-name="institutionProfileCreation"
        :form-data="initialData"
        :is-data-ready="isDataReady"
        @submitted="submitted"
      >
        <template #actions="{ submit }">
          <footer-buttons
            :processing="processing"
            primary-label="Create profile"
            @primary-click="submit"
            :show-secondary-button="false"
          />
        </template>
      </formio-container>
    </full-page-container>
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { UserService } from "@/services/UserService";
import { InstitutionService } from "@/services/InstitutionService";
import { CreateInstitutionAPIInDTO } from "@/services/http/dto";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import {
  useFormioUtils,
  useInstitutionState,
  useSnackBar,
} from "@/composables";
import { FormIOForm, SystemLookupCategory } from "@/types";
import { SystemLookupConfigurationService } from "@/services/SystemLookupConfigurationService";

export default defineComponent({
  setup() {
    const processing = ref(false);
    const snackBar = useSnackBar();
    const { excludeExtraneousValues } = useFormioUtils();
    const { initialize } = useInstitutionState();
    const router = useRouter();
    const initialData = ref({});
    const isDataReady = ref(false);

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
        await initialize();
        snackBar.success("Institution and User successfully created!");
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
      try {
        const bceidAccount = await UserService.shared.getBCeIDAccount();
        if (bceidAccount) {
          const countryLookupPromise =
            SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
              SystemLookupCategory.Country,
            );
          const provinceLookupPromise =
            SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
              SystemLookupCategory.Province,
            );
          const [countryLookup, provinceLookup] = await Promise.all([
            countryLookupPromise,
            provinceLookupPromise,
          ]);
          initialData.value = {
            userFirstName: bceidAccount.user.firstname,
            userLastName: bceidAccount.user.surname,
            userEmail: bceidAccount.user.email,
            institutionLegalName: bceidAccount.institution.legalName,
            countryOptionValues: countryLookup.items,
            provinceOptionValues: provinceLookup.items,
          };
        } else {
          snackBar.error("Unable to fetch account details.");
        }
      } catch {
        snackBar.error("Unexpected error while loading data.");
      } finally {
        isDataReady.value = true;
      }
    });

    return {
      initialData,
      submitted,
      processing,
      isDataReady,
    };
  },
});
</script>
