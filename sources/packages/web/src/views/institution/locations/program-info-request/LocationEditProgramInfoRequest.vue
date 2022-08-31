<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Program info requests"
        :routeLocation="{
          name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_SUMMARY,
        }"
        subTitle="View Application"
      />
    </template>
    <!-- TODO: ANN form definition -->
    <formio-container
      formName="programInformationRequest"
      :formData="initialData"
      @loaded="formLoaded"
      @changed="formChanged"
      @submitted="submitted"
      @customEvent="customEventCallback"
    >
      <template #actions="{ submit }">
        <footer-buttons
          :processing="processing"
          primaryLabel="Complete program info request"
          @primaryClick="submit"
        /> </template
    ></formio-container>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { ProgramInfoRequestService } from "@/services/ProgramInfoRequestService";
import { ref } from "vue";
import {
  useFormioUtils,
  useFormioDropdownLoader,
  useFormatters,
  useSnackBar,
  useProgramInfoRequest,
} from "@/composables";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import {
  ApiProcessError,
  FormIOCustomEvent,
  FormIOCustomEventTypes,
  FormIOForm,
} from "@/types";
import {
  PIR_OR_DATE_OVERLAP_ERROR,
  OFFERING_INTENSITY_MISMATCH,
} from "@/constants";
import { ProgramInfoRequestAPIOutDTO } from "@/services/http/dto";

export default {
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const processing = ref(false);
    const snackBar = useSnackBar();
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const initialData = ref({} as ProgramInfoRequestAPIOutDTO);
    const formioUtils = useFormioUtils();
    const formioDataLoader = useFormioDropdownLoader();
    const programRequestData = ref();
    const { mapProgramInfoChipStatus } = useProgramInfoRequest();

    // Components names on Form.IO definition that will be manipulated.
    const PROGRAMS_DROPDOWN_KEY = "selectedProgram";
    const OFFERINGS_DROPDOWN_KEY = "selectedOffering";
    const INSTITUTION_DETAILS_PANEL = "institutionEnteredDetails";

    const loadOfferingsForProgram = async (form: any) => {
      const programId = formioUtils.getComponentValueByKey(
        form,
        PROGRAMS_DROPDOWN_KEY,
      );

      if (programId) {
        await formioDataLoader.loadOfferingsForLocationForInstitution(
          form,
          programId,
          props.locationId,
          OFFERINGS_DROPDOWN_KEY,
          programRequestData.value.programYearId,
          programRequestData.value.offeringIntensitySelectedByStudent,
          true,
        );
      }
      formioUtils.redrawComponent(form, OFFERINGS_DROPDOWN_KEY);
    };

    const formLoaded = async (form: any) => {
      programRequestData.value =
        await ProgramInfoRequestService.shared.getProgramInfoRequest(
          props.locationId,
          props.applicationId,
        );
      initialData.value = {
        ...programRequestData.value,
        studentStudyStartDate: dateOnlyLongString(
          programRequestData.value.studentStudyStartDate,
        ),
        studentStudyEndDate: dateOnlyLongString(
          programRequestData.value.studentStudyEndDate,
        ),
        courseDetails: programRequestData.value.courseDetails?.map(
          (courseDetail) => ({
            ...courseDetail,
            courseStartDate: dateOnlyLongString(courseDetail.courseStartDate),
            courseEndDate: dateOnlyLongString(courseDetail.courseEndDate),
          }),
        ),
        // for `Deny program information request` checkbox
        denyProgramInformationRequest: !!(
          programRequestData.value.pirDenyReasonId ||
          programRequestData.value.otherReasonDesc
        ),
        programInfoRequestStatus: mapProgramInfoChipStatus(
          programRequestData.value.pirStatus,
        ),
      };

      // While loading a PIR that is in the some readonly status
      // the editable area of the form should be disabled.
      const readonlyStatus = ["submitted", "completed", "declined"];
      if (
        readonlyStatus.includes(
          programRequestData.value.pirStatus.toLowerCase(),
        )
      ) {
        const institutionEnteredDetails = formioUtils.getComponent(
          form,
          INSTITUTION_DETAILS_PANEL,
        );
        institutionEnteredDetails.disabled = true;
      }

      await formioDataLoader.loadProgramsForInstitution(
        form,
        PROGRAMS_DROPDOWN_KEY,
      );

      await loadOfferingsForProgram(form);
    };

    const formChanged = async (form: any, event: any) => {
      if (event.changed?.component?.key === PROGRAMS_DROPDOWN_KEY) {
        await loadOfferingsForProgram(form);
      }
      await formioDataLoader.loadPIRDeniedReasonList(form, "pirDenyReasonId");
    };

    const customEventCallback = async (
      _form: any,
      event: FormIOCustomEvent,
    ) => {
      switch (event.type) {
        case FormIOCustomEventTypes.RouteToCreateProgram:
          router.push({
            name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
            params: {
              locationId: props.locationId,
            },
          });
          break;
      }
    };
    // todo: use proper interface
    const submitted = async (form: FormIOForm<any>) => {
      try {
        processing.value = true;
        if (form.data.denyProgramInformationRequest) {
          await ProgramInfoRequestService.shared.denyProgramInfoRequest(
            props.locationId,
            props.applicationId,
            form.data,
          );
          snackBar.success("Program Information Request denied successfully!");
        } else {
          await ProgramInfoRequestService.shared.completeProgramInfoRequest(
            props.locationId,
            props.applicationId,
            form.data,
          );
          snackBar.success(
            "Program Information Request completed successfully!",
          );
        }
        router.push({
          name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_SUMMARY,
          params: {
            locationId: props.locationId,
          },
        });
      } catch (error: unknown) {
        let errorLabel = "Unexpected error!";
        let errorMsg =
          "An error happened while saving the Program Information Request.";
        if (error instanceof ApiProcessError) {
          if (
            error.errorType === PIR_OR_DATE_OVERLAP_ERROR ||
            error.errorType === OFFERING_INTENSITY_MISMATCH
          ) {
            errorLabel = "Invalid submission";
            errorMsg = error.message;
          }
        }
        snackBar.error(`${errorLabel}. ${errorMsg}`);
      } finally {
        processing.value = false;
      }
    };
    return {
      initialData,
      formLoaded,
      formChanged,
      submitted,
      customEventCallback,
      InstitutionRoutesConst,
      processing,
    };
  },
};
</script>
