<template>
  <full-page-container>
    <body-header
      title="Search Institution"
      sub-title="Look up an institution by entering their information below."
    >
    </body-header>
    <v-form ref="searchInstitutionsForm">
      <content-group class="mb-8">
        <v-row>
          <v-col cols="12" md>
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
          <v-col cols="12" md>
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
          <v-col cols="12" md>
            <v-text-field
              density="compact"
              label="Institution location code"
              variant="outlined"
              :maxlength="4"
              :model-value="locationCode"
              @update:model-value="locationCode = $event?.toUpperCase() ?? ''"
              @keyup.enter="searchInstitutions"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="auto" class="d-flex justify-end">
            <v-btn
              color="primary"
              data-cy="searchInstitutions"
              @click="searchInstitutions"
            >
              Search
            </v-btn>
          </v-col>
        </v-row>
        <v-input :rules="[isValidSearch()]" hide-details="auto" error />
      </content-group>
    </v-form>
    <template v-if="institutionsFound">
      <body-header title="Results" />
      <content-group>
        <v-data-table
          v-if="institutionsFound"
          :headers="SearchInstitutionsHeaders"
          :items="institutions"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
        >
          <template #[`item.operatingName`]="{ item }">
            <div class="p-text-capitalize">
              {{ item.operatingName }}
            </div>
          </template>
          <template #[`item.legalName`]="{ item }">
            <div class="p-text-capitalize">
              {{ item.legalName }}
            </div>
          </template>
          <template #[`item.country`]="{ item }">
            {{ emptyStringFiller(item.country) }}
          </template>
          <template #[`item.classification`]="{ item }">
            {{ getClassificationToDisplay(item.classification) }}
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn
              color="primary"
              data-cy="viewInstitution"
              @click="goToViewInstitution(item.id)"
              >View</v-btn
            >
          </template>
        </v-data-table>
      </content-group>
    </template>
  </full-page-container>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import { InstitutionService } from "@/services/InstitutionService";
import { SearchInstitutionAPIOutDTO } from "@/services/http/dto";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar, useFormatters, useInstitution } from "@/composables";
import type { VForm } from "@/types";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  SearchInstitutionsHeaders,
} from "@/types";

const searchInstitutionsForm = ref({} as VForm);
const snackBar = useSnackBar();
const { emptyStringFiller } = useFormatters();
const { getClassificationToDisplay } = useInstitution();
const router = useRouter();
const { mobile: isMobile } = useDisplay();
const legalName = ref("");
const operatingName = ref("");
const locationCode = ref("");
const institutions = ref([] as SearchInstitutionAPIOutDTO[]);
const goToViewInstitution = (institutionId: number) => {
  router.push({
    name: AESTRoutesConst.INSTITUTION_PROFILE,
    params: { institutionId: institutionId },
  });
};
const isValidSearch = () => {
  const hasInput =
    !!operatingName.value || !!legalName.value || !!locationCode.value;
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
      locationCode.value,
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
</script>
