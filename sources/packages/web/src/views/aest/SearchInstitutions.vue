<template>
  <full-page-container>
    <h2 class="color-blue">Search Institution</h2>
    <v-row class="mt-5">
      <v-col><label for="legalName">Legal Name</label></v-col>
      <v-col><label for="operatingName">Operating Name</label></v-col>
      <v-col></v-col>
      <v-col></v-col>
    </v-row>
    <v-row>
      <v-col><InputText type="text" v-model="legalName"/></v-col>
      <v-col><InputText type="text" v-model="operatingName"/></v-col>
      <v-col></v-col>
      <v-col
        ><v-btn
          :disabled="!legalName && !operatingName"
          color="primary"
          class="p-button-raised"
          @click="searchInstitutions()"
        >
          <v-icon size="25" class="mr-2">mdi-account-outline</v-icon>
          Search
        </v-btn>
      </v-col>
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
          <span class="mt-2">
            {{ slotProps.data.address.addressLine1 }}
            <br />
          </span>
          <span v-if="slotProps.data.address.addressLine2">
            {{ slotProps.data.address.addressLine2 }}
            <br />
          </span>
          <span>
            {{ slotProps.data.address.city }},
            {{ slotProps.data.address.provinceState }},
            {{ slotProps.data.address.postalZipCode }}
            <br />
          </span>
          <span>{{ slotProps.data.address.country }}</span>
        </template>
      </Column>
      <Column>
        <template #body="slotProps">
          <v-btn outlined @click="goToViewInstitution(slotProps.data.id)"
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
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { SearchInstitutionResp } from "@/types";
import { useToastMessage } from "@/composables";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";

export default {
  components: {
    FullPageContainer,
  },

  setup() {
    const toast = useToastMessage();
    const router = useRouter();
    const legalName = ref("");
    const operatingName = ref("");
    const institutions = ref([] as SearchInstitutionResp[]);
    const goToViewInstitution = (institutionId: number) => {
      router.push({
        name: AESTRoutesConst.INSTITUTION_DETAILS,
        params: { institutionId: institutionId },
      });
    };
    const searchInstitutions = async () => {
      institutions.value = await InstitutionService.shared.searchInstitutions(
        legalName.value,
        operatingName.value,
      );
      if (institutions.value.length == 0) {
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
    };
  },
};
</script>
