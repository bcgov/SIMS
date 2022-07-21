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
        <v-col>
          <v-text-field
            density="compact"
            label="Application Number"
            variant="outlined"
            v-model="applicationNumber"
            data-cy="applicationNumber"
            type="number"
            :rules="[(v) => /\d+/.test(v) || 'Invalid Application Number']"
          />
        </v-col>
        <v-col>
          <v-text-field
            density="compact"
            label="Students Last Name"
            variant="outlined"
            v-model="studentsLastName"
            data-cy="studentsLastName"
            :rules="[(v) => !!v || 'Students Last Name Required']"
          />
        </v-col>
        <v-col>
          <v-text-field
            density="compact"
            label="Student's Date Of Birth"
            variant="outlined"
            v-model="studentsDateOfBirth"
            data-cy="studentsDateOfBirth"
            type="date"
            :rules="[(v) => !!v || 'Student\'s Date Of Birth Required']"
          />
        </v-col>
        <v-col
          ><v-btn color="primary" @click="applicationSearch"
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
import { useRouter } from "vue-router";
import { useAuthBCSC, useFormatters, useSnackBar } from "@/composables";
import { SupportingUsersService } from "@/services/SupportingUserService";
import { SupportingUserRoutesConst } from "@/constants/routes/RouteConstants";
import { ref } from "vue";
import {
  STUDENT_APPLICATION_NOT_FOUND,
  SUPPORTING_USER_ALREADY_PROVIDED_DATA,
  SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA,
  SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION,
} from "@/types";
import useEmitter from "@/composables/useEmitter";

export default {
  props: {
    supportingUserType: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const emitter = useEmitter();
    const router = useRouter();
    const toast = useSnackBar();
    const { dateOnlyLongString } = useFormatters();
    const { bcscParsedToken } = useAuthBCSC();
    const submitting = ref(false);
    const formName = ref();
    const applicationNumber = ref("");
    const studentsLastName = ref("");
    const studentsDateOfBirth = ref();
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
      studentsDateOfBirth: studentsDateOfBirth.value,
    });

    const applicationSearch = async () => {
      if (
        !applicationNumber.value ||
        !studentsLastName.value ||
        !studentsDateOfBirth.value
      ) {
        emitter.emit(
          "snackBar",
          toast.warn("Please complete all the mandatory fields."),
        );
        return;
      }

      if (isNaN(Date.parse(studentsDateOfBirth.value))) {
        emitter.emit(
          "snackBar",
          toast.warn("Please check the Student's Date Of Birth."),
        );
        return;
      }

      try {
        const searchResult =
          await SupportingUsersService.shared.getApplicationDetails(
            props.supportingUserType,
            getIdentifiedApplication(),
          );
        setInitialData(searchResult.programYearStartDate);
        formName.value = searchResult.formName;
      } catch (error) {
        formName.value = null;
        switch (error.response.data.errorType) {
          case STUDENT_APPLICATION_NOT_FOUND:
            emitter.emit(
              "snackBar",
              toast.warn(
                `Application not found. ${error.response.data.message}`,
              ),
            );
            break;
          case SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION:
            emitter.emit(
              "snackBar",
              toast.error(
                `The student cannot act as a supporting user for its own application.
              ${error.response.data.message}`,
                toast.EXTENDED_MESSAGE_DISPLAY_TIME,
              ),
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
        emitter.emit(
          "snackBar",
          toast.success("Supporting data submitted with success."),
        );
        router.push({ name: SupportingUserRoutesConst.DASHBOARD });
      } catch (error) {
        switch (error.response.data.errorType) {
          case STUDENT_APPLICATION_NOT_FOUND:
            emitter.emit(
              "snackBar",
              toast.error(
                error.response.data.message,
                toast.EXTENDED_MESSAGE_DISPLAY_TIME,
              ),
            );
            break;
          case SUPPORTING_USER_ALREADY_PROVIDED_DATA:
            emitter.emit(
              "snackBar",
              toast.warn(
                `User already provided data.
              ${error.response.data.message}`,
                toast.EXTENDED_MESSAGE_DISPLAY_TIME,
              ),
            );
            break;
          case SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA:
            emitter.emit(
              "snackBar",
              toast.warn(
                `Not expecting data for a ${props.supportingUserType}.
              ${error.response.data.message}`,
                toast.EXTENDED_MESSAGE_DISPLAY_TIME,
              ),
            );
            break;
          case SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION:
            toast.error(
              `The student cannot act as a supporting user for its own application. ${error.response.data.message}`,
              toast.EXTENDED_MESSAGE_DISPLAY_TIME,
            );
            break;
          default:
            emitter.emit(
              "snackBar",
              toast.error(
                "Unexpected error while submitting the supporting data.",
                toast.EXTENDED_MESSAGE_DISPLAY_TIME,
              ),
            );
            break;
        }
      } finally {
        submitting.value = false;
      }
    };

    return {
      formName,
      initialData,
      submitted,
      submitting,
      applicationNumber,
      studentsDateOfBirth,
      studentsLastName,
      applicationSearch,
    };
  },
};
</script>
