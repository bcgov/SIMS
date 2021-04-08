<template>
  <div class="p-m-4">
    <formio
      formName="fulltimeapplication"
      :data="initialData"
      @submitted="submitted"
    ></formio>
  </div>
</template>

<script lang="ts">
import formio from "../../../components/generic/formio.vue";
import { onMounted, ref, reactive } from "vue";
import { StudentService } from "../../../services/StudentService";
import ApiClient from "../../../services/http/ApiClient";
//import { StudentRoutesConst } from "../../../../constants/routes/RouteConstants";
export default {
  components: {
    formio,
  },
  props: {
    id: {
      type: String,
      required: false,
    },
  },
  setup(props: any) {
    const initialData = ref({});

    const submitted = async (args: any) => {
      console.log(args);
      if (props.id) {
        console.log("Must update");
        return;
      }

      try {
        await ApiClient.Application.createApplication(args);
      } catch (error) {
        console.error(error);
      }
    };

    onMounted(async () => {
      if (props.id) {
        const dataToLoad = await ApiClient.Application.getApplicationData(
          props.id,
        );
        console.dir(dataToLoad);
        initialData.value = dataToLoad;
      } else {
        //Get the student info from api call
        const studentInfo = await StudentService.shared.getStudentInfo();
        initialData.value = {
          studentFullName: `${studentInfo.firstName} ${studentInfo.lastName}`,
          studentGender: studentInfo.gender,
          studentDateOfBirth: studentInfo.birthDateFormatted,
          studentPhoneNumber: studentInfo.contact.phone,
          studentHomeAddress: "111-234 Esquimalt Rd Victoria BC Canada",
        };
      }
    });

    return { initialData, submitted };
  },
};
</script>

<style lang="scss">
.fa-app-header {
  font-family: Noto Sans;
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 27px;
  flex: none;
  order: 0;
  flex-grow: 0;
  margin: 4px 0px;
}
.fa-app-header-1 {
  @extend .fa-app-header;
  color: #485363;
  opacity: 0.5;
}
.fa-app-header-2 {
  @extend .fa-app-header;
  top: 31px;
  letter-spacing: -0.2px;
  color: #485363;
}
.fa-app-header-3 {
  @extend .fa-app-header;
  color: #2965c5;
  line-height: 34px;
}

.img-background {
  background-image: url("../../../assets/images/icon_assistance.svg");
}
</style>
