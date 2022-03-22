<template>
  <v-container>
    <!-- header area -->
    <div class="mb-4">
      <header-navigator title="Student" subTitle="Request a Change" />
    </div>
    <!-- Request change view-->
    <div v-if="showRequestForAppeal">
      <full-page-container>
        <!-- content area -->
        <div>
          <formio
            formName="studentrequestchange"
            @loaded="formLoaded"
            @submitted="submitRequest"
          ></formio>
        </div>
        <!-- action area -->
        <div class="mt-4">
          <v-btn
            @click="submitStudentRequest"
            class="primary-btn-background float-right"
            >Next</v-btn
          >
        </div>
      </full-page-container>
    </div>
    <!-- Appeal view-->
    <div v-else>
      <full-page-container>
        <body-header
          title="Fill in the field(s) below"
          subTitle="StudentAid BC will review your application change after you submit the fields below."
        ></body-header>
        <student-appeal-form
          v-for="formName in appealFormNames"
          :key="formName"
          :formName="formName"
          @appealFormLoaded="appealFormLoaded"
        ></student-appeal-form>
        <!-- action area -->
        <div class="mt-4">
          <v-btn color="primary" outlined @click="backToRequest">Back</v-btn>
          <v-btn
            @click="submitAppeal"
            class="primary-btn-background float-right"
            >Submit</v-btn
          >
        </div>
      </full-page-container>
    </div>
  </v-container>
</template>
<script lang="ts">
import { computed, ref } from "vue";
import { StudentRequest, StudentAppealDTO } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import formio from "@/components/generic/formio.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import BodyHeader from "@/components/generic/BodyHeader.vue";
import StudentAppealForm from "@/components/common/StudentAppealForm.vue";
import { useToastMessage } from "@/composables";
const INVALID_APPLICATION_NUMBER = "INVALID_APPLICATION_NUMBER";

export default {
  components: {
    HeaderNavigator,
    FullPageContainer,
    formio,
    BodyHeader,
    StudentAppealForm,
  },
  setup() {
    const toast = useToastMessage();
    let requestFormData: any = undefined;
    let applictionId: number;
    const appealFormNames = ref([] as string[]);
    const appealForms: any = [];
    const showRequestForAppeal = computed(
      () => appealFormNames.value.length === 0,
    );

    const formLoaded = (form: any) => {
      requestFormData = form;
    };

    const submitRequest = async (data: StudentRequest) => {
      try {
        const application = await ApplicationService.shared.getApplicationForRequestChange(
          data.applicationNumber,
        );
        applictionId = application.id;
        appealFormNames.value = data.formNames;
      } catch (error) {
        let errorMessage = "An error happened while requesting a change.";
        if (error.response.data?.errorType === INVALID_APPLICATION_NUMBER) {
          errorMessage = error.response.data.message;
        }
        toast.error("Unexpected error", errorMessage);
      }
    };

    const submitStudentRequest = async () => {
      return requestFormData.submit();
    };

    const backToRequest = () => {
      appealFormNames.value = [];
    };

    const appealFormLoaded = (form: any) => {
      appealForms.push(form);
    };

    const submitAppeal = () => {
      const studentAppeals = [] as StudentAppealDTO[];
      appealForms.forEach((form: any) => {
        form.submit();
        studentAppeals.push({
          applicationId: applictionId,
          formName: form.form.path,
          formData: form.data,
        });
      });
    };

    return {
      formLoaded,
      submitRequest,
      submitStudentRequest,
      appealFormNames,
      showRequestForAppeal,
      backToRequest,
      appealFormLoaded,
      submitAppeal,
    };
  },
};
</script>
