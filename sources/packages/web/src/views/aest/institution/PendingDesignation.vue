<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Institution requests" sub-title="Designations" />
    </template>
    <body-header
      title="Pending designation requests"
      sub-title="Pending designation requests that require ministry review."
      :records-count="designations?.length"
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
      <toggle-content
        :toggled="!designations.length"
        message="No pending designation requests found."
      >
        <v-data-table
          :headers="PendingDesignationsHeaders"
          :items="designations"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
        >
          <template #[`item.legalOperatingName`]="{ item }">
            {{ item.legalOperatingName }}
          </template>
          <template #[`item.submittedDate`]="{ item }">
            {{ dateOnlyLongString(item.submittedDate) }}
          </template>
          <template #[`item.designationStatus`]="{ item }">
            <status-chip-designation :status="item.designationStatus" />
          </template>
          <template #[`item.designationId`]="{ item }">
            <v-btn
              variant="outlined"
              color="primary"
              @click="goToViewDesignation(item.designationId)"
              data-cy="viewPendingDesignation"
            >
              View
            </v-btn>
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import {
  PendingDesignationAgreementDetailsAPIOutDTO,
  DesignationAgreementStatus,
} from "@/services/http/dto";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  PendingDesignationsHeaders,
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
    const { mobile: isMobile } = useDisplay();

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
      ITEMS_PER_PAGE,
      dateOnlyLongString,
      searchCriteria,
      searchDesignations,
      PendingDesignationsHeaders,
      isMobile,
    };
  },
});
</script>
