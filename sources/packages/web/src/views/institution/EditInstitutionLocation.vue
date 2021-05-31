<template>
  <Card class="p-m-4">
    <template #content>
      <formio
        formName="editinstitutionlocation"
        :data="initialData"
        @submitted="submitted"
      ></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import formio from "../../components/generic/formio.vue";
import { onMounted, ref } from "vue";
import { Institutionlocation, InstitutionLocationsDetails } from "../../types";
import { InstitutionService } from "../../services/InstitutionService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";

export default {
  components: { formio },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    // Hooks
    const initialData = ref({});
    const toast = useToast();
    const router = useRouter();
    const submitted = async (data: Institutionlocation) => {
      try {
        await InstitutionService.shared.updateInstitutionLocation(
          props.locationId,
          data,
        );
        router.push({ name: InstitutionRoutesConst.MANAGE_LOCATIONS });
        toast.add({
          severity: "success",
          summary: `Your location information for ${data.locationName} have been updated`,
          detail: "Location Details have been updated!",
          life: 5000,
        });
      } catch (excp) {
        toast.add({
          severity: "error",
          summary: "Unexpected error",
          detail: "An error happened during the update process.",
          life: 5000,
        });
      }
    };
    onMounted(async () => {
      const detail: InstitutionLocationsDetails = await InstitutionService.shared.getInstitutionLocation(
        props.locationId,
      );
      initialData.value = {
        address1: detail.data.address.addressLine1,
        address2: detail.data.address.addressLine2,
        city: detail.data.address.city,
        country: detail.data.address.country,
        locationName: detail.name,
        postalZipCode: detail.data.address.postalCode,
        provinceState: detail.data.address.province,
      };
    });
    return {
      initialData,
      submitted,
    };
  },
};
</script>

<style></style>
