<template>
  <full-page-container class="overflow-visible">
    <template #header
      ><header-navigator
        title="Corporate Accounting Services"
        subTitle="Invoices"
      />
    </template>
    <body-header-container>
      <template #header>
        <body-header
          title="Accounts payable invoicing"
          subTitle="Please see below the list of invoices batches."
          :recordsCount="invoiceBatches?.length"
        />
      </template>
      <content-group>
        <toggle-content
          :toggled="!invoiceBatches?.length && !invoiceBatchesLoading"
        >
          <v-data-table
            :headers="CASInvoicesHeaders"
            :items="invoiceBatches"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            :loading="invoiceBatchesLoading"
          >
            <template #[`item.batchDate`]="{ item }">
              {{ getISODateHourMinuteString(item.batchDate) }}
            </template>
            <template #[`item.batchName`]="{ item }">
              {{ item.batchName }}
            </template>
            <template #[`item.approvalStatus`]="{ item }">
              <status-invoice-batch-approval :status="item.approvalStatus" />
            </template>
            <template #[`item.approvalStatusUpdatedOn`]="{ item }">
              {{ getISODateHourMinuteString(item.approvalStatusUpdatedOn) }}
            </template>
            <template #[`item.approvalStatusUpdatedBy`]="{ item }">
              {{ item.approvalStatusUpdatedBy }}
            </template>
            <template #[`item.download`]="{ item }">
              <check-permission-role :role="Role.AESTEditCASSupplierInfo">
                <template #="{ notAllowed }">
                  <v-btn
                    color="primary"
                    :disabled="notAllowed"
                    @click="downloadBatch(item.id)"
                  >
                    Download</v-btn
                  >
                </template>
              </check-permission-role>
            </template>
          </v-data-table>
        </toggle-content>
      </content-group>
    </body-header-container>
  </full-page-container>
</template>

<script lang="ts">
import { useFormatters, useSnackBar } from "@/composables";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { CASInvoiceBatchService } from "@/services/CASInvoiceBatchService";
import { CASInvoiceBatchAPIOutDTO } from "@/services/http/dto";
import {
  CASInvoicesHeaders,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  Role,
} from "@/types";
import { defineComponent, onMounted, ref } from "vue";
import StatusInvoiceBatchApproval from "@/components/generic/StatusInvoiceBatchApproval.vue";

export default defineComponent({
  components: {
    CheckPermissionRole,
    StatusInvoiceBatchApproval,
  },
  setup() {
    const snackBar = useSnackBar();
    const { getISODateHourMinuteString } = useFormatters();
    const invoiceBatchesLoading = ref(false);
    const invoiceBatches = ref([] as CASInvoiceBatchAPIOutDTO[]);

    onMounted(async () => {
      try {
        invoiceBatchesLoading.value = true;
        const { batches } =
          await CASInvoiceBatchService.shared.getInvoiceBatches();
        invoiceBatches.value = batches;
      } catch (error: unknown) {
        snackBar.error("Unexpected error while loading CAS invoices.");
      } finally {
        invoiceBatchesLoading.value = false;
      }
    });

    const downloadBatch = async (batchId: number) => {
      try {
        snackBar.warn(
          `Invoice batch downloaded to be implemented (Batch ID ${batchId}).`,
        );
      } catch (error: unknown) {
        snackBar.error("Unexpected error while downloading invoice batch.");
      }
    };

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      Role,
      CASInvoicesHeaders,
      getISODateHourMinuteString,
      invoiceBatchesLoading,
      invoiceBatches,
      downloadBatch,
    };
  },
});
</script>
