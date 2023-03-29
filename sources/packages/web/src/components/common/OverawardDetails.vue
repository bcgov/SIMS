<template>
  <body-header-container :enableCardView="true">
    <template #header>
      <body-header
        title="Overawards"
        subTitle="Overaward amounts generated due to application reassessments"
      />
    </template>
    <content-group>
      <toggle-content :toggled="!overawards.length">
        <DataTable
          :value="overawards"
          class="p-m-4"
          :paginator="true"
          :rows="pageLimit"
          :rowsPerPageOptions="PAGINATION_LIST"
        >
          <Column field="dateAdded" header="Date added">
            <template #body="slotProps">
              <span>
                {{
                  slotProps.data.dateAdded
                    ? dateOnlyLongString(slotProps.data.dateAdded)
                    : dateOnlyLongString(slotProps.data.createdAt)
                }}
              </span>
            </template>
          </Column>
          <Column field="applicationNumber" header="Application #"
            ><template #body="slotProps">
              <span>
                {{ emptyStringFiller(slotProps.data.applicationNumber) }}
              </span>
            </template></Column
          >
          <Column field="overawardOrigin" header="Origin"></Column>
          <Column field="assessmentTriggerType" header="Type"
            ><template #body="slotProps">
              <span>
                {{ emptyStringFiller(slotProps.data.assessmentTriggerType) }}
              </span>
            </template></Column
          >
          <Column field="awardValueCode" header="Award"></Column>
          <Column field="overawardValue" header="Overaward amount">
            <template #body="slotProps">
              <span>
                {{ formatCurrency(slotProps.data.overawardValue) }}
              </span>
            </template></Column
          >
        </DataTable>
      </toggle-content>
    </content-group>
  </body-header-container>
  <body-header-container :enableCardView="true">
    <template #header>
      <body-header
        title="Overaward deductions"
        subTitle="History of money that was deducted from one or more applications to pay back what is owed"
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
      <toggle-content :toggled="!overawardDeductions.length">
        <DataTable
          :value="overawardDeductions"
          class="p-m-4"
          :paginator="true"
          :rows="pageLimit"
          :rowsPerPageOptions="PAGINATION_LIST"
        >
          <Column field="dateAdded" header="Date added">
            <template #body="slotProps">
              <span>
                {{
                  slotProps.data.dateAdded
                    ? dateOnlyLongString(slotProps.data.dateAdded)
                    : dateOnlyLongString(slotProps.data.createdAt)
                }}
              </span>
            </template>
          </Column>
          <Column field="applicationNumber" header="Application #">
            <template #body="slotProps">
              <span>
                {{ emptyStringFiller(slotProps.data.applicationNumber) }}
              </span>
            </template></Column
          >
          <Column field="overawardOrigin" header="Origin"></Column>
          <Column v-if="showAddedBy" field="addedByUser" header="Added By"
            ><template #body="slotProps">
              <span>
                {{ emptyStringFiller(slotProps.data.addedByUser) }}
              </span>
            </template></Column
          >
          <Column field="awardValueCode" header="Award"></Column>
          <Column field="overawardValue" header="Amount deducted">
            <template #body="slotProps">
              <span>
                {{ formatCurrency(slotProps.data.overawardValue) }}
              </span>
            </template></Column
          >
        </DataTable>
      </toggle-content>
    </content-group>

    <add-manual-overaward-deduction
      ref="addManualOverawardDeduction"
      :allowedRole="Role.StudentAddOverawardManual"
    />
  </body-header-container>
</template>
<script lang="ts">
import { ref, onMounted, defineComponent, computed } from "vue";
import { OverawardService } from "@/services/OverawardService";
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  DEFAULT_PAGE_NUMBER,
  DisbursementOverawardOriginType,
  Role,
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
    const page = ref(DEFAULT_PAGE_NUMBER);
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const { dateOnlyLongString, formatCurrency, emptyStringFiller } =
      useFormatters();
    const snackBar = useSnackBar();
    const overawardDetails = ref([] as OverawardAPIOutDTO[]);
    const addManualOverawardDeduction = ref(
      {} as ModalDialog<OverawardManualRecordAPIInDTO | boolean>,
    );
    const overawardDeductionOriginTypes = [
      DisbursementOverawardOriginType.AwardDeducted,
      DisbursementOverawardOriginType.ManualRecord,
    ];
    const overawards = computed(() =>
      overawardDetails.value.filter(
        (overaward) =>
          !overawardDeductionOriginTypes.includes(overaward.overawardOrigin),
      ),
    );

    const overawardDeductions = computed(() =>
      overawardDetails.value.filter((overaward) =>
        overawardDeductionOriginTypes.includes(overaward.overawardOrigin),
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

    onMounted(loadOverawardDetails);

    return {
      page,
      pageLimit,
      PAGINATION_LIST,
      dateOnlyLongString,
      overawards,
      overawardDeductions,
      formatCurrency,
      Role,
      addManualOverawardDeduction,
      addManualOveraward,
      emptyStringFiller,
    };
  },
});
</script>
