<template>
  <Message severity="info">
    Please notice that the read-only information below is retrieved from your BC
    Service Card and it is not possible to change it here. If any read-only
    information needs to be changed please visit
    <a href="http://id.gov.bc.ca" target="_blank">id.gov.bc.ca</a>.
  </Message>
  <span v-if="showApplyPDButton">
    <v-btn
      color="primary"
      @click="applyPDStatus()"
      v-if="showApplyPDButton"
      :disabled="disableBtn"
    >
      Apply for PD status
      <span v-if="disableBtn">
        &nbsp;&nbsp;
        <ProgressSpinner style="width:30px;height:25px" strokeWidth="10"
      /></span>
    </v-btn>
  </span>
  <span v-else>
    <Message
      severity="warn"
      :closable="false"
      v-if="
        studentAllInfo?.pdSentDate &&
          studentAllInfo?.pdUpdatedDate === null &&
          studentAllInfo?.pdVerified === null
      "
    >
      <strong>PD Status: Pending</strong>
    </Message>
    <Message
      severity="success"
      :closable="false"
      v-if="studentAllInfo?.pdVerified === true"
    >
      <strong>PD Status: PD Confirmed</strong>
    </Message>
    <Message
      severity="error"
      :closable="false"
      v-if="studentAllInfo?.pdVerified === false"
    >
      <strong>PD Status: PD Denied</strong>
    </Message>
  </span>

  <Card class="p-m-4">
    <template #content>
      <formio
        formName="studentinformation"
        :data="initialData"
        @changed="changed"
        @submitted="submitted"
      ></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { useToast } from "primevue/usetoast";
import formio from "../../components/generic/formio.vue";
import { StudentService } from "../../services/StudentService";
import { sinValidationRule } from "../../validators/SinNumberValidator";
import {
  StudentInfo,
  StudentContact,
  StudentFormInfo,
} from "@/types/contracts/StudentContract";
import { StudentRoutesConst } from "../../constants/routes/RouteConstants";
// import ApiClient from "../../services/http/ApiClient";

type StudentFormData = Pick<
  StudentInfo,
  "firstName" | "lastName" | "gender" | "email"
> &
  StudentContact & {
    givenNames: string;
    dateOfBirth: string;
    mode: string;
    isSinValid?: boolean;
  };

export default {
  components: { formio },
  props: {
    editMode: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  setup(props: any) {
    const store = useStore();
    const router = useRouter();
    const toast = useToast();
    const showApplyPDButton = ref();
    const disableBtn = ref(false);
    const initialData = ref({} as StudentFormData);
    const studentAllInfo = ref({} as StudentFormInfo);
    const getStudentInfo = async () => {
      studentAllInfo.value = await StudentService.shared.getStudentInfo();
    };
    const appliedPDButton = async () => {
      showApplyPDButton.value = false;
      if (
        studentAllInfo.value?.validSin &&
        studentAllInfo.value?.pdSentDate === null &&
        studentAllInfo.value?.pdVerified === null
      ) {
        showApplyPDButton.value = true;
      }
    };
    const applyPDStatus = async () => {
      disableBtn.value = true;
      try {
        await StudentService.shared.applyForPDStatus();
        toast.add({
          severity: "success",
          summary: `Applied for PD Status!`,
          detail: " Successfully!",
          life: 5000,
        });
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Unexpected error",
          detail:
            "An error happened during the apply PD process. Please try after sometime.",
          life: 5000,
        });
      }
      await getStudentInfo();
      await appliedPDButton();
      disableBtn.value = false;
    };
    const changed = (form: any, event: any) => {
      if (
        event.changed &&
        event.changed.component.key === "sin" &&
        event.changed.value
      ) {
        const value = event.changed.value;
        const isValidSin = sinValidationRule(value);
        const newSubmissionData: StudentFormData = {
          ...event.data,
          isSinValid: isValidSin,
        };

        form.submission = {
          data: newSubmissionData,
        };
      }
    };

    const submitted = async (args: StudentContact & { sin?: string }) => {
      let redirectHome = true;
      console.log(`Submission: \n ${JSON.stringify(args, null, 2)}`);
      if (props.editMode) {
        await StudentService.shared.updateStudent(args);
        toast.add({
          severity: "success",
          summary: "Student Updated",
          detail: "Student contact information updated!",
          life: 3000,
        });
      } else {
        const result = await StudentService.shared.createStudent({
          ...args,
          sinNumber: args.sin || "",
        });
        if (result === true) {
          toast.add({
            severity: "success",
            summary: "Student created",
            detail: "Student was successfully created!",
            life: 3000,
          });
        } else {
          redirectHome = false;
          toast.add({
            severity: "error",
            summary: "Error",
            detail: `Error while creating student: ${result}`,
            life: 3000,
          });
        }
      }

      if (redirectHome) {
        router.push({ name: StudentRoutesConst.STUDENT_DASHBOARD });
      }
    };

    onMounted(async () => {
      if (props.editMode) {
        await getStudentInfo();
        const data: StudentFormData = {
          ...studentAllInfo.value,
          ...studentAllInfo.value.contact,
          givenNames: studentAllInfo.value.firstName,
          dateOfBirth: studentAllInfo.value.birthDateFormatted2,
          mode: "edit",
        };
        initialData.value = data;
      } else {
        const profile = store.state.student.profile;
        const obj: StudentFormData = {
          ...profile,
          firstName: profile.givenNames,
          dateOfBirth: profile.birthdate,
          mode: "create",
        };
        initialData.value = obj;
      }
      await getStudentInfo();
      await appliedPDButton();
    });

    return {
      changed,
      submitted,
      initialData,
      applyPDStatus,
      showApplyPDButton,
      studentAllInfo,
      disableBtn,
    };
  },
};
</script>
