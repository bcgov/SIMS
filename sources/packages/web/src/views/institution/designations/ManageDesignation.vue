<template>
  <full-page-container>
    <body-header
      title="Designation agreements"
      subTitle="Ensure you have an active designation to administer student financial
        assistance."
      :recordsCount="designations.length"
    >
      <template #buttons>
        <v-btn
          v-if="isLegalSigningAuthority"
          class="ml-2 primary-btn-background"
          @click="goToRequestDesignation()"
          ><font-awesome-icon
            :icon="['fas', 'external-link-square-alt']"
          />Request designation</v-btn
        >
      </template>
    </body-header>
    <content-group>
      <empty-table-template
        :isEmpty="!designations.length"
        emptyMessage="You don’t have any agreements yet"
      >
        <template #image>
          <v-img
            height="200"
            alt="You don’t have any agreements yet"
            src="@/assets/images/designation_summary.svg"
          />
        </template>
        <DataTable
          :value="designations"
          :paginator="true"
          :rows="DEFAULT_PAGE_LIMIT"
          :rowsPerPageOptions="PAGINATION_LIST"
          :totalRecords="designations.length"
        >
          <Column header="Submitted on"
            ><template #body="slotProps">
              <span>{{
                dateOnlyLongString(slotProps.data.submittedDate)
              }}</span>
            </template>
          </Column>
          <Column header="Start date"
            ><template #body="slotProps">
              <span>{{ dateOnlyLongString(slotProps.data.startDate) }}</span>
            </template>
          </Column>
          <Column header="Expiry date"
            ><template #body="slotProps">
              <span>{{ dateOnlyLongString(slotProps.data.endDate) }}</span>
            </template>
          </Column>
          <Column header="Status"
            ><template #body="slotProps">
              <StatusBadge
                :status="slotProps.data.designationStatus"
              /> </template
          ></Column>
          <Column>
            <template #body="slotProps">
              <v-btn
                outlined
                @click="goToViewDesignation(slotProps.data.designationId)"
              >
                View
              </v-btn>
            </template>
          </Column>
        </DataTable>
      </empty-table-template>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import StatusBadge from "@/components/generic/StatusBadge.vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  PAGINATION_LIST,
} from "@/types";
import { onMounted, ref } from "vue";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import { GetDesignationAgreementsDto } from "@/types/contracts/DesignationAgreementContract";
import { useFormatters, useInstitutionAuth } from "@/composables";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import EmptyTableTemplate from "@/components/generic/EmptyTableTemplate.vue";
import BodyHeader from "@/components/generic/BodyHeader.vue";

export default {
  components: {
    FullPageContainer,
    StatusBadge,
    ContentGroup,
    EmptyTableTemplate,
    BodyHeader,
  },
  setup() {
    const router = useRouter();
    const { isLegalSigningAuthority } = useInstitutionAuth();
    const { dateOnlyLongString } = useFormatters();

    const goToRequestDesignation = () => {
      return router.push({
        name: InstitutionRoutesConst.DESIGNATION_REQUEST,
      });
    };

    const goToViewDesignation = (id: number) => {
      return router.push({
        name: InstitutionRoutesConst.DESIGNATION_VIEW,
        params: { designationAgreementId: id },
      });
    };

    const designations = ref([] as GetDesignationAgreementsDto[]);

    onMounted(async () => {
      designations.value = await DesignationAgreementService.shared.getDesignationsAgreements();
    });

    return {
      designations,
      goToRequestDesignation,
      goToViewDesignation,
      isLegalSigningAuthority,
      dateOnlyLongString,
      DEFAULT_PAGE_LIMIT,
      DEFAULT_PAGE_NUMBER,
      PAGINATION_LIST,
    };
  },
};
</script>
