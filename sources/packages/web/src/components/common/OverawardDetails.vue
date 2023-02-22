<template>
  <v-card class="mb-5">
    <v-container>
      <body-header
        title="Overawards"
        subTitle="Overaward amounts generated due to application reassessments"
      />
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
                  {{ dateOnlyLongString(slotProps.data.dateAdded) }}
                </span>
              </template>
            </Column>
            <Column field="applicationNumber" header="Application #"
              ><template #body="slotProps">
                <span>
                  {{ slotProps.data.applicationNumber ?? "-" }}
                </span>
              </template></Column
            >
            <Column field="overawardOrigin" header="Origin"></Column>
            <Column field="assessmentTriggerType" header="Type"></Column>
            <Column field="awardValueCode" header="Award"></Column>
            <Column field="overawardValue" header="Overaward amount">
              <template #body="slotProps">
                <span>
                  {{ formatCurrency(slotProps.data.overawardValue, "") }}
                </span>
              </template></Column
            >
          </DataTable>
        </toggle-content>
      </content-group>
    </v-container>
  </v-card>
  <v-card class="mb-5">
    <v-container>
      <body-header
        title="Overaward deductions"
        subTitle="History of money that was deducted from one or more applications to pay back what is owed"
      >
        <template #actions>
          <check-permission-role :role="Role.StudentAddOverawardManual">
            <template #="{ notAllowed }">
              <v-btn
                class="ml-2 float-right"
                color="primary"
                :disabled="notAllowed"
                prepend-icon="fa:fa fa-plus-circle"
              >
                Add manual record
              </v-btn>
            </template>
          </check-permission-role>
        </template></body-header
      >
      <content-group>
        <toggle-content :toggled="!overawards.length">
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
                  {{ dateOnlyLongString(slotProps.data.dateAdded) }}
                </span>
              </template>
            </Column>
            <Column field="applicationNumber" header="Application #">
              <template #body="slotProps">
                <span>
                  {{ slotProps.data.applicationNumber ?? "-" }}
                </span>
              </template></Column
            >
            <Column field="overawardOrigin" header="Origin"></Column>
            <Column v-if="showAddedBy" field="addedByUser" header="Added By"
              ><template #body="slotProps">
                <span>
                  {{ slotProps.data.addedByUser ?? "-" }}
                </span>
              </template></Column
            >
            <Column field="awardValueCode" header="Award"></Column>
            <Column field="overawardValue" header="Overaward amount">
              <template #body="slotProps">
                <span>
                  {{ formatCurrency(slotProps.data.overawardValue, "") }}
                </span>
              </template></Column
            >
          </DataTable>
        </toggle-content>
      </content-group>
    </v-container>
  </v-card>
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
import { useFormatters } from "@/composables";
import { OverawardAPIOutDTO } from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  components: { CheckPermissionRole },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    showAddedBy: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const page = ref(DEFAULT_PAGE_NUMBER);
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const { dateOnlyLongString, formatCurrency } = useFormatters();
    const overawardDetails = ref([] as OverawardAPIOutDTO[]);
    const overawards = computed(() =>
      overawardDetails.value.filter(
        (overaward) =>
          ![
            DisbursementOverawardOriginType.AwardDeducted,
            DisbursementOverawardOriginType.ManualRecord,
          ].includes(overaward.overawardOrigin),
      ),
    );

    const overawardDeductions = computed(() =>
      overawardDetails.value.filter((overaward) =>
        [
          DisbursementOverawardOriginType.AwardDeducted,
          DisbursementOverawardOriginType.ManualRecord,
        ].includes(overaward.overawardOrigin),
      ),
    );

    onMounted(async () => {
      overawardDetails.value =
        await OverawardService.shared.getStudentOverawards(props.studentId);
    });

    return {
      page,
      pageLimit,
      PAGINATION_LIST,
      dateOnlyLongString,
      overawards,
      overawardDeductions,
      formatCurrency,
      Role,
    };
  },
});
</script>
