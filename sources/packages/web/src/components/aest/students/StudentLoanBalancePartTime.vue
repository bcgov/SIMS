<template>
  <body-header-container :enableCardView="true">
    <template #header>
      <body-header
        title="Part-Time monthly loan balance"
        subTitle="Balance of part-time Canada Student Loan outstanding between the student and NSLSC at any given time.
        This amount is updated once per month, and affects a student's eligibility for future funding, as a student 
        cannot exceed the maximum limit in total outstanding balance."
      />
    </template>
    <content-group>
      <toggle-content :toggled="!studentLoanBalanceDetails.length">
        <DataTable
          :value="studentLoanBalanceDetails"
          class="p-m-4"
          :paginator="true"
          :rows="pageLimit"
          :rowsPerPageOptions="PAGINATION_LIST"
        >
          <Column field="balanceDate" header="Date">
            <template #body="slotProps">
              <span>
                {{ dateOnlyLongString(slotProps.data.balanceDate) }}
              </span>
            </template>
          </Column>
          <Column field="cslBalance" header="CSLP Balance">
            <template #body="slotProps">
              <span>
                {{ formatCurrency(slotProps.data.cslBalance) }}
              </span>
            </template></Column
          >
        </DataTable>
      </toggle-content>
    </content-group>
  </body-header-container>
</template>
<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { StudentLoanBalanceService } from "@/services/StudentLoanBalanceService";
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  DEFAULT_PAGE_NUMBER,
} from "@/types";
import { useFormatters } from "@/composables";
import { StudentMonthlyLoanBalanceDetailAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const page = ref(DEFAULT_PAGE_NUMBER);
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const { dateOnlyLongString, formatCurrency } = useFormatters();
    const studentLoanBalanceDetails = ref(
      [] as StudentMonthlyLoanBalanceDetailAPIOutDTO[],
    );

    onMounted(async () => {
      const studentMonthlyLoanBalance =
        await StudentLoanBalanceService.shared.getStudentPartTimeLoanBalance(
          props.studentId,
        );
      studentLoanBalanceDetails.value =
        studentMonthlyLoanBalance.loanBalanceDetails;
    });

    return {
      page,
      pageLimit,
      PAGINATION_LIST,
      studentLoanBalanceDetails,
      dateOnlyLongString,
      formatCurrency,
    };
  },
});
</script>
