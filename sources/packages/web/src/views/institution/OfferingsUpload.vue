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
          >.
        </li>
        <li>Please save the file as "CSV UTF-8 (Comma delimited) (*.csv)".</li>
        <li>Select the file to be uploaded.</li>
        <li>
          Click on "Validate" to ensure your file does not have errors or
          warnings.
        </li>
        <li>Errors and warnings will show up below.</li>
        <li>
          If your file has errors, please fix it in the excel file first and
          re-upload.
        </li>
        <li>Once there are no errors, click the "Create now" button.</li>
      </ul>
      <p class="category-header-small primary-color">Additional notes</p>
      <ul class="m-4">
        <li>This will create all offerings present in the CSV file.</li>
        <li>
          Any errors will produce a list below. These errors must be fixed in
          order to create your offerings.
        </li>
        <li>
          When clicking "Validate" any warnings will produce a list below. You
          may want to review these before creating your offerings.
        </li>
        <li>
          Offerings created as "Creation Pending" will require StudentAid BC
          approval.
        </li>
        <li>
          All offerings with no errors and no warnings will be automatically set
          to "Approved".
        </li>
      </ul>
      <horizontal-separator />
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
            @change="uploadChanged"
            :key="csvFileUploadKey"
          >
          </v-file-input>
          <v-btn
            class="ml-2"
            color="primary"
            prepend-icon="fa:fa-solid fa-file-circle-question"
            @click="uploadFile()"
            :loading="loading"
            :disabled="loading"
          >
            Validate
          </v-btn>
          <v-btn
            class="ml-2"
            color="primary"
            prepend-icon="fa:fa-solid fa-upload"
            :loading="loading"
            :disabled="loading"
            @click="uploadFile(false)"
          >
            Create now
          </v-btn>
        </v-row>
        <banner
          v-if="showPossibleFileChangeError"
          class="mb-2"
          :type="BannerTypes.Error"
          summary="An error ocurred during the file upload. Reasons can include a file modification after the file was already selected or a unexpected network failure. Please select the file and try again."
        />
      </v-form>
      <content-group v-if="showValidationSummary">
        <p class="category-header-small primary-color">Validation summary</p>
        <banner
          class="mb-2"
          v-if="hasCriticalErrorRecords"
          :type="BannerTypes.Error"
          summary="Error! We found problems that will prevent the offerings from being created. Please review the errors below."
        />
        <banner
          class="mb-2"
          v-if="hasWarningRecords"
          :type="BannerTypes.Warning"
          summary="Warning! Offerings created as 'Creation Pending' will require StudentAid BC approval. Please review the warnings below."
        />
        <content-group v-if="validationResults.length">
          <DataTable
            :value="validationResults"
            :lazy="true"
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
                      {{ warning.warningMessage }}
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
import { ref, computed } from "vue";
import {
  OfferingsUploadBulkInsert,
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  OfferingStatus,
  BannerTypes,
  VForm,
  FileInputFile,
} from "@/types";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import StatusChipOffering from "@/components/generic/StatusChipOffering.vue";
import { useSnackBar } from "@/composables";

const ACCEPTED_FILE_TYPE = "text/csv";
const MAX_OFFERING_UPLOAD_SIZE = 4194304;

export default {
  components: {
    StatusChipOffering,
  },
  setup() {
    const snackBar = useSnackBar();
    const loading = ref(false);
    const showPossibleFileChangeError = ref(false);
    const offeringFiles = ref([] as FileInputFile[]);
    const csvFileUpload = ref({} as any);
    const validationResults = ref([] as OfferingsUploadBulkInsert[]);
    const uploadForm = ref({} as VForm);
    const showValidationSummary = ref(false);
    const csvFileUploadKey = ref(0);

    const uploadFile = async (validationOnly = true) => {
      const validationResult = await uploadForm.value.validate();
      if (!validationResult.valid) {
        return;
      }

      showPossibleFileChangeError.value = false;
      try {
        loading.value = true;
        const uploadResults =
          await EducationProgramOfferingService.shared.offeringBulkInsert(
            offeringFiles.value[0],
            (progressEvent: any) => {
              console.log("progressEvent", progressEvent);
            },
            validationOnly,
          );
        if (uploadResults.length) {
          validationResults.value = uploadResults;
          showValidationSummary.value = true;
        } else {
          resetForm();
          snackBar.success("File successfully upload.");
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Network Error") {
          resetForm();
          showPossibleFileChangeError.value = true;
        }
        snackBar.error("Unexpected error while uploading the file.");
      } finally {
        loading.value = false;
      }
    };

    const hasCriticalErrorRecords = computed(() =>
      validationResults.value.some((validation) => validation.errors.length),
    );

    const hasWarningRecords = computed(() =>
      validationResults.value.some(
        (validation) =>
          validation.offeringStatus === OfferingStatus.CreationPending,
      ),
    );

    const fileValidationRules = (files: FileInputFile[]) => {
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
      showValidationSummary.value = false;
      offeringFiles.value = [];
      csvFileUploadKey.value++;
    };

    return {
      loading,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      offeringFiles,
      uploadFile,
      validationResults,
      fileValidationRules,
      csvFileUpload,
      OfferingStatus,
      hasCriticalErrorRecords,
      hasWarningRecords,
      BannerTypes,
      uploadForm,
      ACCEPTED_FILE_TYPE,
      showValidationSummary,
      csvFileUploadKey,
      showPossibleFileChangeError,
    };
  },
};
</script>
