<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Manage institution"
        subTitle="Offerings Upload"
      />
    </template>
    <content-group>
      <p class="category-header-medium primary-color">
        How to upload offerings
      </p>
      <ul class="m-4">
        <li>
          Use the template provided on
          <a
            href="https://studentaidbc.ca/institution-officials"
            rel="noopener"
            target="_blank"
            >https://studentaidbc.ca/institution-officials</a
          >
        </li>
        <li>Please save the file as "CSV UTF-8 (Comma delimited) (*.csv)"</li>
        <li>Select the file to be uploaded</li>
        <li>
          Click on "Validate" to ensure your file does not have errors or
          warnings
        </li>
        <li>Errors and warnings will show up below</li>
        <li>
          If your file has errors, please fix it in the excel file first and
          re-upload
        </li>
        <li>Once there are no errors, click the "Create now" button</li>
      </ul>
      <p class="category-header-medium primary-color">Additional notes</p>
      <ul class="m-4">
        <li>This will create all offerings present in the CSV file</li>
        <li>
          Any errors will produce a list below. These errors must be fixed in
          order to create your offerings
        </li>
        <li>
          When clicking "Validate" any warnings will produce a list below. You
          may want to review these before creating your offerings
        </li>
        <li>
          Offerings created as "{{ OfferingStatus.CreationPending }}" will
          require StudentAid BC approval
        </li>
        <li>
          All offerings with no errors and no warnings will be automatically set
          to "{{ OfferingStatus.Approved }}"
        </li>
      </ul>
      <v-divider-opaque />
      <v-form ref="uploadForm">
        <v-row class="m-0 p-0">
          <v-file-input
            :loading="loading"
            :clearable="true"
            :accept="ACCEPTED_FILE_TYPE"
            density="compact"
            v-model="offeringFiles"
            label="Offering CSV file"
            variant="outlined"
            data-cy="fileUpload"
            prepend-icon="fa:fa-solid fa-file-csv"
            :rules="[fileValidationRules]"
            :key="csvFileUploadKey"
          />

          <v-btn
            class="ml-2"
            color="primary"
            prepend-icon="fa:fa-solid fa-file-circle-question"
            @click="uploadFile(true)"
            :loading="validationProcessing"
            :disabled="loading"
          >
            Validate
          </v-btn>
          <v-btn
            class="ml-2"
            color="primary"
            prepend-icon="fa:fa-solid fa-upload"
            :loading="creationProcessing"
            :disabled="loading"
            @click="uploadFile(false)"
          >
            Create now
          </v-btn>
        </v-row>
        <v-progress-linear
          v-if="loading"
          class="mb-4"
          rounded
          :max="uploadProgress.total"
          :model-value="uploadProgress.loaded"
          color="primary"
        />
        <banner
          v-if="showPossibleFileChangeError"
          class="mb-2"
          :type="BannerTypes.Error"
          summary="An error occurred during the file upload. Reasons can include a file modification after the file was already selected or an unexpected network failure. Please select the file and try again."
        />
      </v-form>
      <content-group v-if="validationResults.length">
        <body-header
          title="Validation summary"
          title-header-level="2"
          :recordsCount="validationResults.length"
        ></body-header>
        <banner
          class="mb-2"
          v-if="hasCriticalErrorsRecords"
          :type="BannerTypes.Error"
          summary="Error! We found problems that will prevent the offerings from being created. Please review the errors below."
        />
        <banner
          class="mb-2"
          v-if="hasWarningRecords"
          :type="BannerTypes.Warning"
          summary="Warning! Offerings created as 'Creation Pending' will require StudentAid BC approval. Please review the warnings below."
        />
        <content-group>
          <DataTable
            :value="validationResults"
            :paginator="true"
            :rows="DEFAULT_PAGE_LIMIT"
            :rowsPerPageOptions="PAGINATION_LIST"
            :loading="loading"
            breakpoint="1250px"
          >
            <Column header="Line" field="recordLineNumber"></Column>
            <Column header="Location" field="locationCode"></Column>
            <Column header="Program code" field="sabcProgramCode"></Column>
            <Column
              header="Start date"
              field="startDateFormatted"
              bodyClass="text-no-wrap"
            ></Column>
            <Column
              header="End date"
              field="endDateFormatted"
              bodyClass="text-no-wrap"
            ></Column>
            <Column header="Status"
              ><template #body="slotProps">
                <status-chip-offering
                  v-if="slotProps.data.offeringStatus"
                  :status="slotProps.data.offeringStatus"
                /> </template
            ></Column>
            <Column header="Validations"
              ><template #body="slotProps">
                <div
                  class="alert alert-danger"
                  v-if="slotProps.data.errors.length"
                >
                  <ul class="m-2">
                    <li v-for="error in slotProps.data.errors" :key="error">
                      {{ error }}
                    </li>
                  </ul>
                </div>
                <div
                  class="alert alert-warning"
                  v-if="slotProps.data.warnings.length"
                >
                  <ul class="m-2">
                    <li
                      v-for="warning in slotProps.data.warnings"
                      :key="warning"
                    >
                      {{ warning.message }}
                    </li>
                  </ul>
                </div>
                <div
                  class="alert alert-info"
                  v-if="slotProps.data.infos.length"
                >
                  <ul class="m-2">
                    <li v-for="info in slotProps.data.infos" :key="info">
                      {{ info.message }}
                    </li>
                  </ul>
                </div>
              </template></Column
            >
          </DataTable>
        </content-group>
      </content-group>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { ref, computed, defineComponent } from "vue";
