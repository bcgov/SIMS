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
import { useFormatters } from "@/composables";
import formio from "@/components/generic/formio.vue";

export default {
  components: { formio },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const initialData = ref();
    const { dateOnlyLongString } = useFormatters();
    onMounted(async () => {
      const studentDetail = await StudentService.shared.getStudentDetail(
        props.studentId,
      );
      initialData.value = {
        firstName: studentDetail.firstName,
        lastName: studentDetail.lastName,
        gender: studentDetail.gender,
        email: studentDetail.email,
        dateOfBirth: dateOnlyLongString(studentDetail.dateOfBirth),
        phone: studentDetail.contact.phone,
        addressLine1: studentDetail.contact.addressLine1,
        addressLine2: studentDetail.contact.addressLine2,
        city: studentDetail.contact.city,
        provinceState: studentDetail.contact.provinceState,
        postalCode: studentDetail.contact.postalCode,
        pdStatus: studentDetail.pdStatus ?? "None",
      };
    });
    return {
      initialData,
    };
  },
};
</script>
