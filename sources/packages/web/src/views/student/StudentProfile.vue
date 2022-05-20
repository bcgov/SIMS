<template>
  <full-page-container>
    <template #header>
      <header-navigator v-if="editMode" title="Student" subTitle="Profile" />
    </template>
    <template #alerts>
      <PDStatusApplicationModal ref="pdStatusApplicationModal" />
      <RestrictionBanner
        v-if="hasRestriction"
        :restrictionMessage="restrictionMessage"
      />
      <CheckValidSINBanner />
    </template>
    <formio
      formName="studentinformation"
      :data="initialData"
      @submitted="submitted"
      @customEvent="showPDApplicationModal"
    ></formio>
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import {
  ModalDialog,
  useToastMessage,
  useAuthBCSC,
  useFormatters,
  useStudentStore,
} from "@/composables";
import { StudentService } from "../../services/StudentService";
import {
  StudentContact,
  StudentFormInfo,
  StudentPDStatus,
} from "@/types/contracts/StudentContract";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";
import PDStatusApplicationModal from "@/components/students/modals/PDStatusApplicationModal.vue";
import { StudentProfileAPIOutDTO } from "@/services/http/dto/Student.dto";

enum FormModes {
  edit = "edit",
  create = "create",
}

type StudentFormData = Pick<
  StudentProfileAPIOutDTO,
  "firstName" | "lastName" | "gender" | "email"
> &
  StudentContact & {
    givenNames: string;
    dateOfBirth: string;
    mode: FormModes;
  };

export default {
  components: {
    RestrictionBanner,
    CheckValidSINBanner,
    PDStatusApplicationModal,
  },
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
    const initialData = ref({} as StudentFormData);
    const studentAllInfo = ref({} as StudentFormInfo);
    const { bcscParsedToken } = useAuthBCSC();
    const { dateOnlyLongString } = useFormatters();
    const { hasStudentAccount } = useStudentStore();
    const hasRestriction = ref(false);
    const restrictionMessage = ref("");
    const pdStatusApplicationModal = ref({} as ModalDialog<boolean>);

    const getStudentInfo = async () => {
      if (hasStudentAccount) {
        // Avoid calling the API to get the student information if the
        // account is not created yet.
        studentAllInfo.value = await StudentService.shared.getStudentProfile();
      }
    };

    const showPendingStatus = computed(
      () => studentAllInfo.value.pdStatus === StudentPDStatus.Pending,
    );

    const getStudentDetails = async () => {
      const studentRestriction =
        await StudentService.shared.getStudentRestriction();
      hasRestriction.value = studentRestriction.hasRestriction;
      restrictionMessage.value = studentRestriction.restrictionMessage;
      if (props.editMode) {
        await getStudentInfo();
        const data: StudentFormData = {
          ...studentAllInfo.value,
          ...studentAllInfo.value.contact.address,
          phone: studentAllInfo.value.contact.phone,
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
    };

    const applyPDStatus = async () => {
      try {
        await StudentService.shared.applyForPDStatus();
        toast.success(
          "Applied for PD Status!",
          "Your application is submitted. The outcome will display on your profile",
        );
      } catch (error) {
        toast.error(
          "Unexpected error",
          "An error happened during the apply PD process. Please try after sometime.",
        );
      }
      await getStudentDetails();
    };

    const showPDApplicationModal = async () => {
      if (await pdStatusApplicationModal.value.showModal()) {
        await applyPDStatus();
      }
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
      await getStudentDetails();
    });

    return {
      submitted,
      initialData,
      applyPDStatus,
      showApplyPDButton,
      studentAllInfo,
      showPendingStatus,
      hasRestriction,
      restrictionMessage,
      pdStatusApplicationModal,
      showPDApplicationModal,
    };
  },
};
</script>
