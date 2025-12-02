<template>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header
        title="Overawards"
        sub-title="Overaward amounts generated due to application reassessments"
      />
    </template>
    <content-group>
      <toggle-content
        :toggled="!overawards.length"
        message="No overawards found."
      >
        <v-data-table
          :headers="OverawardsHeaders"
          :items="overawards"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
        >
          <template #[`item.dateAdded`]="{ item }">
            {{ formatDateAdded(item) }}
          </template>
          <template #[`item.applicationNumber`]="{ item }">
            {{ emptyStringFiller(item.applicationNumber) }}
          </template>
          <template #[`item.overawardOrigin`]="{ item }">
            {{ item.overawardOrigin }}
          </template>
          <template #[`item.assessmentTriggerType`]="{ item }">
            {{ emptyStringFiller(item.assessmentTriggerType) }}
          </template>
          <template #[`item.awardValueCode`]="{ item }">
            {{ item.awardValueCode }}
          </template>
          <template #[`item.overawardValue`]="{ item }">
            {{ formatCurrency(item.overawardValue) }}
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
  </body-header-container>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header
        title="Overaward deductions"
        sub-title="History of money that was deducted from one or more applications to pay back what is owed"
      >
        <template #actions v-if="allowManualOverawardDeduction">
          <check-permission-role :role="Role.StudentAddOverawardManual">
            <template #="{ notAllowed }">
              <v-btn
                class="ml-2 float-right"
                color="primary"
                :disabled="notAllowed"
                prepend-icon="fa:fa fa-plus-circle"
                @click="addManualOveraward"
              >
                Add manual record
              </v-btn>
            </template>
          </check-permission-role>
        </template></body-header
      >
    </template>
    <content-group>
      <toggle-content
        :toggled="!overawardDeductions.length"
        message="No overaward deductions found."
      >
        <v-data-table
          :headers="overawardDeductionsHeaders"
          :items="overawardDeductions"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
        >
          <template #[`item.dateAdded`]="{ item }">
            {{ formatDateAdded(item) }}
          </template>
          <template #[`item.applicationNumber`]="{ item }">
            {{ emptyStringFiller(item.applicationNumber) }}
          </template>
          <template #[`item.overawardOrigin`]="{ item }">
            {{ item.overawardOrigin }}
          </template>
          <template #[`item.addedByUser`]="{ item }">
            {{ emptyStringFiller(item.addedByUser) }}
          </template>
          <template #[`item.awardValueCode`]="{ item }">
            {{ item.awardValueCode }}
          </template>
          <template #[`item.overawardValue`]="{ item }">
            {{ formatCurrency(item.overawardValue) }}
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>

    <add-manual-overaward-deduction
      ref="addManualOverawardDeduction"
      :allowed-role="Role.StudentAddOverawardManual"
    />
  </body-header-container>
</template>
<script lang="ts">
import { ref, onMounted, defineComponent, computed } from "vue";
import { useDisplay } from "vuetify";

import { OverawardService } from "@/services/OverawardService";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DisbursementOverawardOriginType,
  Role,
  OverawardDeductionsHeaders,
  OverawardsHeaders,
} from "@/types";
import { useFormatters, ModalDialog, useSnackBar } from "@/composables";
import {
  OverawardAPIOutDTO,
  OverawardManualRecordAPIInDTO,
} from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import AddManualOverawardDeduction from "@/components/aest/students/modals/AddManualOverawardDeduction.vue";

export default defineComponent({
  components: { CheckPermissionRole, AddManualOverawardDeduction },
  emits: {
    manualOverawardAdded: null,
  },
  props: {
    studentId: {
      type: Number,
      required: false,
      default: undefined,
    },
    showAddedBy: {
      type: Boolean,
      required: false,
      default: false,
    },
    allowManualOverawardDeduction: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, context) {
    const { dateOnlyLongString, formatCurrency, emptyStringFiller } =
      useFormatters();
    const snackBar = useSnackBar();
    const { mobile: isMobile } = useDisplay();

    const overawardDetails = ref([] as OverawardAPIOutDTO[]);
    const addManualOverawardDeduction = ref(
      {} as ModalDialog<OverawardManualRecordAPIInDTO | boolean>,
    );
    const overawardDeductionOriginTypes = new Set([
      DisbursementOverawardOriginType.AwardDeducted,
      DisbursementOverawardOriginType.ManualRecord,
    ]);
    const overawards = computed(() =>
      overawardDetails.value.filter(
        (overaward) =>
          !overawardDeductionOriginTypes.has(overaward.overawardOrigin),
      ),
    );

    const overawardDeductions = computed(() =>
      overawardDetails.value.filter((overaward) =>
        overawardDeductionOriginTypes.has(overaward.overawardOrigin),
      ),
    );

    const addManualOveraward = async () => {
      const manualOveraward =
        await addManualOverawardDeduction.value.showModal();
      if (manualOveraward) {
        try {
          await OverawardService.shared.addManualOverawardDeduction(
            props.studentId as number,
            manualOveraward as OverawardManualRecordAPIInDTO,
          );
          snackBar.success("Overaward deduction added successfully.");
          context.emit("manualOverawardAdded");
          await loadOverawardDetails();
        } catch {
          snackBar.error(
            "An error happened while adding manual overaward deduction.",
          );
        }
      }
    };

    const loadOverawardDetails = async () => {
      overawardDetails.value =
        await OverawardService.shared.getStudentOverawards(props.studentId);
    };

    const formatDateAdded = (overaward: OverawardAPIOutDTO): string => {
      return overaward.dateAdded
        ? dateOnlyLongString(overaward.dateAdded)
        : dateOnlyLongString(overaward.createdAt);
    };

    const overawardDeductionsHeaders = computed(() => {
      return props.showAddedBy
        ? OverawardDeductionsHeaders
        : OverawardDeductionsHeaders.filter(
            (header) => header.key !== "addedByUser",
          );
    });

    onMounted(loadOverawardDetails);

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      dateOnlyLongString,
      overawards,
      overawardDeductions,
      formatCurrency,
      Role,
      addManualOverawardDeduction,
      addManualOveraward,
      emptyStringFiller,
      formatDateAdded,
      OverawardsHeaders,
      overawardDeductionsHeaders,
      isMobile,
    };
  },
});
</script>
