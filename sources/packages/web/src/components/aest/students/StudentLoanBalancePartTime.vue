<template>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header
        title="Part-Time monthly loan balance"
        sub-title="Balance of part-time Canada Student Loan outstanding between the student and NSLSC at any given time.
        This amount is updated once per month, and affects a student's eligibility for future funding, as a student 
        cannot exceed the maximum limit in total outstanding balance."
      />
    </template>
    <content-group>
      <toggle-content :toggled="!studentLoanBalanceDetails.length">
        <v-data-table
          :headers="PartTimeMonthlyBalanceHeaders"
          :items="studentLoanBalanceDetails"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
        >
          <template #loading>
            <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
          </template>
          <template #[`item.balanceDate`]="{ item }">
            {{ dateOnlyLongString(item.balanceDate) }}
          </template>
          <template #[`item.cslBalance`]="{ item }">
            {{ formatCurrency(item.cslBalance) }}
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
  </body-header-container>
</template>
<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { useDisplay } from "vuetify";

import { StudentLoanBalanceService } from "@/services/StudentLoanBalanceService";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  PartTimeMonthlyBalanceHeaders,
} from "@/types";
import { useFormatters } from "@/composables";
import { StudentLoanBalanceDetailAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { mobile: isMobile } = useDisplay();
    const { dateOnlyLongString, formatCurrency } = useFormatters();
    const studentLoanBalanceDetails = ref(
      [] as StudentLoanBalanceDetailAPIOutDTO[],
    );

    onMounted(async () => {
      const studentMonthlyLoanBalance =
        await StudentLoanBalanceService.shared.getStudentLoanBalance(
          props.studentId,
        );
      studentLoanBalanceDetails.value =
        studentMonthlyLoanBalance.loanBalanceDetails;
    });

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      studentLoanBalanceDetails,
      dateOnlyLongString,
      formatCurrency,
      PartTimeMonthlyBalanceHeaders,
      isMobile,
    };
  },
});
</script>
