<template>
  <student-page-container layout-template="centered" hide-restriction="true">
    <template #header>
      <header-navigator
        title="Home"
        subTitle="Overawards Balance"
        :routeLocation="{ name: StudentRoutesConst.STUDENT_DASHBOARD }"
      />
    </template>
    <body-header-container :enableCardView="true">
      <v-row
        ><v-col
          ><body-header
            title="Understanding your overawards"
            subTitle="It’s important to understand how overawards can impact your awards. Learn more about overawards."
          />
          <div class="pb-2">
            <span class="label-bold"> If you have an overaward</span>
            <span class="label-value">
              Pay back your overawards in your National Student Loan Service
              Centre (NSLSC) account Contact StudentAid BC after you pay your
              debts, so we know to deduct it from your overaward balances If you
              still have remaining overaward balances or a new overaward
              occurred during a reassessment, your future awards will
              automatically be deducted in one or more of your applications to
              reduce your overaward balance.</span
            >
          </div></v-col
        >
        <v-col md="3">
          <v-img
            height="260"
            class="ml-2"
            alt="An illustration of a women putting a coin in a glass jar."
            src="@/assets/images/student-glass-jar.svg" /></v-col
      ></v-row>
    </body-header-container>
    <student-overaward-details :studentId="studentId" />
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import StudentOverawardDetails from "@/components/common/StudentOverawardDetails.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import BodyHeaderContainer from "@/components/layouts/BodyHeaderContainer.vue";

export default defineComponent({
  components: { StudentOverawardDetails, BodyHeaderContainer },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return {
      StudentRoutesConst,
    };
  },
});
</script>
