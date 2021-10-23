<template>
  <full-page-container>
    <content-group class="mb-4">
      <p class="category-header-medium primary-color">
        Student Application Information
      </p>
      <p>
        Please enter below the information to search for the application that
        you will be providing supporting information. All the fields are
        mandatory.
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
          ><v-btn color="primary" :disabled="!canSearch">Search</v-btn></v-col
        >
      </v-row>
    </content-group>
    <formio
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
  SupportingUserType,
  STUDENT_APPLICATION_NOT_FOUND,
  SUPPORTING_USER_ALREADY_PROVIDED_DATA,
  SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA,
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
    const initialData = ref();
    const applicationNumber = ref("");
    const studentsDateOfBirth = ref();
    const studentsLastName = ref("");

    initialData.value = {
      ...bcscParsedToken,
      dateOfBirth: dateOnlyLongString(bcscParsedToken.birthdate),
    };

    const formName = computed(() => {
      switch (props.supportingUserType) {
        case SupportingUserType.Parent:
          return "supportingusersparent";
        case SupportingUserType.Partner:
          return "supportinguserspartner";
        default:
          throw new Error(
            `Not able to define the form definition to load. Received unknown user type ${props.supportingUserType}.`,
          );
      }
    });

    const submitted = async (formData: any) => {
      submitting.value = true;
      try {
        await SupportingUsersService.shared.updateSupportingInformation(
          props.supportingUserType,
          formData,
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
              `${props.supportingUserType} already provided data`,
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
    };
  },
};
</script>
