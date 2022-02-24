<template>
  <full-page-container>
    {{ formName }}----
    <formio
      v-if="formName"
      :formName="formName"
      :data="formData"
      :readOnly="true"
    ></formio>
  </full-page-container>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { ref, onMounted } from "vue";
import { SupportingUsersService } from "@/services/SupportingUserService";

export default {
  components: {
    formio,
    FullPageContainer,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    supportingUserId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const formName = ref();
    const formData = ref();

    onMounted(async () => {
      // alert("hello");
      const supportingUsersData = await SupportingUsersService.shared.getSupportingUserData(
        props.applicationId,
        props.supportingUserId,
      );
      // alert(supportingUsersData);
      formName.value = supportingUsersData.formName;
      formData.value = supportingUsersData.formData;
    });
    return { formName, formData };
  },
};
</script>
