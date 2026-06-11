<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Program info requests"
        :route-location="goBackRouteParams"
        sub-title="View Application"
      />
    </template>
    <template #alerts>
      <banner
        v-if="!!initialData.pirApprovalReferenceAssessedDate"
        :type="BannerTypes.Info"
        header="Program information request auto-approved"
      >
        <template #content
          >The program information request was automatically completed using
          information from a previous request that was approved on
          {{
            dateOnlyLongString(initialData.pirApprovalReferenceAssessedDate)
          }}.</template
        >
      </banner>
    </template>
    <formio-container
      form-name="programInformationRequest"
      :form-data="initialData"
      @loaded="formLoaded"
      @changed="formChanged"
      @submitted="submitted"
      @custom-event="customEventCallback"
    >
      <template #actions="{ submit }">
        <footer-buttons
          :processing="processing"
          primary-label="Complete program info request"
          @primary-click="submit"
          @secondary-click="goBack"
          :disable-primary-button="isReadOnlyUser(locationId)"
          :show-primary-button="
            initialData.pirStatus === ProgramInfoStatus.required
          "
        /> </template
    ></formio-container>
  </full-page-container>
</template>

<script lang="ts">
import { RouteLocationRaw, useRouter } from "vue-router";
import { ProgramInfoRequestService } from "@/services/ProgramInfoRequestService";
import { ref, defineComponent, computed } from "vue";
import {
  useFormioUtils,
  useFormioDropdownLoader,
  useFormatters,
  useSnackBar,
  useProgramInfoRequest,
  useFormioComponentLoader,
  useInstitutionAuth,
} from "@/composables";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import {
  ApiProcessError,
  FormIOCustomEvent,
  FormIOCustomEventTypes,
  FormIOForm,
  ProgramInfoStatus,
  BannerTypes,
  FormIOChangeEvent,
} from "@/types";
import {
  STUDY_DATE_OVERLAP_ERROR,
  OFFERING_INTENSITY_MISMATCH,
} from "@/constants";
import {
  CompleteProgramInfoRequestAPIInDTO,
  DenyProgramInfoRequestAPIInDTO,
  ProgramInfoRequestAPIOutDTO,
  ProgramInfoRequestFormData,
} from "@/services/http/dto";
import { AppConfigService } from "@/services/AppConfigService";
export default defineComponent({
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const processing = ref(false);
    const snackBar = useSnackBar();
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const { isReadOnlyUser } = useInstitutionAuth();
    const initialData = ref({} as ProgramInfoRequestAPIOutDTO);
    const formioUtils = useFormioUtils();
    const formioDataLoader = useFormioDropdownLoader();
    const formioComponentLoader = useFormioComponentLoader();
    const programRequestData = ref();
    const { mapProgramInfoChipStatus } = useProgramInfoRequest();
    const goBackRouteParams = {
      name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_SUMMARY,
    } as RouteLocationRaw;
    let selectedProgramId: number | undefined;

    // Components names on Form.IO definition that will be manipulated.
    const PROGRAMS_DROPDOWN_KEY = "selectedProgram";
    const OFFERINGS_DROPDOWN_KEY = "selectedOffering";
    const INSTITUTION_DETAILS_PANEL = "institutionEnteredDetails";
    const SELECTED_OFFERING_END_DATE_KEY = "selectedOfferingEndDate";
    const DENY_PIR_KEY = "denyProgramInformationRequest";

    // Defining readonly based on PIR status.
    const isReadOnly = computed(() =>
      ["submitted", "completed", "declined"].includes(
        programRequestData?.value?.pirStatus?.toLowerCase(),
      ),
    );

    const loadOfferingsForProgram = async (
      form: FormIOForm<ProgramInfoRequestFormData>,
    ) => {
      selectedProgramId = formioUtils.getComponentValueByKey(
        form,
        PROGRAMS_DROPDOWN_KEY,
      );

      if (selectedProgramId) {
        await formioDataLoader.loadOfferingsForLocationForInstitution(
          form,
          selectedProgramId,
          props.locationId,
          OFFERINGS_DROPDOWN_KEY,
          programRequestData.value.programYearId,
          programRequestData.value.offeringIntensitySelectedByStudent,
          true,
        );
      }
      formioUtils.redrawComponent(form, OFFERINGS_DROPDOWN_KEY);
    };

    const formLoaded = async (form: FormIOForm<ProgramInfoRequestFormData>) => {
      const { applicationSubmissionDeadlineWeeks } =
        await AppConfigService.shared.config();
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
        // When an inactive or expired program is submitted for PIR, the program dropdown should not preselect the program name.
        selectedProgram:
          !isReadOnly.value &&
          (!programRequestData.value.isActiveProgram ||
            programRequestData.value.isExpiredProgram)
            ? null
            : programRequestData.value.selectedProgram,
        // Hide the create program button for read-only user.
        isReadOnlyUser: isReadOnlyUser(props.locationId),
        applicationSubmissionDeadlineWeeks,
      };

      // While loading a PIR that is in the some readonly status
      // the editable area of the form should be disabled.
      if (isReadOnly.value) {
        const institutionEnteredDetails = formioUtils.getComponent(
          form,
          INSTITUTION_DETAILS_PANEL,
        );
        institutionEnteredDetails.disabled = true;
      }

      await formioDataLoader.loadProgramsForInstitution(
        form,
        PROGRAMS_DROPDOWN_KEY,
        { isIncludeInActiveProgram: isReadOnly.value },
      );

      await loadOfferingsForProgram(form);
    };

    const formChanged = async (
      form: FormIOForm<ProgramInfoRequestFormData>,
      event: FormIOChangeEvent,
    ) => {
      if (event.changed?.component?.key === PROGRAMS_DROPDOWN_KEY) {
        // Reset the selected offering details and
        // offerings dropdown when selected program is changed.
        resetSelectedOfferingDetails(form);
        resetOfferingDropdownValue(form);
        await loadOfferingsForProgram(form);
      }

      // When an offering is selected, load the offering details
      // which are(is) required for the form.
      if (
        event.changed?.component.key === OFFERINGS_DROPDOWN_KEY &&
        +event.changed.value > 0
      ) {
        await formioComponentLoader.loadSelectedOfferingDetailsByLocationAndProgram(
          form,
          +event.changed.value,
          SELECTED_OFFERING_END_DATE_KEY,
          props.locationId,
          selectedProgramId!,
        );
      }
      // If Deny PIR is checked after offering being selected
      // then reset the offering details that were loaded.
      if (
        event.changed?.component.key === DENY_PIR_KEY &&
        event.changed.value
      ) {
        resetSelectedOfferingDetails(form);
      }
      await formioDataLoader.loadPIRDeniedReasonList(form, "pirDenyReasonId");
    };

    const resetSelectedOfferingDetails = (
      form: FormIOForm<ProgramInfoRequestFormData>,
    ) => {
      formioUtils.setComponentValue(form, SELECTED_OFFERING_END_DATE_KEY, "");
    };

    const resetOfferingDropdownValue = (
      form: FormIOForm<ProgramInfoRequestFormData>,
    ) => {
      formioUtils.setComponentValue(form, OFFERINGS_DROPDOWN_KEY, "");
    };

    const customEventCallback = async (
      _form: FormIOForm<ProgramInfoRequestFormData>,
      event: FormIOCustomEvent,
    ) => {
      if (event.type === FormIOCustomEventTypes.RouteToCreateProgram) {
        router.push({
          name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
          params: {
            locationId: props.locationId,
          },
        });
        return;
      }
      if (event.type === FormIOCustomEventTypes.RouteToCreateOffering) {
        router.push({
          name: InstitutionRoutesConst.ADD_LOCATION_OFFERINGS,
          params: {
            locationId: props.locationId,
            programId: selectedProgramId,
          },
        });
      }
    };
    const submitted = async (form: FormIOForm<ProgramInfoRequestFormData>) => {
      try {
        processing.value = true;
        if (form.data.denyProgramInformationRequest) {
          const typedData = formioUtils.excludeExtraneousValues(
            DenyProgramInfoRequestAPIInDTO,
            form.data,
          );
          await ProgramInfoRequestService.shared.denyProgramInfoRequest(
            props.locationId,
            props.applicationId,
            typedData,
          );
          snackBar.success("Program Information Request denied successfully!");
        } else {
          const typedData = formioUtils.excludeExtraneousValues(
            CompleteProgramInfoRequestAPIInDTO,
            form.data,
          );
          await ProgramInfoRequestService.shared.completeProgramInfoRequest(
            props.locationId,
            props.applicationId,
            typedData,
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
            error.errorType === STUDY_DATE_OVERLAP_ERROR ||
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

    const goBack = () => {
      router.push(goBackRouteParams);
    };

    return {
      initialData,
      formLoaded,
      formChanged,
      submitted,
      customEventCallback,
      InstitutionRoutesConst,
      processing,
      goBackRouteParams,
      goBack,
      isReadOnlyUser,
      BannerTypes,
      dateOnlyLongString,
      ProgramInfoStatus,
    };
  },
});
</script>
