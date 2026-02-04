<template>
  <content-group>
    <h3 class="category-header-medium primary-color my-3">
      What does this page mean?
    </h3>
    <v-row>
      <v-col cols="12" md="3" lg="2">
        <status-chip-disbursement
          :status="DisbursementScheduleStatus.Pending"
        />
      </v-col>
      <v-col
        >Your funding is waiting to be sent to the National Student Loan Centre
        (NSLSC) to have the funds disbursed. Once the enrolment is confirmed and
        you are within 5 days of the earliest date of disbursement, it will be
        sent to NSLSC.</v-col
      >
    </v-row>
    <v-row>
      <v-col cols="12" md="3" lg="2">
        <status-chip-disbursement :status="DisbursementScheduleStatus.Sent" />
      </v-col>
      <v-col
        >Your funding has been sent to NSLSC. If you want to confirm the amounts
        you will receive or when they will be disbursed, please access your
        <a
          href="https://protege-secure.csnpe-nslsc.canada.ca/en/public/sign-in-method"
          target="_blank"
          >NSLSC</a
        >
        account.</v-col
      >
    </v-row>
    <v-row>
      <v-col cols="12" md="3" lg="2">
        <status-chip-disbursement
          :status="DisbursementScheduleStatus.Cancelled"
        />
      </v-col>
      <v-col
        >The final award is no longer applicable due to a change. Any scheduled
        disbursements will be cancelled.</v-col
      >
    </v-row>
    <v-row>
      <v-col cols="12" md="3" lg="2">
        <chip-tag color="error" label="Funded"
      /></v-col>
      <v-col
        >Your actual funding amounts received are different than the amounts
        estimated during the initial assessment. This was caused by payments
        previously received for this application. For further clarification,
        please contact StudentAid BC.</v-col
      >
    </v-row>
    <v-row>
      <v-col cols="12" md="3" lg="2"
        ><chip-tag color="error" label="Restriction"
      /></v-col>
      <v-col
        >Restrictions on your account have resulted in funding that is lower
        than the initial estimated award. For further clarification, please
        contact StudentAid BC.</v-col
      >
    </v-row>
    <v-row>
      <v-col cols="12" md="3" lg="2">
        <chip-tag color="error" label="Overawards"
      /></v-col>
      <v-col
        >Overawards on your account have resulted in funding that is lower than
        the initial estimated award. For further clarification, please contact
        StudentAid BC.</v-col
      >
    </v-row>
    <v-row>
      <v-col cols="12" md="3" lg="2">
        <chip-tag color="success" label="Overawards"
      /></v-col>
      <v-col
        >Previously deducted overawards were applied to this payment. For
        further clarification, please contact StudentAid BC.</v-col
      >
    </v-row>
  </content-group>
</template>
<script lang="ts">
import StatusChipDisbursement from "@/components/generic/StatusChipDisbursement.vue";
import { DisbursementScheduleStatus } from "@/types";
import { defineComponent } from "vue";

export default defineComponent({
  components: { StatusChipDisbursement },

  setup() {
    return {
      DisbursementScheduleStatus,
    };
  },
});
</script>
