<template>
  <full-page-container>
    <template #header>
      <header-navigator title="Institution" subTitle="My Profile" />
    </template>
    <template #alerts>
      <banner :type="BannerTypes.Info" header="Updating read-only information">
        <template #content>
          Please notice that the read-only information below is retrieved from
          your BCeID account and it is not possible to change it here. If any
          read-only information needs to be changed please visit
          <a rel="noopener" href="https://www.bceid.ca/" target="_blank"
            >bceid.ca</a
          >.
        </template>
      </banner>
    </template>
    <!-- todo: ann formio definition -->
    <formio-container
      formName="institutionUserProfile"
      :formData="initialData"
      @submitted="submitted"
    >
      <template #actions="{ submit }">
        <footer-buttons
          :processing="processing"
          primaryLabel="Submit"
          @primaryClick="submit"
          :showSecondaryButton="false"
        /> </template
    ></formio-container>
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { UserService } from "../../services/UserService";
import { useSnackBar } from "@/composables";
import {
  FormIOForm,
  InstitutionUserDetailsDto,
  InstitutionUserPersistDto,
} from "../../types";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import { BannerTypes } from "@/types/contracts/Banner";

export default {
  setup() {
    // Hooks
    const snackBar = useSnackBar();
    const router = useRouter();
    // Data-bind
    const initialData = ref({});
    const processing = ref(false);

    const submitted = async (form: FormIOForm<InstitutionUserDetailsDto>) => {
      const institutionUserPersistDto: InstitutionUserPersistDto = {
        userEmail: form.data.userEmail,
      };
      try {
        processing.value = true;
        await UserService.shared.updateInstitutionUser(
          institutionUserPersistDto,
        );
        snackBar.success("Institution User successfully updated!");
        router.push({
          name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        });
      } catch (excp) {
        snackBar.error("An error happened during the update process.");
      } finally {
        processing.value = false;
      }
    };

    // Hooks
    onMounted(async () => {
      const institutionUser = await UserService.shared.getInstitutionUser();
      if (institutionUser) {
        initialData.value = {
          userFirstName: institutionUser.userFirstName,
          userLastName: institutionUser.userLastName,
          userEmail: institutionUser.userEmail,
        };
      } else {
        snackBar.error("Unable to fetch Institution user account details.");
      }
    });

    return {
      initialData,
      submitted,
      BannerTypes,
    };
  },
};
</script>
