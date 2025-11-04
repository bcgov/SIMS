<template>
  <body-header-container>
    <template #header>
      <body-header
        title="History"
        sub-title="You can see the history of submitted appeals."
      />
    </template>
    <content-group
      ><toggle-content
        :toggled="!appeals?.length"
        message="There is no history of appeal submissions."
      >
        <v-data-table
          :headers="StudentAppealsHistoryHeaders"
          :items="appeals"
          item-value="id"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          v-model:expanded="expanded"
        >
          <template #loading>
            <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
          </template>
          <template #[`item.submittedDate`]="{ item }">
            {{ dateOnlyLongString(item.submittedDate) }}
          </template>
          <template #[`item.decisionDate`]="{ item }">
            {{
              conditionalEmptyStringFiller(
                !item.assessedDate,
                dateOnlyLongString(item.assessedDate),
              )
            }}
          </template>
          <template #[`item.applicationNumber`]="{ item }">
            {{
              conditionalEmptyStringFiller(
                !!item.applicationNumber,
                item.applicationNumber,
              )
            }}
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <v-table>
                  <tbody>
                    <tr
                      v-for="appealRequest in item.appealRequests"
                      :key="appealRequest.submittedFormName"
                    >
                      <td headers="submitted-header">
                        {{ appealRequest.submittedFormName }}
                      </td>
                      <td headers="status-header" style="width: 100%">
                        {{ item.appealStatus }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </td>
            </tr>
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
  </body-header-container>
</template>
<script lang="ts">
import { defineComponent, ref, watchEffect } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentAppealService } from "../../../services/StudentAppealService";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  StudentAppealsHistoryHeaders,
} from "@/types";
import { AppealSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";

export default defineComponent({
  props: {
    applicationId: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup() {
    //const router = useRouter();
    const { conditionalEmptyStringFiller, dateOnlyLongString } =
      useFormatters();
    const appeals = ref<AppealSummaryAPIOutDTO[]>();
    const expanded = ref<number[]>([]);

    watchEffect(async () => {
      const appealsSummary =
        await StudentAppealService.shared.getStudentAppealSummary();
      appeals.value = appealsSummary.appeals;
      expanded.value = appeals.value.map((appeal) => appeal.id);
    });

    // const goToAppealFormsRequests = async (): Promise<void> => {
    //   const formIsValid = appealsSelectionForm.value.validate();
    //   if (!formIsValid) {
    //     return;
    //   }
    //   if (selectedAppealType.value === AppealTypes.Application) {
    //     await router.push({
    //       name: StudentRoutesConst.STUDENT_APPLICATION_APPEAL_SUBMIT,
    //       params: {
    //         applicationId: selectedApplicationId.value,
    //         appealForms: selectedApplicationAppeals.value?.toString(),
    //       },
    //     });
    //     return;
    //   }
    //   await router.push({
    //     name: StudentRoutesConst.STUDENT_APPEAL_SUBMIT,
    //     params: {
    //       appealForms: selectedOtherAppeal.value,
    //     },
    //   });
    // };

    return {
      StudentRoutesConst,
      appeals,
      StudentAppealsHistoryHeaders,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      conditionalEmptyStringFiller,
      dateOnlyLongString,
      expanded,
    };
  },
});
</script>
