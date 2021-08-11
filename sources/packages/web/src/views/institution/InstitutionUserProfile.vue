<template>
  <Message severity="info">
    Please notice that the read-only information below is retrieved from your BCeID
    account and it is not possible to change it here. If any read-only information needs
    to be changed please visit
    <a rel="noopener" href="https://www.bceid.ca/" target="_blank">bceid.ca</a>.
  </Message>
  <Card class="p-m-4">
    <template #content>
      <formio
        formName="institutionUserProfile"
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
import { InstitutionDto } from "../../types";
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
        const bceidAccount = await UserService.shared.getInstitutionUser();
        if (bceidAccount) {
          initialData.value = {
            userFirstName: bceidAccount?.userFirstName,
            userLastName: bceidAccount?.userLastName,
            userEmail: bceidAccount?.userEmail
          };
        } else {
          toast.add({
            severity: "error",
            summary: "BCeID Account error",
            detail: "Unable to fetch account details.",
          });
        }

    });

    return {
      initialData,
      submitted,
    };
  },
};
</script>

