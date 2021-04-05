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
import { useStore } from "vuex";
import formio from "../../components/generic/formio.vue";
import { StudentService } from "../../services/StudentService";
import { sinValidationRule } from "../../validators/SinNumberValidator";
import {
  StudentInfo,
  StudentContact,
} from "../../types/contracts/StudentContract";
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

    const submitted = async (args: any) => {
      console.log(`Submission: \n ${JSON.stringify(args, null, 2)}`);
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
        console.dir(store.state.student.profile);
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
