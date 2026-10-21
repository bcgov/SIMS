<template>
  <v-skeleton-loader v-if="loading" type="table-row@5" />
  <template v-else-if="summaryTotals">
    <h3 class="category-header-medium secondary-color">Processing Summary</h3>
    <v-table>
      <thead>
        <tr>
          <th
            v-for="summaryItem in processingSummaryData"
            :key="summaryItem.invoiceStatus"
            scope="col"
            class="text-left"
          >
            {{ summaryItem.label }}
          </th>
          <th scope="col" class="text-left">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td
            v-for="summaryItem in processingSummaryData"
            :key="summaryItem.invoiceStatus"
          >
            {{ summaryItem.count }}
          </td>
          <td class="font-weight-bold">
            {{ summaryTotals.processingSummary.totalInvoices }}
          </td>
        </tr>
      </tbody>
    </v-table>
    <h3 class="category-header-medium secondary-color mt-6">Award Totals</h3>
    <v-table v-if="summaryTotals.distributionTypeAmounts.length" striped="even">
      <thead>
        <tr>
          <th scope="col" class="text-left">Distribution Type</th>
          <th scope="col" class="text-left">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="distributionTypeAmount in summaryTotals.distributionTypeAmounts"
          :key="getDistributionTypeLabel(distributionTypeAmount)"
        >
          <td>
            {{ getDistributionTypeLabel(distributionTypeAmount) }}
          </td>
          <td>
            {{ formatCurrency(distributionTypeAmount.total) }}
          </td>
        </tr>
      </tbody>
    </v-table>
    <p v-else>No distribution amounts for this batch.</p>
  </template>
</template>

<script setup lang="ts">
import { useFormatters, useOffering, useSnackBar } from "@/composables";
import { CASInvoiceBatchService } from "@/services/CASInvoiceBatchService";
import {
  CASInvoiceBatchDistributionTypeAmountAPIOutDTO,
  CASInvoiceBatchSummaryTotalsAPIOutDTO,
} from "@/services/http/dto";
import { CASInvoiceStatus } from "@/types";
import { computed, ref, watchEffect } from "vue";

interface Props {
  casInvoiceBatchId: number;
}

const props = defineProps<Props>();
const snackBar = useSnackBar();
const { formatCurrency } = useFormatters();
const { mapOfferingIntensityAbbreviation } = useOffering();
const loading = ref(true);
const summaryTotals = ref<CASInvoiceBatchSummaryTotalsAPIOutDTO>();

/**
 * Loads the batch summary totals every time the batch row is expanded,
 * to ensure the most recent invoice statuses are displayed.
 */
watchEffect(async () => {
  try {
    loading.value = true;
    summaryTotals.value =
      await CASInvoiceBatchService.shared.getCASInvoiceBatchSummaryTotals(
        props.casInvoiceBatchId,
      );
  } catch {
    snackBar.error("Unexpected error while loading the batch details.");
  } finally {
    loading.value = false;
  }
});

/**
 * Gets the count of invoices for an invoice status.
 * @param invoiceStatus invoice status to get the count for.
 * @returns count of invoices, or zero when the status is not present.
 */
const getCountByInvoiceStatus = (invoiceStatus: CASInvoiceStatus): number =>
  summaryTotals.value?.processingSummary.invoiceStatusCounts.find(
    (statusCount) => statusCount.invoiceStatus === invoiceStatus,
  )?.count ?? 0;

/**
 * Processing summary items in the display order.
 */
const processingSummaryData = computed(() => [
  {
    invoiceStatus: CASInvoiceStatus.Sent,
    label: "Success",
    count: getCountByInvoiceStatus(CASInvoiceStatus.Sent),
  },
  {
    invoiceStatus: CASInvoiceStatus.ManualIntervention,
    label: "Error",
    count: getCountByInvoiceStatus(CASInvoiceStatus.ManualIntervention),
  },
  {
    invoiceStatus: CASInvoiceStatus.Resolved,
    label: "Resolved",
    count: getCountByInvoiceStatus(CASInvoiceStatus.Resolved),
  },
  {
    invoiceStatus: CASInvoiceStatus.Pending,
    label: "Pending",
    count: getCountByInvoiceStatus(CASInvoiceStatus.Pending),
  },
]);

/**
 * Gets the distribution type label, for instance, BCAG-FT DR.
 * @param distributionTypeAmount distribution type amount to get the label for.
 * @returns distribution type label.
 */
const getDistributionTypeLabel = (
  distributionTypeAmount: CASInvoiceBatchDistributionTypeAmountAPIOutDTO,
): string =>
  `${distributionTypeAmount.awardValueCode}-${mapOfferingIntensityAbbreviation(
    distributionTypeAmount.offeringIntensity,
  )} ${distributionTypeAmount.operationCode}`;
</script>
