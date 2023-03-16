<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header title="Profile" />
      </template>
    </body-header-container>
    <formio formName="studentProfileSummary" :data="initialData"></formio>
  </tab-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { StudentService } from "@/services/StudentService";
import { useFormatters } from "@/composables";

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const initialData = ref();
    const { sinDisplayFormat } = useFormatters();
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
        sin: sinDisplayFormat(studentDetail.sin),
      };
    });
    return {
      initialData,
      sinDisplayFormat,
    };
  },
});
</script>
