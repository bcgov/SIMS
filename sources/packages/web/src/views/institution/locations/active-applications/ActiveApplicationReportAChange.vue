<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Report a change"
        :routeLocation="goBackRouteParams"
        subTitle="View Application"
      />
    </template>
    <scholastic-standing-form
      :initialData="initialData"
      :readOnly="false"
      @submit="submit"
      :processing="processing"
      @cancel="goBack"
    />
  </full-page-container>
</template>
<script lang="ts">
import { RouteLocationRaw, useRouter } from "vue-router";
import { ref, onMounted, computed, defineComponent } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import { ApiProcessError } from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import {
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  ScholasticStandingDataAPIInDTO,
} from "@/services/http/dto/ScholasticStanding.dto";
import { useFormatters, useSnackBar } from "@/composables";
import { ASSESSMENT_ALREADY_IN_PROGRESS } from "@/services/http/dto/Assessment.dto";
import { APPLICATION_CHANGE_NOT_ELIGIBLE } from "@/constants";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";
import { ActiveApplicationDataAPIOutDTO } from "@/services/http/dto";
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";

export default defineComponent({
  components: {
    ScholasticStandingForm,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const initialData = ref({} as ActiveApplicationDataAPIOutDTO);
    const snackBar = useSnackBar();
    const processing = ref(false);
    const loadInitialData = async () => {
      const applicationDetails =
        await InstitutionService.shared.getActiveApplication(
          props.applicationId,
          props.locationId,
        );
      initialData.value = {
        ...applicationDetails,
        applicationOfferingStartDate: dateOnlyLongString(
          applicationDetails.applicationOfferingStartDate,
        ),
        applicationOfferingEndDate: dateOnlyLongString(
          applicationDetails.applicationOfferingEndDate,
        ),
        applicationOfferingUnformattedStartDate:
          applicationDetails.applicationOfferingStartDate,
        applicationOfferingUnformattedEndDate:
          applicationDetails.applicationOfferingEndDate,
        applicationOfferingStudyBreak:
          applicationDetails.applicationOfferingStudyBreak?.map(
            (studyBreak) => ({
              breakStartDate: dateOnlyLongString(studyBreak.breakStartDate),
              breakEndDate: dateOnlyLongString(studyBreak.breakEndDate),
            }),
          ),
      };
    };

    onMounted(async () => {
      await loadInitialData();
    });

    const goBackRouteParams = computed(
      () =>
        ({
          name: InstitutionRoutesConst.ACTIVE_APPLICATIONS_SUMMARY,
          params: {
            locationId: props.locationId,
          },
        } as RouteLocationRaw),
    );

    const goBack = () => {
      router.push(goBackRouteParams.value);
    };

    const submit = async (data: ScholasticStandingDataAPIInDTO) => {
      try {
        processing.value = true;
        await ScholasticStandingService.shared.saveScholasticStanding(
          props.applicationId,
          props.locationId,
          data,
        );
        snackBar.success("Report a change submitted");
        router.push(goBackRouteParams.value);
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          if (
            [
              APPLICATION_NOT_FOUND,
              INVALID_OPERATION_IN_THE_CURRENT_STATUS,
              ASSESSMENT_ALREADY_IN_PROGRESS,
              APPLICATION_CHANGE_NOT_ELIGIBLE,
            ].includes(error.errorType)
          ) {
            snackBar.warn(`Not able to submit. ${error.message}`);

            return;
          }
        }
        snackBar.error("An unexpected error happened during the submission.");
      } finally {
        processing.value = false;
      }
    };

    return {
      initialData,
      submit,
      goBackRouteParams,
      processing,
      goBack,
    };
  },
});
</script>
