<template>
  <full-page-container>
    <body-header
      title="Search Institution"
      title-header-level="2"
      subTitle="Look up an institution by entering their information below."
    >
    </body-header>
    <v-form ref="searchInstitutionsForm">
      <content-group class="mb-8">
        <v-row>
          <v-col>
            <v-text-field
              density="compact"
              label="Legal name"
              variant="outlined"
              v-model="legalName"
              data-cy="legalName"
              @keyup.enter="searchInstitutions"
              hide-details
            />
          </v-col>
          <v-col>
            <v-text-field
              density="compact"
              label="Operating name"
              variant="outlined"
              v-model="operatingName"
              data-cy="operatingName"
              @keyup.enter="searchInstitutions"
              hide-details
            />
          </v-col>
          <v-col
            ><v-btn
              color="primary"
              data-cy="searchInstitutions"
              @click="searchInstitutions"
              >Search</v-btn
            ></v-col
          >
        </v-row>
        <v-input :rules="[isValidSearch()]" hide-details="auto" error />
      </content-group>
    </v-form>
    <template v-if="institutionsFound">
      <body-header title="Results" title-header-level="2" />
      <content-group>
        <DataTable
          v-if="institutionsFound"
          class="mt-4"
          :autoLayout="true"
          :scrollable="true"
          :value="institutions"
        >
          <Column
            field="operatingName"
            header="Operating Name"
            :sortable="true"
          >
            <template #body="slotProps">
              <div class="p-text-capitalize">
                {{ slotProps.data.operatingName }}
              </div>
            </template>
          </Column>
          <Column field="legalName" header="Legal Name" :sortable="true">
            <template #body="slotProps">
              <div class="p-text-capitalize">
                {{ slotProps.data.legalName }}
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
          <Column header="Action">
            <template #body="slotProps">
              <v-btn
                color="primary"
                data-cy="viewInstitution"
                @click="goToViewInstitution(slotProps.data.id)"
                >View</v-btn
              >
            </template>
          </Column>
        </DataTable>
      </content-group>
    </template>
  </full-page-container>
</template>
<script lang="ts">
import { ref, computed, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { InstitutionService } from "@/services/InstitutionService";
import { SearchInstitutionAPIOutDTO } from "@/services/http/dto";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar, useFormatters } from "@/composables";
import { VForm } from "@/types";

export default defineComponent({
  setup() {
    const searchInstitutionsForm = ref({} as VForm);
    const snackBar = useSnackBar();
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
    const isValidSearch = () => {
      const hasInput = !!operatingName.value || !!legalName.value;
      return hasInput || "Please provide at least one search parameter.";
    };
    const searchInstitutions = async () => {
      const validationResult = await searchInstitutionsForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      try {
        institutions.value = await InstitutionService.shared.searchInstitutions(
          legalName.value,
          operatingName.value,
        );

        if (institutions.value.length === 0) {
          snackBar.warn("No Institutions found for the given search criteria.");
        }
      } catch {
        snackBar.error("An error happened during the institution search.");
      }
    };
    const institutionsFound = computed(() => {
      return institutions.value.length > 0;
    });
    return {
      isValidSearch,
      legalName,
      operatingName,
      institutionsFound,
      searchInstitutions,
      institutions,
      goToViewInstitution,
      getFormattedAddress,
      searchInstitutionsForm,
    };
  },
});
</script>
