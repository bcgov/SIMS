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
          <template #[`item.address`]="{ item }">
            <div class="p-text-capitalize">
              {{ getFormattedAddress(item.address) }}
            </div>
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
<script lang="ts">
import { ref, computed, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import { InstitutionService } from "@/services/InstitutionService";
import { SearchInstitutionAPIOutDTO } from "@/services/http/dto";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar, useFormatters } from "@/composables";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  SearchInstitutionsHeaders,
  VForm,
} from "@/types";

export default defineComponent({
  setup() {
    const searchInstitutionsForm = ref({} as VForm);
    const snackBar = useSnackBar();
    const router = useRouter();
    const { mobile: isMobile } = useDisplay();
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
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      SearchInstitutionsHeaders,
      isMobile,
    };
  },
});
</script>
