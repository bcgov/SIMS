<!-- eslint-disable vue/valid-v-slot -->
<template>
  <v-card class="mb-6">
    <v-container>
      <p class="label-bold-normal mb-0">
        This feature can be used to ignore specific restrictions for specific
        applications. Restrictions can be ignored for one, or all, disbursements
        associated with an application. If a restriction is ignored, it's effect
        will be suspended. For example, if a restriction typically prevents an
        eCert from getting produced and sent to NSLSC 5 days prior to study
        start dates, then ignoring that restriction will enable the eCert to get
        produced and sent to NSLSC, thereby 'bypassing' the restriction. Please
        see training material for additional information.
      </p>
    </v-container>
  </v-card>
  <v-card>
    <v-container>
      <body-header title="History of Bypassed Restrictions" class="m-1" />
      <content-group class="mt-4">
        <toggle-content
          :toggled="!bypassedRestrictions.bypasses.length"
          message="No bypassed restrictions found."
        >
          <v-data-table
            :headers="RestrictionManagementHeaders"
            :items="bypassedRestrictions.bypasses"
            :items-per-page="DEFAULT_PAGE_LIMIT"
          >
            <template #[`item.restrictionType`]="{ item }">
              {{ item.restrictionType }}
            </template>
            <template #[`item.restrictionCode`]="{ item }">
              {{ item.restrictionCode }}
            </template>
            <template #[`item.isActive`]="{ item }">
              <status-chip-bypass :is-active="item.isActive" />
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
            <template #[`item.isBypassActive`]="{ item }">
              <v-btn
                :color="getRemoveBypassColor(item.isBypassActive)"
                :disabled="!item.isBypassActive"
              >
                {{ getRemoveBypassLabel(item.isBypassActive) }}</v-btn
              >
            </template>
          </v-data-table>
        </toggle-content>
      </content-group>
    </v-container>
  </v-card>
</template>
<script lang="ts">
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  RestrictionManagementHeaders,
} from "@/types";
import { ref, onMounted, defineComponent } from "vue";
import { ApplicationRestrictionBypassHistoryAPIOutDTO } from "@/services/http/dto/ApplicationRestrictionBypass.dto";
import StatusChipBypass from "@/components/generic/StatusChipBypass.vue";
import { ApplicationRestrictionBypassService } from "@/services/ApplicationRestrictionBypassService";

export default defineComponent({
  components: {
    StatusChipBypass,
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

    const getRemoveBypassLabel = (isActive: boolean): string => {
      return isActive ? "Remove Bypass" : "Bypass Removed";
    };

    const getRemoveBypassColor = (isBypassActive: boolean): string => {
      return isBypassActive ? "primary" : "secondary";
    };

    return {
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      bypassedRestrictions,
      getRemoveBypassLabel,
      getRemoveBypassColor,
      RestrictionManagementHeaders,
    };
  },
});
</script>
