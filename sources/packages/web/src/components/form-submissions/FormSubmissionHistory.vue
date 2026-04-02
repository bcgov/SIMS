<template>
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
            mandatory
            class="float-right btn-toggle"
            selected-class="selected-btn-toggle"
            v-model="formCategoryFilter"
          >
            <v-btn
              v-for="filterCategory of formCategoryFilterOptions"
              :key="filterCategory.value"
              rounded="xl"
              class="ml-2"
              :value="filterCategory.value"
              >{{ filterCategory.label }}
              <template #append
                ><v-badge
                  class="ma-n1"
                  :color="
                    filterCategory.value === formCategoryFilter
                      ? 'primary'
                      : 'border'
                  "
                  :content="filterCategory.count"
                  inline
                ></v-badge
              ></template>
            </v-btn>
          </v-btn-toggle>
        </template>
      </body-header>
    </template>
    <content-group>
      <v-skeleton-loader :loading="loading" type="card, card">
        <toggle-content
          :toggled="!filteredSubmissions?.length"
          message="Review your past forms submissions, and decisions here."
        >
          <v-card
            hover
            class="my-4"
            v-for="submission in filteredSubmissions"
            :key="submission.id"
            variant="elevated"
            :ripple="false"
            @click="goToSubmission(submission.id)"
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
                    ><v-btn color="primary" class="float-right">
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
                        conditionalEmptyStringFiller(
                          !!submission.assessedDate,
                          getISODateHourMinuteString(submission.assessedDate),
                        )
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
                    <th id="decisionStatus" class="text-left">
                      Decision status
                    </th>
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
                        :status="item.currentDecision.decisionStatus"
                      />
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </toggle-content>
      </v-skeleton-loader>
    </content-group>
  </body-header-container>
</template>
<script lang="ts">
import { computed, defineComponent, ref, watchEffect } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormatters, useSnackBar, useStudentAppeals } from "@/composables";
import { FormSubmissionService } from "@/services/FormSubmissionService";
import StatusChipFormSubmission from "@/components/generic/StatusChipFormSubmission.vue";
import StatusChipFormSubmissionDecision from "@/components/generic/StatusChipFormSubmissionDecision.vue";
import { FormCategory } from "@/types";
import { FormSubmissionAPIOutDTO } from "@/services/http/dto";

export type FormsCategoryFilterTypes = FormCategory | "all";

interface FormsCategoryFilter {
  label: string;
  value: FormsCategoryFilterTypes;
  count: number;
}

export default defineComponent({
  emits: {
    goToSubmission: (formSubmissionId: number) => {
      return !!formSubmissionId;
    },
  },
  components: {
    StatusChipFormSubmission,
    StatusChipFormSubmissionDecision,
  },
  props: {
    studentId: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup(props, { emit }) {
    const loading = ref(true);
    const snackBar = useSnackBar();
    const formCategoryFilter = ref<FormsCategoryFilterTypes>("all");
    const formCategoryFilterOptions = ref<FormsCategoryFilter[]>([]);
    const { mapStudentAppealsFormNames } = useStudentAppeals();
    const {
      emptyStringFiller,
      getISODateHourMinuteString,
      conditionalEmptyStringFiller,
      dateOnlyLongString,
    } = useFormatters();
    const submissions = ref<FormSubmissionAPIOutDTO[]>();

    watchEffect(async () => {
      try {
        loading.value = true;
        const submissionSummary =
          await FormSubmissionService.shared.getFormSubmissionHistory(
            props.studentId,
          );
        submissions.value = submissionSummary.submissions;
        // Count submissions per category.
        const countPerCategory = submissionSummary.submissions.reduce(
          (total, submission) => {
            total[submission.formCategory] =
              (total[submission.formCategory] ?? 0) + 1;
            return total;
          },
          {} as Partial<Record<FormCategory, number>>,
        );
        formCategoryFilterOptions.value = [
          {
            label: "View all",
            value: "all",
            count: submissionSummary.submissions.length,
          },
          {
            label: "View appeals",
            value: FormCategory.StudentAppeal,
            count: countPerCategory[FormCategory.StudentAppeal] ?? 0,
          },
          {
            label: "View forms",
            value: FormCategory.StudentForm,
            count: countPerCategory[FormCategory.StudentForm] ?? 0,
          },
        ];
      } catch {
        snackBar.error("Unexpected error while loading form submissions.");
      } finally {
        loading.value = false;
      }
    });

    const filteredSubmissions = computed(() => {
      if (formCategoryFilter.value === "all") {
        return submissions.value;
      }
      return submissions.value?.filter(
        (submission) => formCategoryFilter.value === submission.formCategory,
      );
    });

    const goToSubmission = async (formSubmissionId: number) => {
      emit("goToSubmission", formSubmissionId);
    };

    return {
      loading,
      formCategoryFilterOptions,
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
