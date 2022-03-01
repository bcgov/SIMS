<template>
  <header-navigator title="Institutions" subTitle="Designations" />
  <v-card class="mt-4 p-4">
    <body-header
      title="Pending Designations"
      subTitle="Make a determination on each designation after viewing it's content."
      :recordsCount="designations?.length"
      class="m-1"
    >
      <template #actions>
        <InputText type="text" placeholder="Search Designations" />
        <v-btn class="ml-2 primary-btn-background"
          ><font-awesome-icon :icon="['fas', 'search']" class="mr-2"
        /></v-btn>
      </template>
    </body-header>
    <content-group>
      <toggle-content
        :toggled="!designations.length"
        message="There are no pending designation agreemments."
      >
        <DataTable
          :value="designations"
          :paginator="true"
          :rows="DEFAULT_PAGE_LIMIT"
          :rowsPerPageOptions="PAGINATION_LIST"
          :totalRecords="designations.length"
        >
          <Column field="institutionName" header="Institution Name"></Column>
          <Column header="Submitted on"
            ><template #body="slotProps">
              <span>{{
                dateOnlyLongString(slotProps.data.submittedDate)
              }}</span>
            </template>
          </Column>
          <Column header="Status"
            ><template #body="slotProps">
              <status-chip-designation
                :status="slotProps.data.designationStatus"
              /> </template
          ></Column>
          <Column>
            <template #body="slotProps">
              <v-btn
                outlined
                :color="COLOR_BLUE"
                @click="goToViewDesignation(slotProps.data.designationId)"
              >
                View
              </v-btn>
            </template>
          </Column>
        </DataTable>
        <template #image>
          <v-img
            height="200"
            alt="You don't have any agreements yet"
            src="@/assets/images/designation_summary.svg"
          />
        </template>
      </toggle-content>
    </content-group>
  </v-card>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { PendingDesignationDto } from "@/types/contracts/DesignationAgreementContract";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  PAGINATION_LIST,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormatters } from "@/composables";
import { COLOR_BLUE } from "@/constants";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import StatusChipDesignation from "@/components/generic/StatusChipDesignation.vue";
import BodyHeader from "@/components/generic/BodyHeader.vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";
export default {
  components: {
    HeaderNavigator,
    StatusChipDesignation,
    BodyHeader,
    ContentGroup,
  },

  setup() {
    const router = useRouter();
    const designations = ref([] as PendingDesignationDto[]);
    const { dateOnlyLongString } = useFormatters();

    const goToViewDesignation = (id: number) => {
      return router.push({
        name: AESTRoutesConst.DESIGNATION_VIEW,
        params: { designationAgreementId: id },
      });
    };

    onMounted(async () => {
      designations.value = await DesignationAgreementService.shared.getPendingDesignations();
    });

    return {
      designations,
      goToViewDesignation,
      DEFAULT_PAGE_LIMIT,
      DEFAULT_PAGE_NUMBER,
      PAGINATION_LIST,
      dateOnlyLongString,
      COLOR_BLUE,
    };
  },
};
</script>
