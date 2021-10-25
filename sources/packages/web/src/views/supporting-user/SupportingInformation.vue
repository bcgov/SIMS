<template>
  <full-page-container>
    <content-group class="mb-4">
      <p class="category-header-medium primary-color">
        Student Application Information
      </p>
      <p>
        Please enter below the information to search for the application that
        you will be providing supporting information. All the fields are
        mandatory and must macth exactly the information provided on the student
        application.
      </p>
      <v-row>
        <v-col
          ><div class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-12 p-md-4">
              <label class="field-required" for="applicationNumber"
                >Application Number</label
              >
              <InputNumber
                name="applicationNumber"
                :format="false"
                :useGrouping="false"
                :allowEmpty="true"
                v-model="applicationNumber"
              />
            </div>
            <div class="p-field p-col-12 p-md-4">
              <label class="field-required" for="studentsLastName"
                >Student's Last Name</label
              >
              <InputText name="studentsLastName" v-model="studentsLastName" />
            </div>
            <div class="p-field p-col-12 p-md-4">
              <label class="field-required" for="studentsLastName"
                >Student's Date Of Birth</label
              >
              <Calendar
                v-model="studentsDateOfBirth"
                :editable="true"
                :showIcon="false"
                dateFormat="yy-mm-dd"
              />
            </div></div
        ></v-col>
        <v-col class="mt-9" cols="auto"
          ><v-btn
            color="primary"
            :disabled="!canSearch"
            @click="applicationSearch"
            >Search</v-btn
          ></v-col
        >
      </v-row>
    </content-group>
    <formio
      v-if="formName"
      :formName="formName"
      :data="initialData"
      :readOnly="submitting"
      @submitted="submitted"
    ></formio>
  </full-page-container>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import { useRouter } from "vue-router";
import { useAuthBCSC, useFormatters, useToastMessage } from "@/composables";
import { SupportingUsersService } from "@/services/SupportingUserService";
import { SupportingUserRoutesConst } from "@/constants/routes/RouteConstants";
import { ref, computed } from "vue";
import {
  STUDENT_APPLICATION_NOT_FOUND,
  SUPPORTING_USER_ALREADY_PROVIDED_DATA,
  SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA,
  SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION,
} from "@/types";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";
export default {
  components: {
    formio,
    FullPageContainer,
    ContentGroup,
  },
  props: {
    supportingUserType: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const toast = useToastMessage();
    const TOAST_ERROR_DISPLAY_TIME = 15000;
    const { dateOnlyLongString } = useFormatters();
    const { bcscParsedToken } = useAuthBCSC();
    const submitting = ref(false);
    const formName = ref();
    const applicationNumber = ref("");
    const studentsLastName = ref("");
    const studentsDateOfBirth = ref<Date>();
    const initialData = ref();

    const setInitialData = (programYearStartDate: Date) => {
      initialData.value = {
        givenNames: bcscParsedToken.givenNames,
        lastName: bcscParsedToken.lastName,
        email: bcscParsedToken.email,
        gender: bcscParsedToken.gender,
        dateOfBirth: dateOnlyLongString(bcscParsedToken.birthdate),
        programYearStartDate,
      };
    };

    /**
     * The 3 pieces of information necessary to identify a Student application.
     * Used for search the application and submit supporting information.
     */
    const getIdentifiedApplication = () => ({
      applicationNumber: applicationNumber.value,
      studentsLastName: studentsLastName.value,
      studentsDateOfBirth: studentsDateOfBirth.value as Date,
    });

    const applicationSearch = async () => {
      try {
        const searchResult = await SupportingUsersService.shared.getApplicationDetails(
          props.supportingUserType,
          getIdentifiedApplication(),
        );
        setInitialData(searchResult.programYearStartDate);
        formName.value = searchResult.formName;
      } catch (error) {
        formName.value = null;
        switch (error.response.data.errorType) {
          case STUDENT_APPLICATION_NOT_FOUND:
            toast.warn("Application not found", error.response.data.message);
            break;
          case SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION:
            toast.error(
              "The student cannot act as a supporting user for its own application.",
              error.response.data.message,
              TOAST_ERROR_DISPLAY_TIME,
            );
            break;
        }
      }
    };

    const submitted = async (formData: any) => {
      submitting.value = true;
      try {
        await SupportingUsersService.shared.updateSupportingInformation(
          props.supportingUserType,
          { ...formData, ...getIdentifiedApplication() },
        );
        toast.success("Success", "Supporting data submitted with success.");
        router.push({ name: SupportingUserRoutesConst.DASHBOARD });
      } catch (error) {
        switch (error.response.data.errorType) {
          case STUDENT_APPLICATION_NOT_FOUND:
            toast.error(
              "Application not found",
              error.response.data.message,
              TOAST_ERROR_DISPLAY_TIME,
            );
            break;
          case SUPPORTING_USER_ALREADY_PROVIDED_DATA:
            toast.warn(
              "User already provided data",
              error.response.data.message,
              TOAST_ERROR_DISPLAY_TIME,
            );
            break;
          case SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA:
            toast.warn(
              `Not expecting data for a ${props.supportingUserType}`,
              error.response.data.message,
              TOAST_ERROR_DISPLAY_TIME,
            );
            break;
          case SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION:
            toast.error(
              "The student cannot act as a supporting user for its own application.",
              error.response.data.message,
              TOAST_ERROR_DISPLAY_TIME,
            );
            break;
          default:
            toast.error(
              "Unexpected error",
              "Unexpected error while submitting the supporting data.",
              TOAST_ERROR_DISPLAY_TIME,
            );
            break;
        }
      } finally {
        submitting.value = false;
      }
    };

    const canSearch = computed(() => {
      return (
        !!applicationNumber.value &&
        !!studentsDateOfBirth.value &&
        !!studentsLastName.value
      );
    });

    return {
      formName,
      initialData,
      submitted,
      submitting,
      applicationNumber,
      studentsDateOfBirth,
      studentsLastName,
      canSearch,
      applicationSearch,
    };
  },
};
</script>