import {
  OfferingsUploadBulkInsert,
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  OfferingStatus,
  BannerTypes,
  VForm,
  InputFile,
  ApiProcessError,
} from "@/types";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import StatusChipOffering from "@/components/generic/StatusChipOffering.vue";
import { useSnackBar } from "@/composables";
import { OFFERING_VALIDATION_CSV_PARSE_ERROR } from "@/constants";
import { AxiosProgressEvent } from "axios";

const ACCEPTED_FILE_TYPE = "text/csv";
const MAX_OFFERING_UPLOAD_SIZE = 4194304;

export default defineComponent({
  components: {
    StatusChipOffering,
  },
  setup() {
    const snackBar = useSnackBar();
    const validationProcessing = ref(false);
    const creationProcessing = ref(false);
    // Only one will be used but the component allows multiple.
    const offeringFiles = ref<InputFile[]>([]);
    // Possible errors and warnings received upon file upload.
    const validationResults = ref([] as OfferingsUploadBulkInsert[]);
    const uploadForm = ref({} as VForm);
    const uploadProgress = ref({} as AxiosProgressEvent);
    // Workaround to reset the file upload component to its original state.
    // It is apparently a vuetify beta issue. It can be removed once there is a
    // better way to force the component to reset its state.
    const csvFileUploadKey = ref(0);
    // Specific error message to be display the error that occurs when the file upload
    // has a file selected and the user changes its contents (net::ERR_UPLOAD_FILE_CHANGED).
    const showPossibleFileChangeError = ref(false);

    const uploadFile = async (validationOnly: boolean) => {
      const validationResult = await uploadForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      validationResults.value = [];
      showPossibleFileChangeError.value = false;
      try {
        if (validationOnly) {
          validationProcessing.value = true;
        } else {
          creationProcessing.value = true;
        }
        const [fileToUpload] = offeringFiles.value;
        const uploadResults =
          await EducationProgramOfferingService.shared.offeringBulkInsert(
            fileToUpload,
            validationOnly,
            (progressEvent: AxiosProgressEvent) => {
              uploadProgress.value = progressEvent;
            },
          );
        validationResults.value = uploadResults;
        if (uploadResults.length) {
          validationResults.value = uploadResults;
        } else {
          if (validationOnly) {
            snackBar.success("Success! File validated.");
          } else {
            // Reset for to execute a possible new file upload if needed.
            resetForm();
            snackBar.success("Success! Offerings created.");
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Network Error") {
          resetForm();
          showPossibleFileChangeError.value = true;
        } else if (
          error instanceof ApiProcessError &&
          error.errorType === OFFERING_VALIDATION_CSV_PARSE_ERROR
        ) {
          snackBar.error(error.message);
        } else {
          snackBar.error("Unexpected error while uploading the file.");
        }
      } finally {
        validationProcessing.value = false;
        creationProcessing.value = false;
      }
    };

    const hasCriticalErrorsRecords = computed(() =>
      validationResults.value.some((validation) => validation.errors.length),
    );

    const hasWarningRecords = computed(() =>
      validationResults.value.some(
        (validation) =>
          validation.offeringStatus === OfferingStatus.CreationPending,
      ),
    );

    const fileValidationRules = (files: InputFile[]) => {
      if (files?.length !== 1) {
        return "CSV file is required.";
      }
      const [file] = files;
      if (file.size > MAX_OFFERING_UPLOAD_SIZE) {
        return "CSV file size should not be greater than 4MB";
      }
      if (file.type !== ACCEPTED_FILE_TYPE) {
        return `The expected file type is ${ACCEPTED_FILE_TYPE}.`;
      }
      return true;
    };

    const resetForm = () => {
      validationResults.value = [];
      offeringFiles.value = [];
      csvFileUploadKey.value++;
    };

    const loading = computed(
      () => validationProcessing.value || creationProcessing.value,
    );

    return {
      loading,
      validationProcessing,
      creationProcessing,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      offeringFiles,
      uploadFile,
      validationResults,
      fileValidationRules,
      OfferingStatus,
      hasCriticalErrorsRecords,
      hasWarningRecords,
      BannerTypes,
      uploadForm,
      ACCEPTED_FILE_TYPE,
      csvFileUploadKey,
      showPossibleFileChangeError,
      uploadProgress,
    };
  },
});
</script>
