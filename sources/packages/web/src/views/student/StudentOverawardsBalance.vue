<template>
  <student-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Home"
        subTitle="Overawards Balance"
        :routeLocation="{ name: StudentRoutesConst.STUDENT_DASHBOARD }"
      />
    </template>
    <body-header-container :enableCardView="true">
      <template #header
        ><body-header title="Understanding your overawards"
      /></template>
      <div class="mt-2">
        <v-row
          ><v-col>
            <p>
              It's important to understand how overawards can impact your
              awards.
              <a
                rel="noopener"
                target="_blank"
                href="https://studentaidbc.ca/apply/overaward"
                >Learn more about overawards.</a
              >
            </p>
            <span class="label-bold"> If you have an overaward</span>
            <div class="align-bullets pt-2 pl-2">
              <ol>
                <li>
                  Pay back your overawards in your
                  <a
                    rel="noopener"
                    target="_blank"
                    href="https://www.csnpe-nslsc.canada.ca/en/home"
                    >National Student Loan Service Centre (NSLSC)</a
                  >
                  account
                </li>
                <li>
                  Contact StudentAid BC after you pay your debts, so we know to
                  deduct it from your overaward balances
                </li>
              </ol>
            </div>
            If you still have remaining overaward balances or a new overaward
            occurred during a reassessment, your future awards will
            automatically be deducted in one or more of your applications to
            reduce your overaward balance.
          </v-col>
          <v-col md="3">
            <v-img
              height="204"
              alt="An illustration of a women putting a coin in a glass jar. Illustration by Storyset."
              src="@/assets/images/student-glass-jar.svg" /></v-col
        ></v-row>
      </div>
    </body-header-container>
    <student-overaward-details />
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import StudentOverawardDetails from "@/components/common/StudentOverawardDetails.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import BodyHeaderContainer from "@/components/layouts/BodyHeaderContainer.vue";

export default defineComponent({
  components: { StudentOverawardDetails, BodyHeaderContainer },
  setup() {
    return {
      StudentRoutesConst,
    };
  },
});
</script>
