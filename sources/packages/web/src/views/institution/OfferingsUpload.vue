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
          Select the file in a CSV (comma separated values) to be uploaded. The
          files must be in the correct formatted as per SABC instructions.
        </li>
        <li>
          Click on 'Validate' to ensure that the file is in the proper format.
          The validation can happen multiple times and no data will be changed.
        </li>
        <li>
          Once there are no errors that will prevent the file to be uploaded the
          'Upload now' button will be enabled to perform the insert of all
          offerings presents on the file.
        </li>
      </ul>
      <p class="category-header-small primary-color">Upload notes</p>
      <ul class="m-4">
        <li>
          The upload will be execute for all records present in the CSV file.
          Any unexpected error during the file processing will abort the entire
          operation and a list of errors will be displayed. This procedure will
          allow the file to be fixed and uploaded again.
        </li>
        <li>
          The errors listed as a result of the file validation can be classified
          as 'critical' or 'warning'. All critical errors must be fixed to allow
          the offerings to be inserted.
        </li>
        <li>
          A file can be uploaded with warning errors, but all record that
          contain at least one warning will required a Ministry approval and
          will have its status defined as 'Creation Pending'.
        </li>
        <li>
          All records with no errors and no warnings will have its status
          automatically set to 'Approved'.
        </li>
      </ul>
      <horizontal-separator />
      <v-row class="m-0 p-0">
        <v-file-input
          ref="csvFileUpload"
          density="compact"
          accept="text/csv"
          v-model="offeringFile"
          show-size
          label="Offering CSV file"
          variant="outlined"
          data-cy="fileUpload"
          prepend-icon="fa:fa-solid fa-file-csv"
          :rules="fileValidationRules"
        >
        </v-file-input>
        <v-btn
          class="ml-2"
          color="primary"
          prepend-icon="fa:fa-solid fa-file-circle-question"
          @click="validateFile"
        >
          Validate
        </v-btn>
        <v-btn
          class="ml-2"
          color="primary"
          prepend-icon="fa:fa-solid fa-upload"
          @click="uploadFile"
        >
          Upload now
        </v-btn>
      </v-row>
      <content-group>
        <p class="category-header-small primary-color">Validation summary</p>
        <p>
          You file is ready to be imported. Please check below summary of the
          statuses that the records will be set after the process is completed.
          If the numbers are not as expected it is possible that the file need
          some data adjustment.
        </p>
        <ul class="m-4">
          <li>
            123 record(s) will be created with the status defined as
            <status-chip-offering :status="OfferingStatus.Approved" />
          </li>
          <li>
            123 record(s) will be created with the status defined as
            <status-chip-offering :status="OfferingStatus.CreationPending" />
          </li>
        </ul>
        <content-group>
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
} from "@/types";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import StatusChipOffering from "@/components/generic/StatusChipOffering.vue";

export default {
  components: {
    StatusChipOffering,
  },
  setup() {
    const loading = ref(false);
    const offeringFile = ref();
    const csvFileUpload = ref({} as { reset: () => void });
    const validationResults = ref([] as OfferingsUploadBulkInsert[]);

    const validateFile = async () => {
      try {
        console.log(offeringFile.value);
        const uploadResults =
          await EducationProgramOfferingService.shared.offeringBulkInsert(
            offeringFile.value[0],
            (progressEvent: any) => {
              console.log(progressEvent);
            },
            true,
          );
        if (uploadResults.length) {
          validationResults.value = uploadResults;
          console.log(uploadResults);
        } else {
          console.log("Successfully uploaded");
        }
        console.log(uploadResults);
      } catch (error: unknown) {
        console.log(error);
      }
    };

    const fileValidationRules = [
      (value: any) => {
        console.log(value);
        if (value?.length !== 1) {
          return "CSV file is required.";
        }
        return (
          value[0].size < 4194304 ||
          "CSV file size should not be greater than 4MB"
        );
      },
    ];

    return {
      loading,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      offeringFile,
      validateFile,
      validationResults,
      fileValidationRules,
      csvFileUpload,
      OfferingStatus,
    };
  },
};
</script>
