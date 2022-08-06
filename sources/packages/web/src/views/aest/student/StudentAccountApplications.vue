<template>
  <full-page-container>
    <template #header>
      <header-navigator title="Student requests" subTitle="Accounts" />
    </template>
    <body-header
      title="Requested accounts"
      subTitle="Make a determination for students requesting to login with a Basic BCeID."
      :recordsCount="accountApplications?.length"
    >
      <template #actions>
        <v-text-field
          label="Search name"
          density="compact"
          v-model="searchCriteria"
          data-cy="searchStudentAccountApplication"
          variant="outlined"
          @keyup.enter="search"
          prepend-inner-icon="mdi-magnify"
          hide-details
        />
      </template>
    </body-header>
    <content-group>
      <toggle-content :toggled="!accountApplications.length">
        <DataTable
          :value="accountApplications"
          :paginator="true"
          :rows="DEFAULT_PAGE_LIMIT"
          :rowsPerPageOptions="PAGINATION_LIST"
          :totalRecords="accountApplications.length"
        >
          <Column header="Date submitted"
            ><template #body="slotProps">
              <span>{{
                dateOnlyLongString(slotProps.data.submittedDate)
              }}</span>
            </template>
          </Column>
          <Column header="Name" field="fullName"></Column>
          <Column header="Actions" bodyStyle="text-align: center">
            <template #body="slotProps">
              <v-btn
                color="primary"
                @click="goToStudentAccountApplication(slotProps.data.id)"
                data-cy="viewStudentAccountApplication"
              >
                View
              </v-btn>
            </template>
          </Column>
        </DataTable>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  PAGINATION_LIST,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormatters } from "@/composables";
import { StudentAccountApplicationService } from "@/services/StudentAccountApplicationService";
import { StudentAccountApplicationSummaryAPIOutDTO } from "@/services/http/dto";

export default {
  setup() {
    const router = useRouter();
    const accountApplications = ref(
      [] as StudentAccountApplicationSummaryAPIOutDTO[],
    );
    const { dateOnlyLongString } = useFormatters();
    const searchCriteria = ref();

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
      DEFAULT_PAGE_NUMBER,
      PAGINATION_LIST,
      dateOnlyLongString,
      searchCriteria,
    };
  },
};
</script>
