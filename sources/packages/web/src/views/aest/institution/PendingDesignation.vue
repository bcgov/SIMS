<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Institution requests" subTitle="Designations" />
    </template>
    <body-header
      title="Pending Designations"
      title-header-level="2"
      subTitle="Make a determination on each designation after viewing it's content."
      :recordsCount="designations?.length"
    >
      <template #actions>
        <v-text-field
          label="Search Designations"
          density="compact"
          v-model="searchCriteria"
          data-cy="searchDesignations"
          variant="outlined"
          @keyup.enter="searchDesignations"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        />
      </template>
    </body-header>
    <content-group>
      <toggle-content :toggled="!designations.length">
        <!-- TODO: While moving to vuetify3, data table search here(non-lazy) can be a OOTB search from vuetify datatable. -->
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
          <Column header="Action">
            <template #body="slotProps">
              <v-btn
                variant="outlined"
                color="primary"
                @click="goToViewDesignation(slotProps.data.designationId)"
                data-cy="viewPendingDesignation"
              >
                View
              </v-btn>
            </template>
          </Column>
        </DataTable>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { useRouter } from "vue-router";
import {
  PendingDesignationAgreementDetailsAPIOutDTO,
  DesignationAgreementStatus,
} from "@/services/http/dto";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  PAGINATION_LIST,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormatters } from "@/composables";
import StatusChipDesignation from "@/components/generic/StatusChipDesignation.vue";
import ToggleContent from "@/components/generic/ToggleContent.vue";
export default defineComponent({
  components: {
    StatusChipDesignation,
    ToggleContent,
  },

  setup() {
    const router = useRouter();
    const designations = ref(
      [] as PendingDesignationAgreementDetailsAPIOutDTO[],
    );
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
      searchCriteria,
      searchDesignations,
    };
  },
});
</script>
