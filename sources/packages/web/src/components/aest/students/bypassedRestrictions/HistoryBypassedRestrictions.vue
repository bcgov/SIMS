<template>
  <body-header-container :enable-card-view="true">
    <template #header
      ><body-header title="History of bypassed restrictions"
    /></template>
    <content-group class="mt-4">
      <toggle-content
        :toggled="!bypassedRestrictions.bypasses.length"
        message="No bypassed restrictions found."
      >
        <v-data-table
          :headers="ApplicationRestrictionManagementHeaders"
          :items="bypassedRestrictions.bypasses"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
        >
          <template #[`item.restrictionCategory`]="{ item }">
            {{ item.restrictionCategory }}
          </template>
          <template #[`item.restrictionCode`]="{ item }">
            {{ item.restrictionCode }}
          </template>
          <template #[`item.restrictionStatus`]="{ item }">
            <status-chip-restriction
              :status="
                item.isRestrictionActive
                  ? RestrictionStatus.Active
                  : RestrictionStatus.Resolved
              "
            />
          </template>
          <template #[`item.bypassStatus`]="{ item }">
            <status-chip-bypass :is-bypass-active="item.isBypassActive" />
          </template>
          <template #[`item.id`]>
            <v-btn
              color="primary"
              variant="text"
              class="text-decoration-underline"
              prepend-icon="fa:far fa-file-alt"
            >
              View Details</v-btn
            >
          </template>
          <template #[`item.removeBypassRule`]="{ item }">
            <v-btn
              :color="
                getRemoveBypassColor(
                  item.isBypassActive,
                  item.isRestrictionActive,
                )
              "
              :disabled="!item.isBypassActive || !item.isRestrictionActive"
            >
              {{ getRemoveBypassLabel(item.isBypassActive) }}</v-btn
            >
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
  </body-header-container>
</template>
<script lang="ts">
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  ITEMS_PER_PAGE,
  ApplicationRestrictionManagementHeaders,
  RestrictionStatus,
} from "@/types";
import { ref, onMounted, defineComponent } from "vue";
import StatusChipBypass from "@/components/generic/StatusChipBypass.vue";
import { ApplicationRestrictionBypassService } from "@/services/ApplicationRestrictionBypassService";
import { ApplicationRestrictionBypassHistoryAPIOutDTO } from "@/services/http/dto";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";

export default defineComponent({
  components: {
    StatusChipBypass,
    StatusChipRestriction,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const bypassedRestrictions = ref({
      bypasses: [],
    } as ApplicationRestrictionBypassHistoryAPIOutDTO);
    onMounted(async () => {
      bypassedRestrictions.value =
        await ApplicationRestrictionBypassService.shared.getApplicationRestrictionBypassesHistory(
          props.applicationId,
        );
    });

    const getRemoveBypassLabel = (isBypassActive: boolean): string => {
      return isBypassActive ? "Remove Bypass" : "Bypass Removed";
    };

    const getRemoveBypassColor = (
      isBypassActive: boolean,
      isRestrictionActive: boolean,
    ): string => {
      return !isBypassActive || !isRestrictionActive ? "secondary" : "primary";
    };

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      PAGINATION_LIST,
      RestrictionStatus,
      bypassedRestrictions,
      getRemoveBypassLabel,
      getRemoveBypassColor,
      ApplicationRestrictionManagementHeaders,
    };
  },
});
</script>
