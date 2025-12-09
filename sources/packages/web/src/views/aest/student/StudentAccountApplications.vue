<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Student requests" sub-title="Accounts" />
    </template>
    <body-header
      title="Pending account requests"
      sub-title="Basic BCeID account requests that require ministry review."
      :records-count="accountApplications?.length"
    >
    </body-header>
    <content-group>
      <toggle-content
        :toggled="!accountApplications.length"
        message="No pending account requests found."
      >
        <v-data-table
          :headers="StudentAccountRequestsHeaders"
          :items="accountApplications"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
        >
          <template #[`item.submittedDate`]="{ item }">
            {{ dateOnlyLongString(item.submittedDate) }}
          </template>
          <template #[`item.givenNames`]="{ item }">
            {{ item.givenNames }}
          </template>
          <template #[`item.lastName`]="{ item }">
            {{ item.lastName }}
          </template>
          <template #[`item.dateOfBirth`]="{ item }">
            {{ dateOnlyLongString(item.dateOfBirth) }}
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn
              color="primary"
              @click="goToStudentAccountApplication(item.id)"
              data-cy="viewStudentAccountApplicationMobile"
            >
              View
            </v-btn>
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  StudentAccountRequestsHeaders,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormatters } from "@/composables";
import { StudentAccountApplicationService } from "@/services/StudentAccountApplicationService";
import { StudentAccountApplicationSummaryAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  setup() {
    const router = useRouter();
    const accountApplications = ref(
      [] as StudentAccountApplicationSummaryAPIOutDTO[],
    );
    const { dateOnlyLongString } = useFormatters();
    const { mobile: isMobile } = useDisplay();

    const goToStudentAccountApplication = (
      studentAccountApplicationId: number,
    ) => {
      return router.push({
        name: AESTRoutesConst.STUDENT_ACCOUNT_APPLICATIONS_APPROVAL,
        params: { studentAccountApplicationId },
      });
    };

    onMounted(async () => {
      accountApplications.value =
        await StudentAccountApplicationService.shared.getPendingStudentAccountApplications();
    });

    return {
      accountApplications,
      goToStudentAccountApplication,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      dateOnlyLongString,
      StudentAccountRequestsHeaders,
      isMobile,
    };
  },
});
</script>
