<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Manage institution"
        subTitle="Withdrawal Upload"
      />
    </template>
    <content-group>
      <p class="category-header-medium primary-color">
        How to upload withdrawal files
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
        <li>Please save the file as a text file ".txt"</li>
        <li>Select the file to be uploaded</li>
        <li>
          Click on "Validate" to ensure your file does not have errors or
          warnings
        </li>
        <li>Errors and warnings will show up below</li>
        <li>
          If your file has errors, please fix it in the text file first and
          re-upload
        </li>
        <li>Once there are no errors, click the "Create now" button</li>
      </ul>
      <p class="category-header-medium primary-color">Additional notes</p>
      <ul class="m-4">
        <li>
          This will process each record as if it were a manually entered
          withdrawal
        </li>
        <li>
          Any errors will produce a list below. These errors must be fixed in
          order to bulk upload your withdrawal file
        </li>
        <li>
          When clicking "Validate" any warnings will produce a list below.
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
            v-model="withdrawalFiles"
            label="Withdrawal text file"
            variant="outlined"
            prepend-icon="fa:fa-solid fa-file-text"
            :rules="[fileValidationRules]"
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
            Create and upload bulk withdrawal file
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
          :recordsCount="validationResults.length"
        ></body-header>
        <banner
          class="mb-2"
          v-if="hasCriticalErrorsRecords"
          :type="BannerTypes.Error"
          summary="Error! We found problems that will prevent the bulk withdrawal from being created and uploaded. Please review the errors below."
        />
        <content-group>
          <v-data-table
            :headers="ApplicationWithdrawalUploadHeaders"
            :items="validationResults"
            :loading="loading"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
          >
            <template #[`item.recordLineNumber`]="{ item }">
              {{ numberEmptyFiller(item.recordLineNumber) }}
            </template>
            <template #[`item.applicationNumber`]="{ item }">
              {{ item.applicationNumber }}
            </template>
            <template #[`item.withdrawalDate`]="{ item }">
              {{ dateOnlyLongString(item.withdrawalDate) }}
            </template>
            <template #[`item.validations`]="{ item }">
              <div class="alert alert-danger mt-4" v-if="item.errors.length">
                <ul>
                  <li v-for="error in item.errors" :key="error">
                    {{ error }}
                  </li>
                </ul>
              </div>
              <div class="alert alert-warning mt-4" v-if="item.warnings.length">
                <ul>
                  <li v-for="warning in item.warnings" :key="warning">
                    {{ warning.message }}
                  </li>
                </ul>
              </div>
              <div class="alert alert-info mt-4" v-if="item.infos.length">
                <ul>
                  <li v-for="info in item.infos" :key="info">
                    {{ info.message }}
                  </li>
                </ul>
              </div>
            </template>
          </v-data-table>
        </content-group>
      </content-group>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { ref, computed, defineComponent } from "vue";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  PAGINATION_LIST,
  BannerTypes,
  VForm,
  InputFile,
  ApplicationWithdrawalUploadHeaders,
} from "@/types";
import { useFormatters, useSnackBar } from "@/composables";
import { ApplicationBulkWithdrawal } from "@/types/contracts/institution/ScholasticStanding";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";
import { AxiosProgressEvent } from "axios";

const ACCEPTED_FILE_TYPE = "text/plain";
const MAX_APPLICATION_WITHDRAWAL_UPLOAD_SIZE = 15728640;

export default defineComponent({
  setup() {
    const snackBar = useSnackBar();
    const validationProcessing = ref(false);
    const creationProcessing = ref(false);
    const { dateOnlyLongString, numberEmptyFiller } = useFormatters();
    // Only one will be used but the component allows multiple.
    const withdrawalFiles = ref<InputFile[]>([]);
    // Possible errors and warnings received upon file upload.
    const validationResults = ref([] as ApplicationBulkWithdrawal[]);
    const uploadForm = ref({} as VForm);
    const uploadProgress = ref({} as AxiosProgressEvent);
    // TODO need to be removed after confirmation of Vuetify 3 update
    // Workaround to reset the file upload component to its original state.
    // It is apparently a vuetify beta issue. It can be removed once there is a
    // better way to force the component to reset its state.
    // const textFileUploadKey = ref(0);

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
        const [fileToUpload] = withdrawalFiles.value;
        const uploadResults =
          await ScholasticStandingService.shared.applicationBulkWithdrawal(
            fileToUpload,
            validationOnly,
            (progressEvent: AxiosProgressEvent) => {
              uploadProgress.value = progressEvent;
            },
          );
        if (uploadResults.length) {
          // Check for any errors. If no errors found (only warnings found), show success message.
          if (!uploadResults.some((result) => result.errors.length)) {
            snackBar.success("Success! File validated.");
          }
          validationResults.value = uploadResults;
        } else if (validationOnly) {
          snackBar.success("Success! File validated.");
        } else {
          // Reset for to execute a possible new file upload if needed.
          resetForm();
          snackBar.success("Success! Applications withdrawn.");
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Network Error") {
          resetForm();
          showPossibleFileChangeError.value = true;
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

    const fileValidationRules = (files: InputFile[]) => {
      if (files?.length !== 1) {
        return "Withdrawal text file is required.";
      }
      const [file] = files;
      if (file.size > MAX_APPLICATION_WITHDRAWAL_UPLOAD_SIZE) {
        return "Text file size should not be greater than 15MB";
      }
      if (file.type !== ACCEPTED_FILE_TYPE) {
        return `The expected file type is ${ACCEPTED_FILE_TYPE}.`;
      }
      return true;
    };

    const resetForm = () => {
      validationResults.value = [];
      withdrawalFiles.value = [];
    };

    const loading = computed(
      () => validationProcessing.value || creationProcessing.value,
    );

    return {
      loading,
      validationProcessing,
      creationProcessing,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      PAGINATION_LIST,
      withdrawalFiles,
      uploadFile,
      validationResults,
      fileValidationRules,
      hasCriticalErrorsRecords,
      BannerTypes,
      uploadForm,
      ACCEPTED_FILE_TYPE,
      ApplicationWithdrawalUploadHeaders,
      showPossibleFileChangeError,
      uploadProgress,
      dateOnlyLongString,
      numberEmptyFiller,
    };
  },
});
</script>
