<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Student requests" subTitle="Accounts" />
    </template>
    <body-header
      title="Pending account requests"
      subTitle="Basic BCeID account requests that require ministry review."
      :recordsCount="accountApplications?.length"
    >
      <template #actions>
        <v-text-field
          density="compact"
          label="Search first name or last name"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        >
        </v-text-field>
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
          <Column header="Date submitted" headerClass="text-no-wrap"
            ><template #body="slotProps">
              <span>{{
                dateOnlyLongString(slotProps.data.submittedDate)
              }}</span>
            </template>
          </Column>
          <Column header="Given names" field="givenNames"></Column>
          <Column header="Last name" field="lastName"></Column>
          <Column header="Date of birth" headerClass="text-no-wrap"
            ><template #body="slotProps">
              <span>{{ dateOnlyLongString(slotProps.data.birthDate) }}</span>
            </template>
          </Column>
          <Column header="Action">
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
import { onMounted, ref, defineComponent } from "vue";
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

export default defineComponent({
  setup() {
    const router = useRouter();
    const accountApplications = ref(
      [] as StudentAccountApplicationSummaryAPIOutDTO[],
    );
    const { dateOnlyLongString } = useFormatters();

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
    };
  },
});
</script>
