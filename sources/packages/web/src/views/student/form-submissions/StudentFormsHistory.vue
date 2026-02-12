<template>
  <v-card class="mb-4 p-4">
    <body-header-container>
      <template #header>
        <body-header
          title="History"
          sub-title="You can see the history of submitted forms."
        >
          <template #actions>
            <v-btn-toggle
              density="compact"
              color="primary"
              multiple
              mandatory
              class="float-right btn-toggle"
              selected-class="selected-btn-toggle"
              v-model="formCategoryFilter"
            >
              <v-btn
                rounded="xl"
                color="primary"
                :value="FormCategory.StudentAppeal"
                >View appeals</v-btn
              >
              <v-btn
                rounded="xl"
                class="ml-2"
                color="primary"
                :value="FormCategory.StudentForm"
                >View forms</v-btn
              >
            </v-btn-toggle>
          </template>
        </body-header>
      </template>
      <toggle-content
        :toggled="!submissions?.length"
        message="Review your past forms submissions, and decisions here."
      >
        <v-card
          hover
          class="my-4"
          v-for="submission in filteredSubmissions"
          :key="submission.id"
          variant="elevated"
        >
          <v-card-item>
            <v-card-title>
              <v-row>
                <v-col
                  ><span class="category-header-medium color-blue mr-2">{{
                    submission.formCategory
                  }}</span></v-col
                >
                <v-col
                  ><status-chip-form-submission :status="submission.status"
                /></v-col>
                <v-col
                  ><v-btn
                    color="primary"
                    class="float-right"
                    @click="goToSubmission(submission.id)"
                  >
                    View
                  </v-btn></v-col
                >
              </v-row>
              <v-divider class="mb-0"></v-divider>
            </v-card-title>
          </v-card-item>
          <v-card-text>
            <v-row no-gutters>
              <v-col
                ><title-value property-title="Submitted date">
                  <template #value>
                    {{ getISODateHourMinuteString(submission.submittedDate) }}
                  </template>
                </title-value></v-col
              >
              <v-col
                ><title-value property-title="Assessed date">
                  <template #value>
                    {{
                      !!submission.assessedDate
                        ? getISODateHourMinuteString(submission.assessedDate)
                        : "Pending"
                    }}
                  </template>
                </title-value>
              </v-col>
              <v-col v-if="submission.applicationNumber">
                <title-value
                  property-title="Application number"
                  :property-value="submission.applicationNumber"
              /></v-col>
            </v-row>
            <v-row no-gutters class="mt-2">
              <v-col>
                <span class="category-header-small brand-gray-text"
                  >Submitted form(s)</span
                >
              </v-col>
            </v-row>
            <v-table striped="even">
              <thead>
                <tr>
                  <th id="name" class="text-left">Name</th>
                  <th id="decisionStatus" class="text-left">Decision status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in submission.submissionItems"
                  :key="item.formType"
                >
                  <td headers="name">{{ item.formType }}</td>
                  <td headers="decisionStatus">
                    <StatusChipFormSubmissionDecision
                      :status="item.decisionStatus"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </toggle-content>
    </body-header-container>
  </v-card>
</template>
<script lang="ts">
import { computed, defineComponent, ref, watchEffect } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormatters, useStudentAppeals } from "@/composables";
import router from "@/router";
import { FormSubmissionsService } from "@/services/FormSubmissionsService";
import StatusChipFormSubmission from "@/components/generic/StatusChipFormSubmission.vue";
import StatusChipFormSubmissionDecision from "@/components/generic/StatusChipFormSubmissionDecision.vue";
import { FormSubmissionStudentAPIOutDTO } from "@/services/http/dto";
import { FormCategory } from "@/types";

export default defineComponent({
  components: {
    StatusChipFormSubmission,
    StatusChipFormSubmissionDecision,
  },
  setup() {
    const formCategoryFilter = ref([
      FormCategory.StudentAppeal,
      FormCategory.StudentForm,
    ]);
    const { mapStudentAppealsFormNames } = useStudentAppeals();
    const {
      emptyStringFiller,
      getISODateHourMinuteString,
      conditionalEmptyStringFiller,
      dateOnlyLongString,
    } = useFormatters();
    const submissions = ref<FormSubmissionStudentAPIOutDTO[]>();

    watchEffect(async () => {
      // TODO: add loading and error handling.
      const submissionSummary =
        await FormSubmissionsService.shared.getFormSubmissionSummary();
      submissions.value = submissionSummary.submissions;
    });

    const filteredSubmissions = computed(() => {
      return submissions.value?.filter((submission) =>
        formCategoryFilter.value.includes(submission.formCategory),
      );
    });

    const goToSubmission = async (formSubmissionId: number) => {
      await router.push({
        name: StudentRoutesConst.STUDENT_FORMS_SUBMISSION_VIEW,
        params: {
          formSubmissionId,
        },
      });
    };

    return {
      FormCategory,
      formCategoryFilter,
      submissions,
      StudentRoutesConst,
      emptyStringFiller,
      getISODateHourMinuteString,
      conditionalEmptyStringFiller,
      dateOnlyLongString,
      mapStudentAppealsFormNames,
      goToSubmission,
      filteredSubmissions,
    };
  },
});
</script>
