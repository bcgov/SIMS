<template>
  <RestrictionBanner
    v-if="hasRestriction"
    :restrictionMessage="restrictionMessage"
  />
  <CheckValidSINBanner />
  <full-page-container>
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
      <Message severity="warn" :closable="false" v-if="showPendingStatus">
        <strong>PD Status: Pending</strong>
      </Message>
      <Message
        severity="success"
        :closable="false"
        v-if="studentAllInfo.pdVerified === true"
      >
        <strong>PD Status: PD Confirmed</strong>
      </Message>
      <Message
        severity="error"
        :closable="false"
        v-if="studentAllInfo.pdVerified === false"
      >
        <strong>PD Status: PD Denied</strong>
      </Message>
    </span>
    <formio
      formName="studentinformation"
      :data="initialData"
      @submitted="submitted"
    ></formio>
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import {
  useToastMessage,
  useAuthBCSC,
  useFormatters,
  useStudentStore,
} from "@/composables";
import formio from "@/components/generic/formio.vue";
import { StudentService } from "../../services/StudentService";
import {
  StudentInfo,
  StudentContact,
  StudentFormInfo,
} from "@/types/contracts/StudentContract";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";

enum FormModes {
  edit = "edit",
  create = "create",
}

type StudentFormData = Pick<
  StudentInfo,
  "firstName" | "lastName" | "gender" | "email"
> &
  StudentContact & {
    givenNames: string;
    dateOfBirth: string;
    mode: FormModes;
  };

export default {
  components: { formio, RestrictionBanner, FullPageContainer, CheckValidSINBanner },
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
    const toast = useToastMessage();
    const showApplyPDButton = ref();
    const disableBtn = ref(false);
    const initialData = ref({} as StudentFormData);
    const studentAllInfo = ref({} as StudentFormInfo);
    const { bcscParsedToken } = useAuthBCSC();
    const { dateOnlyLongString } = useFormatters();
    const { hasStudentAccount } = useStudentStore();
    const hasRestriction = ref(false);
    const restrictionMessage = ref("");

    const getStudentInfo = async () => {
      if (hasStudentAccount) {
        // Avoid calling the API to get the student information if the
        // account is not created yet.
        studentAllInfo.value = await StudentService.shared.getStudentInfo();
      }
    };

    const showPendingStatus = computed(
      () =>
        studentAllInfo.value.pdSentDate &&
        studentAllInfo.value.pdUpdatedDate === null &&
        studentAllInfo.value.pdVerified === null,
    );

    const appliedPDButton = () => {
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
        toast.success("Applied for PD Status!", "Successfully!");
      } catch (error) {
        toast.error(
          "Unexpected error",
          "An error happened during the apply PD process. Please try after sometime.",
        );
      }
      await getStudentInfo();
      appliedPDButton();
      disableBtn.value = false;
    };

    const submitted = async (args: StudentContact & { sinNumber?: string }) => {
      try {
        if (props.editMode) {
          await StudentService.shared.updateStudent(args);
          toast.success(
            "Student Updated",
            "Student contact information updated!",
          );
        } else {
          await StudentService.shared.createStudent(args);
          await store.dispatch("student/setHasStudentAccount", true);
          toast.success("Student created", "Student was successfully created!");
        }
        router.push({ name: StudentRoutesConst.STUDENT_DASHBOARD });
      } catch {
        toast.error("Error", "Error while saving student");
      }
    };

    onMounted(async () => {
      const studentRestriction = await StudentService.shared.getStudentRestriction();
      hasRestriction.value = studentRestriction.hasRestriction;
      restrictionMessage.value = studentRestriction.restrictionMessage;
      if (props.editMode) {
        await getStudentInfo();
        const data: StudentFormData = {
          ...studentAllInfo.value,
          ...studentAllInfo.value.contact,
          givenNames: studentAllInfo.value.firstName,
          dateOfBirth: dateOnlyLongString(studentAllInfo.value.dateOfBirth),
          mode: FormModes.edit,
        };
        initialData.value = data;
      } else {
        const data = {} as StudentFormData;
        initialData.value = {
          ...data,
          firstName: bcscParsedToken.givenNames,
          lastName: bcscParsedToken.lastName,
          email: bcscParsedToken.email,
          gender: bcscParsedToken.gender,
          dateOfBirth: dateOnlyLongString(bcscParsedToken.birthdate),
          mode: FormModes.create,
        };
      }
      await getStudentInfo();
      appliedPDButton();
    });

    return {
      submitted,
      initialData,
      applyPDStatus,
      showApplyPDButton,
      studentAllInfo,
      disableBtn,
      showPendingStatus,
      hasRestriction,
      restrictionMessage,
    };
  },
};
</script>
