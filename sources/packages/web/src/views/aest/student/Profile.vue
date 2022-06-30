<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <p class="category-header-large color-blue">Profile</p>
      <formio formName="studentProfileSummary" :data="initialData"></formio>
    </div>
  </v-card>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { StudentService } from "@/services/StudentService";

export default {
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const initialData = ref();
    onMounted(async () => {
      const studentDetail = await StudentService.shared.getStudentProfile(
        props.studentId,
      );
      const address = studentDetail.contact.address;
      initialData.value = {
        firstName: studentDetail.firstName,
        lastName: studentDetail.lastName,
        gender: studentDetail.gender,
        email: studentDetail.email,
        dateOfBirth: studentDetail.birthDateFormatted,
        phone: studentDetail.contact.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        provinceState: address.provinceState,
        postalCode: address.postalCode,
        pdStatus: studentDetail.pdStatus ?? "None",
        sin: studentDetail.sin,
      };
    });
    return {
      initialData,
    };
  },
};
</script>
