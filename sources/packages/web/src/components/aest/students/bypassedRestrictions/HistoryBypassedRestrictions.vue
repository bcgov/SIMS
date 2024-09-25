<!-- eslint-disable vue/valid-v-slot -->
<template>
  <v-card class="mb-3">
    <v-container>
      <p class="label-bold-normal mb-0 text-body-2">
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
          :toggled="!bypassedRestrictions.bypasses.length || isDraftApplication"
          :message="getToggleContentMessage()"
        >
          <v-data-table
            :headers="ApplicationRestrictionManagementHeaders"
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
  ApplicationStatus,
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  ApplicationRestrictionManagementHeaders,
} from "@/types";
import { ref, onMounted, defineComponent, PropType } from "vue";
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
    applicationStatus: {
      type: String as PropType<ApplicationStatus>,
      required: true,
    },
  },
  setup(props) {
    const isDraftApplication =
      props.applicationStatus === ApplicationStatus.Draft;
    const bypassedRestrictions = ref({
      bypasses: [],
    } as ApplicationRestrictionBypassHistoryAPIOutDTO);
    onMounted(async () => {
      if (!isDraftApplication) {
        bypassedRestrictions.value =
          await ApplicationRestrictionBypassService.shared.getApplicationRestrictionBypassesHistory(
            props.applicationId,
          );
      }
    });

    const getRemoveBypassLabel = (isActive: boolean): string => {
      return isActive ? "Remove Bypass" : "Bypass Removed";
    };

    const getRemoveBypassColor = (isBypassActive: boolean): string => {
      return isBypassActive ? "primary" : "secondary";
    };

    const getToggleContentMessage = (): string => {
      if (props.applicationStatus === ApplicationStatus.Draft) {
        return "Bypass restriction disabled for draft applications.";
      } else if (!bypassedRestrictions.value.bypasses.length) {
        return "No bypassed restrictions found.";
      }
      return "";
    };

    return {
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      isDraftApplication,
      bypassedRestrictions,
      getRemoveBypassLabel,
      getRemoveBypassColor,
      getToggleContentMessage,
      ApplicationRestrictionManagementHeaders,
    };
  },
});
</script>
