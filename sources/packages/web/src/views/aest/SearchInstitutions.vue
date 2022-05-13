<template>
  <full-page-container>
    <h2 class="color-blue">Search Institution</h2>
    <v-row class="mt-5">
      <v-col>
        <div class="p-fluid p-formgrid p-grid">
          <div class="p-field p-col-12 p-md-4">
            <label class="field-required" for="legalName">Legal Name</label>
            <InputText
              name="legalName"
              data-cy="legalName"
              v-model="legalName"
              @keyup.enter="searchInstitutions"
            />
          </div>
          <div class="p-field p-col-12 p-md-4">
            <label class="field-required" for="operatingName"
              >Operating Name</label
            >
            <InputText
              name="operatingName"
              data-cy="operatingName"
              v-model="operatingName"
              @keyup.enter="searchInstitutions"
            />
          </div></div
      ></v-col>
      <v-col class="mt-9" cols="auto"
        ><v-btn
          :disabled="!legalName && !operatingName"
          color="primary"
          data-cy="searchInstitutions"
          @click="searchInstitutions"
          >Search</v-btn
        ></v-col
      >
    </v-row>

    <DataTable
      v-if="institutionsFound"
      class="mt-4"
      :autoLayout="true"
      :value="institutions"
    >
      <Column field="legalName" header="Legal Name" :sortable="true">
        <template #body="slotProps">
          <div class="p-text-capitalize">
            {{ slotProps.data.legalName }}
          </div>
        </template>
      </Column>
      <Column field="operatingName" header="Operating Name" :sortable="true">
        <template #body="slotProps">
          <div class="p-text-capitalize">
            {{ slotProps.data.operatingName }}
          </div>
        </template>
      </Column>
      <Column field="address" header="Address">
        <template #body="slotProps">
          <div class="p-text-capitalize">
            {{ getFormattedAddress(slotProps.data.address) }}
          </div>
        </template>
      </Column>
      <Column>
        <template #body="slotProps">
          <v-btn
            variant="outlined"
            data-cy="viewInstitution"
            @click="goToViewInstitution(slotProps.data.id)"
            >View</v-btn
          >
        </template>
      </Column>
    </DataTable>
  </full-page-container>
</template>
<script lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { InstitutionService } from "@/services/InstitutionService";
import { SearchInstitutionAPIOutDTO } from "@/services/http/dto";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useToastMessage, useFormatters } from "@/composables";

export default {
  setup() {
    const toast = useToastMessage();
    const router = useRouter();
    const legalName = ref("");
    const operatingName = ref("");
    const institutions = ref([] as SearchInstitutionAPIOutDTO[]);
    const goToViewInstitution = (institutionId: number) => {
      router.push({
        name: AESTRoutesConst.INSTITUTION_PROFILE,
        params: { institutionId: institutionId },
      });
    };
    const { getFormattedAddress } = useFormatters();
    const searchInstitutions = async () => {
      institutions.value = await InstitutionService.shared.searchInstitutions(
        legalName.value,
        operatingName.value,
      );
      if (institutions.value.length === 0) {
        toast.warn(
          "No Institutions found",
          "No Institutions found for the given search criteria.",
        );
      }
    };
    const institutionsFound = computed(() => {
      return institutions.value.length > 0;
    });
    return {
      legalName,
      operatingName,
      institutionsFound,
      searchInstitutions,
      institutions,
      goToViewInstitution,
      getFormattedAddress,
    };
  },
};
</script>
