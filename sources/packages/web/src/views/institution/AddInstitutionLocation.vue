<template>
  <Card class="p-m-4">
    <template #content>
      <formio
        formName="institutionlocationcreation"
        @submitted="submitted"
      ></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import formio from "../../components/generic/formio.vue";
import { Institutionlocation } from "../../types";
import { InstitutionService } from "../../services/InstitutionService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";

export default {
  components: { formio },
  props: {
    createMode: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  setup(props: any) {
    // Hooks
    const toast = useToast();
    const router = useRouter();
    const submitted = async (data: Institutionlocation) => {
      if (props.createMode) {
        try {
          await InstitutionService.shared.createInstitutionLocation(data);
          router.push({ name: InstitutionRoutesConst.MANAGE_LOCATIONS });
          toast.add({
            severity: "success",
            summary: "Created!",
            detail: "Institution Location created Successfully!",
            life: 5000,
          });
        } catch (excp) {
          toast.add({
            severity: "error",
            summary: "Unexpected error",
            detail: "An error happened during the create process.",
            life: 5000,
          });
        }
      }
    };
    return {
      submitted
    };
  },
};
</script>

<style></style>
