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
          <template #[`item.assessedDate`]="{ item }">
            {{
              conditionalEmptyStringFiller(
                !!item.assessedDate,
                dateOnlyLongString(item.assessedDate),
              )
            }}
          </template>
          <template #[`item.appealStatus`]="{ item }">
            <status-chip-requested-assessment :status="item.appealStatus" />
          </template>
          <template #[`item.applicationNumber`]="{ item }">
            <RouterLink
              v-if="item.applicationId"
              :to="{
                name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
                params: { id: item.applicationId },
              }"
              class="text-decoration-none"
            >
              {{ item.applicationNumber }}
            </RouterLink>
            <template v-else>
              {{ DEFAULT_EMPTY_VALUE }}
            </template>
          </template>
          <template #[`item.actions`]="{ item }">
            <v-btn
              color="primary"
              variant="text"
              @click="goToAppeal(item.id, item.applicationId)"
              >View
              <v-tooltip activator="parent" location="start"
                >Click to view this appeal request.</v-tooltip
              >
            </v-btn>
          </template>
          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <content-group class="my-2 py-0">
                  <v-table>
                    <thead>
                      <tr>
                        <th id="status-header">Status</th>
                        <th id="appeal-header">Appeal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="appealRequest in item.appealRequests"
                        :key="appealRequest.submittedFormName"
                      >
                        <td headers="status-header">
                          <status-chip-requested-assessment
                            :status="appealRequest.appealStatus"
                          />
                        </td>
                        <td headers="appeal-header" class="w-100">
                          {{
                            mapStudentAppealsFormNames(
                              appealRequest.submittedFormName,
                            )
                          }}
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </content-group>
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
import {
  useFormatters,
  useStudentAppeals,
  DEFAULT_EMPTY_VALUE,
} from "@/composables";
import StatusChipRequestedAssessment from "@/components/generic/StatusChipRequestedAssessment.vue";
import router from "@/router";

export default defineComponent({
  components: {
    StatusChipRequestedAssessment,
  },
  props: {
    applicationId: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    //const router = useRouter();
    const { mapStudentAppealsFormNames } = useStudentAppeals();
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

    const goToAppeal = async (appealId: number, applicationId?: number) => {
      if (applicationId) {
        await router.push({
          name: StudentRoutesConst.STUDENT_APPLICATION_APPEAL_REQUEST,
          params: {
            applicationId,
            appealId,
          },
        });
        return;
      }
      await router.push({
        name: StudentRoutesConst.STUDENT_APPEAL_REQUEST,
        params: {
          appealId,
        },
      });
    };

    return {
      StudentRoutesConst,
      appeals,
      StudentAppealsHistoryHeaders,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      DEFAULT_EMPTY_VALUE,
      conditionalEmptyStringFiller,
      dateOnlyLongString,
      mapStudentAppealsFormNames,
      expanded,
      goToAppeal,
    };
  },
});
</script>
