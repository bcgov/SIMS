<template>
  <content-group>
    <toggle-content :toggled="!designations.length" :message="toggleMessage">
      <v-data-table
        :headers="DesignationRequestsHeaders"
        :items="designations"
        :items-per-page="DEFAULT_PAGE_LIMIT"
        :items-per-page-options="ITEMS_PER_PAGE"
        :mobile="isMobile"
      >
        <template #[`item.submittedDate`]="{ item }">
          {{ dateOnlyLongString(item.submittedDate) }}
        </template>
        <template #[`item.startDate`]="{ item }">
          {{ dateOnlyLongString(item.startDate) }}
        </template>
        <template #[`item.endDate`]="{ item }">
          {{ dateOnlyLongString(item.endDate) }}
        </template>
        <template #[`item.designationStatus`]="{ item }">
          <status-chip-designation :status="item.designationStatus" />
        </template>
        <template #[`item.action`]="{ item }">
          <v-btn
            color="primary"
            @click="goToViewDesignation(item.designationId)"
          >
            View
          </v-btn>
        </template>
      </v-data-table>
    </toggle-content>
  </content-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { useDisplay } from "vuetify";

import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DesignationRequestsHeaders,
} from "@/types";
import { useFormatters, useInstitutionAuth } from "@/composables";
import ToggleContent from "@/components/generic/ToggleContent.vue";
import StatusChipDesignation from "@/components/generic/StatusChipDesignation.vue";
import { DesignationAgreementDetailsAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  emits: ["viewDesignation"],
  components: {
    ToggleContent,
    StatusChipDesignation,
  },
  props: {
    designations: {
      type: Object as PropType<DesignationAgreementDetailsAPIOutDTO[]>,
      required: true,
    },
    toggleMessage: {
      type: String,
      required: true,
    },
  },
  setup(_props, context) {
    const { isLegalSigningAuthority } = useInstitutionAuth();
    const { dateOnlyLongString } = useFormatters();
    const { mobile: isMobile } = useDisplay();

    const goToViewDesignation = (id: number) => {
      context.emit("viewDesignation", id);
    };

    return {
      goToViewDesignation,
      isLegalSigningAuthority,
      dateOnlyLongString,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      DesignationRequestsHeaders,
      isMobile,
    };
  },
});
</script>
