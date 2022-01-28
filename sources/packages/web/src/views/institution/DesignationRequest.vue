<template>
  <v-container class="ff-form-container">
    <v-row justify="center">
      <div class="pb-4 w-100 full-page-container-size">
        <h5 class="text-muted">Back to manage designation</h5>
        <h2 class="category-header-large">Request designation</h2>
      </div>
    </v-row>
  </v-container>

  <full-page-container>
    <formio formName="designationagreementdetails" :data="initialData"></formio>
  </full-page-container>
</template>

<script lang="ts">
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import formio from "@/components/generic/formio.vue";
import { ref, onMounted } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import { useFormatters } from "@/composables";

export default {
  components: { formio, FullPageContainer },
  setup() {
    const initialData = ref<{ institutionName: string; locations: any[] }>({
      institutionName: "Institution Name Test",
      locations: [],
    });
    const formatter = useFormatters();

    onMounted(async () => {
      const locations = await InstitutionService.shared.getAllInstitutionLocations();
      initialData.value.locations = locations.map(location => ({
        locationName: location.name,
        locationAddress: formatter.getFormattedAddress({
          ...location.data.address,
          provinceState: location.data.address.province,
        }),
      }));

      console.log(initialData.value.locations);
    });

    return { initialData };
  },
};
</script>
