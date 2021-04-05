<template>
  <Message severity="info">
    Please notice that the read-only information below is retrieved from your BC
    Service Card and it is not possible to change it here. If any read-only
    information needs to be changed please visit
    <a href="http://id.gov.bc.ca" target="_blank">id.gov.bc.ca</a>.
  </Message>
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
} from "../../types/contracts/StudentContract";
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
    const initialData = ref({} as StudentFormData);
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
        const studentAllInfo = await StudentService.shared.getStudentInfo();
        const data: StudentFormData = {
          ...studentAllInfo,
          ...studentAllInfo.contact,
          givenNames: studentAllInfo.firstName,
          dateOfBirth: studentAllInfo.birthDateFormatted2,
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
    });

    return { changed, submitted, initialData };
  },
};
</script>
