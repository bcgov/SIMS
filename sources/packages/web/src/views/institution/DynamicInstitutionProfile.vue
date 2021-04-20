<template>
  <Message severity="info">
    Please notice that the read-only information below is retrieved from your
    BCeID account and it is not possible to change it here. If any read-only
    information needs to be changed please visit
    <a href="https://www.bceid.ca/" target="_blank">bceid.ca</a>.
  </Message>
  <Card class="p-m-4">
    <template #content>
      <formio
        formName="institutionprofile"
        :data="initialData"
        @submitted="submitted"
      ></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import formio from "../../components/generic/formio.vue";
import { UserService } from "../../services/UserService";
import { InstitutionDto, InstitutionDetailDto } from "../../types";
import { InstitutionService } from "../../services/InstitutionService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";

export default {
  components: { formio },
  props: {
    editMode: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  setup(props: any) {
    // Hooks
    const toast = useToast();
    const router = useRouter();
    // Data-bind
    const initialData = ref({});

    const submitted = async (data: InstitutionDto) => {
      let redirectHome = true;
      if (props.editMode) {
        try {
          await InstitutionService.shared.updateInstitute(data);
          toast.add({
            severity: "success",
            summary: "Updated!",
            detail: "Institution and User successfully updated!",
            life: 5000,
          });
        } catch (excp) {
          redirectHome = false;
          toast.add({
            severity: "error",
            summary: "Unexpected error",
            detail: "An error happened during the update process.",
            life: 5000,
          });
        }
      } else {
        try {
          await InstitutionService.shared.createInstitutionV2(data);
          toast.add({
            severity: "success",
            summary: "Created!",
            detail: "Institution and User successfully created!",
            life: 5000,
          });
        } catch (excp) {
          redirectHome = false;
          toast.add({
            severity: "error",
            summary: "Unexpected error",
            detail: "An error happened during the creation process.",
            life: 5000,
          });
        }
      }

      if (redirectHome) {
        router.push({
          name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        });
      }
    };

    // Hooks
    onMounted(async () => {
      if (props.editMode) {
        const resp: any = await InstitutionService.shared.getDetail();

        const detail: InstitutionDetailDto = resp.data;
        const bceidAccount = detail.account;
        initialData.value = {
          userFirstName: bceidAccount?.user.firstname,
          userLastName: bceidAccount?.user.surname,
          institutionLegalName: bceidAccount?.institution.legalName,
          ...detail.institution,
        };
      } else {
        const bceidAccount = await UserService.shared.getBCeIDAccountDetails();
        initialData.value = {
          userFirstName: bceidAccount?.user.firstname,
          userLastName: bceidAccount?.user.surname,
          userEmail: bceidAccount?.user.email,
          institutionLegalName: bceidAccount?.institution.legalName,
        };
      }
    });

    return {
      initialData,
      submitted,
    };
  },
};
</script>

<style></style>
