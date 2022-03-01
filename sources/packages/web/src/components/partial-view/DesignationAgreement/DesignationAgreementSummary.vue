<template>
  <content-group>
    <toggle-content
      :toggled="!designations.length"
      message="You don't have any agreements yet"
    >
      <DataTable
        :value="designations"
        :paginator="true"
        :rows="DEFAULT_PAGE_LIMIT"
        :rowsPerPageOptions="PAGINATION_LIST"
        :totalRecords="designations.length"
      >
        <Column header="Submitted on"
          ><template #body="slotProps">
            <span>{{ dateOnlyLongString(slotProps.data.submittedDate) }}</span>
          </template>
        </Column>
        <Column header="Start date"
          ><template #body="slotProps">
            <span>{{ dateOnlyLongString(slotProps.data.startDate) }}</span>
          </template>
        </Column>
        <Column header="Expiry date"
          ><template #body="slotProps">
            <span>{{ dateOnlyLongString(slotProps.data.endDate) }}</span>
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
              outlined
              :color="COLOR_BLUE"
              @click="goToViewDesignation(slotProps.data.designationId)"
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
</template>

<script lang="ts">
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  PAGINATION_LIST,
} from "@/types";
import { useFormatters, useInstitutionAuth } from "@/composables";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import ToggleContent from "@/components/generic/ToggleContent.vue";
import StatusChipDesignation from "@/components/generic/StatusChipDesignation.vue";
import { SetupContext } from "vue";
import { COLOR_BLUE } from "@/constants";

export default {
  emits: ["viewDesignation"],
  components: {
    ContentGroup,
    ToggleContent,
    StatusChipDesignation,
  },
  props: {
    designations: {
      type: Object,
      required: true,
    },
  },
  setup(props: any, context: SetupContext) {
    const { isLegalSigningAuthority } = useInstitutionAuth();
    const { dateOnlyLongString } = useFormatters();

    const goToViewDesignation = (id: number) => {
      context.emit("viewDesignation", id);
    };

    return {
      goToViewDesignation,
      isLegalSigningAuthority,
      dateOnlyLongString,
      DEFAULT_PAGE_LIMIT,
      DEFAULT_PAGE_NUMBER,
      PAGINATION_LIST,
      COLOR_BLUE,
    };
  },
};
</script>
