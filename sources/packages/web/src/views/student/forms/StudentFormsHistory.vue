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
              mandatory
              class="float-right btn-toggle"
              selected-class="selected-btn-toggle"
            >
              <v-btn rounded="xl" color="primary" value="appeals"
                >Student appeals</v-btn
              >
              <v-btn rounded="xl" class="ml-2" color="primary" value="forms"
                >Student forms</v-btn
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
          class="mb-4"
          v-for="submission in submissions"
          :key="submission.id"
          variant="elevated"
        >
          <v-card-item>
            <v-card-title>
              <span class="category-header-medium brand-gray-text mr-2">{{
                submission.formCategory
              }}</span>
              <StatusChipFormSubmission :status="submission.status" />
              <v-btn color="primary" class="float-right">
                View submitted form(s)
              </v-btn>
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
              <v-col cols="3">
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
                  <th id="decisionDate" class="text-left">Decision Date</th>
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
                  <td headers="decisionDate">
                    {{
                      !!item.decisionDate
                        ? getISODateHourMinuteString(item.decisionDate)
                        : "Pending"
                    }}
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
import { defineComponent, ref, watchEffect } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormatters, useStudentAppeals } from "@/composables";
import router from "@/router";
import { useDisplay } from "vuetify";
import { FormSubmissionsService } from "@/services/FormSubmissionsService";
import { FormSubmissionAPIOutDTO } from "@/services/http/dto/FormSubmission.dto";
import StatusChipFormSubmission from "@/components/generic/StatusChipFormSubmission.vue";
import StatusChipFormSubmissionDecision from "@/components/generic/StatusChipFormSubmissionDecision.vue";

export default defineComponent({
  components: {
    StatusChipFormSubmission,
    StatusChipFormSubmissionDecision,
  },
  setup() {
    const { mobile: isMobile } = useDisplay();
    const { mapStudentAppealsFormNames } = useStudentAppeals();
    const {
      emptyStringFiller,
      getISODateHourMinuteString,
      conditionalEmptyStringFiller,
      dateOnlyLongString,
    } = useFormatters();
    const submissions = ref<FormSubmissionAPIOutDTO[]>();

    watchEffect(async () => {
      const submissionSummary =
        await FormSubmissionsService.shared.getFormSubmissionSummary();
      submissions.value = submissionSummary.submissions;
    });

    const goToAppeal = async (appealId: number) => {
      await router.push({
        name: StudentRoutesConst.STUDENT_APPEAL_REQUEST,
        params: {
          appealId,
        },
      });
    };

    return {
      isMobile,
      submissions,
      StudentRoutesConst,
      emptyStringFiller,
      getISODateHourMinuteString,
      conditionalEmptyStringFiller,
      dateOnlyLongString,
      mapStudentAppealsFormNames,
      goToAppeal,
    };
  },
});
</script>
