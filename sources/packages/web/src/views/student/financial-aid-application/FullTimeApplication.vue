<template>
  <v-container class="center-container application-container">
    <div class="p-card p-m-4">
      <div class="p-p-4">
        <formio
          formName="SFAA2022-23"
          :data="initialData"
          @submitted="submitted"
        ></formio>
      </div>
    </div>
  </v-container>
</template>

<script lang="ts">
import formio from "../../../components/generic/formio.vue";
import { onMounted, ref } from "vue";
import { StudentService } from "../../../services/StudentService";
import ApiClient from "../../../services/http/ApiClient";
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
      if (props.id) {
        // TODO: Define how the update will happen.
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
        initialData.value = dataToLoad;
      } else {
        //Get the student info from api call
        const studentInfo = await StudentService.shared.getStudentInfo();

        // TODO: Move formatted address to a common place in Vue app or API.
        // Adjust the spaces when optional fields are not present.
        const address = studentInfo.contact;
        const formattedAddress = `${address.addressLine1} ${address.addressLine2} ${address.city} ${address.provinceState} ${address.postalCode}  ${address.country}`;

        initialData.value = {
          studentGivenNames: studentInfo.firstName,
          studentLastName: studentInfo.lastName,
          studentGender: studentInfo.gender,
          studentDateOfBirth: studentInfo.birthDateFormatted,
          studentPhoneNumber: studentInfo.contact.phone,
          studentHomeAddress: formattedAddress,
          studentEmail: studentInfo.email,
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

.center-container {
  display: flex;
  justify-content: center;
}

.application-container {
  max-width: 1400px;
}

.img-background {
  background-image: url("../../../assets/images/icon_assistance.svg");
  background-repeat: no-repeat;
  background-size: contain;
  width: 100%;
  height: 100%;
  min-height: 350px;
}
</style>
