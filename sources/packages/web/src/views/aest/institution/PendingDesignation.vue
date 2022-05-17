<template>
  <header-navigator title="Institutions" subTitle="Designations" />
  <v-card class="mt-4 p-4">
    <body-header
      title="Pending Designations"
      subTitle="Make a determination on each designation after viewing it's content."
      :recordsCount="designations?.length"
      class="m-1"
    >
      <!-- TODO: While moving to vuetify3, data table search here(non-lazy) can be a OOTB search from vuetify datatable. -->
      <template #actions>
        <InputText
          type="text"
          placeholder="Search Designations"
          v-model="searchCriteria"
          data-cy="searchCriteria"
          @keyup.enter="searchDesignations"
        />
        <v-btn
          class="ml-2 primary-btn-background"
          data-cy="searchCriteriaButton"
          @click="searchDesignations"
          ><font-awesome-icon :icon="['fas', 'search']" class="mr-2"
        /></v-btn>
      </template>
    </body-header>
    <content-group>
      <toggle-content
        :toggled="!designations.length"
        message="There are no pending designation agreements"
      >
        <DataTable
          :value="designations"
          :paginator="true"
          :rows="DEFAULT_PAGE_LIMIT"
          :rowsPerPageOptions="PAGINATION_LIST"
          :totalRecords="designations.length"
        >
          <Column field="legalOperatingName" header="Institution Name"></Column>
          <Column header="Submitted on"
            ><template #body="slotProps">
              <span>{{
                dateOnlyLongString(slotProps.data.submittedDate)
              }}</span>
            </template>
          </Column>
          <Column header="Status"
            ><template #body="slotProps">
              <status-chip-designation
                :status="slotProps.data.designationStatus"
              /> </template
          ></Column>
          <Column>
            <template #body="slotProps">
              <v-btn
                variant="outlined"
                :color="COLOR_BLUE"
                @click="goToViewDesignation(slotProps.data.designationId)"
                data-cy="viewPendingDesignation"
              >
                View
              </v-btn>
            </template>
          </Column>
        </DataTable>
        <template #image>
          <v-img
            height="200"
            alt="You don't have any agreements yet"
            src="@/assets/images/designation_summary.svg"
          />
        </template>
      </toggle-content>
    </content-group>
  </v-card>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  PendingDesignationDto,
  DesignationAgreementStatus,
} from "@/types/contracts/DesignationAgreementContract";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  PAGINATION_LIST,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormatters } from "@/composables";
import { COLOR_BLUE } from "@/constants";
import StatusChipDesignation from "@/components/generic/StatusChipDesignation.vue";
import ToggleContent from "@/components/generic/ToggleContent.vue";
export default {
  components: {
    StatusChipDesignation,
    ToggleContent,
  },

  setup() {
    const router = useRouter();
    const designations = ref([] as PendingDesignationDto[]);
    const { dateOnlyLongString } = useFormatters();
    const searchCriteria = ref();

    const goToViewDesignation = (id: number) => {
      return router.push({
        name: AESTRoutesConst.DESIGNATION_VIEW,
        params: { designationId: id },
      });
    };

    onMounted(async () => {
      designations.value =
        await DesignationAgreementService.shared.getDesignationByStatus(
          DesignationAgreementStatus.Pending,
        );
    });

    const searchDesignations = async () => {
      designations.value =
        await DesignationAgreementService.shared.getDesignationByStatus(
          DesignationAgreementStatus.Pending,
          searchCriteria.value,
        );
    };

    return {
      designations,
      goToViewDesignation,
      DEFAULT_PAGE_LIMIT,
      DEFAULT_PAGE_NUMBER,
      PAGINATION_LIST,
      dateOnlyLongString,
      COLOR_BLUE,
      searchCriteria,
      searchDesignations,
    };
  },
};
</script>
