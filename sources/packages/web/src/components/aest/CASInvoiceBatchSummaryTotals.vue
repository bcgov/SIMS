<template>
  <v-skeleton-loader v-if="loading" type="table-row@5" />
  <template v-else-if="summaryTotals">
    <h3 class="category-header-medium secondary-color">Processing Summary</h3>
    <v-table striped="even">
      <thead>
        <tr>
          <th id="invoiceStatus" class="text-left">Result</th>
          <th id="invoiceCount" class="text-left">Count</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="invoiceStatusCount in sortedInvoiceStatusCounts"
          :key="invoiceStatusCount.invoiceStatus"
        >
          <td headers="invoiceStatus">
            {{ getInvoiceStatusLabel(invoiceStatusCount.invoiceStatus) }}
          </td>
          <td headers="invoiceCount">{{ invoiceStatusCount.count }}</td>
        </tr>
        <tr class="font-weight-bold">
          <td headers="invoiceStatus">Total</td>
          <td headers="invoiceCount">
            {{ summaryTotals.processingSummary.totalInvoices }}
          </td>
        </tr>
      </tbody>
    </v-table>
    <h3 class="category-header-medium secondary-color mt-6">Award Totals</h3>
    <v-table v-if="summaryTotals.awardAmounts.length" striped="even">
      <thead>
        <tr>
          <th id="distributionAccount" class="text-left">Distribution</th>
          <th id="awardAmount" class="text-left">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="distributionTotal in summaryTotals.awardAmounts"
          :key="getDistributionTotalLabel(distributionTotal)"
        >
          <td headers="distributionAccount">
            {{ getDistributionTotalLabel(distributionTotal) }}
          </td>
          <td headers="awardAmount">
            {{ formatCurrency(distributionTotal.total) }}
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
  CASInvoiceBatchAwardAmountAPIOutDTO,
  CASInvoiceBatchSummaryTotalsAPIOutDTO,
} from "@/services/http/dto";
import { CASInvoiceStatus } from "@/types";
import { computed, onMounted, ref } from "vue";

interface Props {
  casInvoiceBatchId: number;
}

/**
 * Label and display order of each invoice status in the processing summary.
 */
const InvoiceStatusDisplay: Record<
  CASInvoiceStatus,
  { label: string; order: number }
> = {
  [CASInvoiceStatus.Sent]: { label: "Success", order: 1 },
  [CASInvoiceStatus.ManualIntervention]: { label: "Error", order: 2 },
  [CASInvoiceStatus.Resolved]: { label: "Resolved", order: 3 },
  [CASInvoiceStatus.Pending]: { label: "Pending", order: 4 },
};

const props = defineProps<Props>();
const snackBar = useSnackBar();
const { formatCurrency } = useFormatters();
const { mapOfferingIntensityAbbreviation } = useOffering();
const loading = ref(false);
const summaryTotals = ref<CASInvoiceBatchSummaryTotalsAPIOutDTO>();

/**
 * Loads the batch summary totals every time the component is mounted,
 * which happens every time the batch row is expanded, to ensure the
 * most recent invoice statuses are displayed.
 */
onMounted(async () => {
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
 * Invoice status counts sorted in the display order.
 */
const sortedInvoiceStatusCounts = computed(() =>
  summaryTotals.value?.processingSummary.invoiceStatusCounts.toSorted(
    (a, b) =>
      InvoiceStatusDisplay[a.invoiceStatus].order -
      InvoiceStatusDisplay[b.invoiceStatus].order,
  ),
);

/**
 * Gets the label of an invoice status to be displayed in the processing summary.
 * @param invoiceStatus invoice status to get the label for.
 * @returns invoice status label.
 */
const getInvoiceStatusLabel = (invoiceStatus: CASInvoiceStatus): string =>
  InvoiceStatusDisplay[invoiceStatus].label;

/**
 * Gets the distribution account type label, for instance, BCAG-FT DR.
 * @param distributionTotal distribution total to get the label for.
 * @returns distribution account type label.
 */
const getDistributionTotalLabel = (
  distributionTotal: CASInvoiceBatchAwardAmountAPIOutDTO,
): string =>
  `${distributionTotal.awardValueCode}-${mapOfferingIntensityAbbreviation(
    distributionTotal.offeringIntensity,
  )} ${distributionTotal.operationCode}`;
</script>
